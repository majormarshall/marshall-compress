import type { Job } from 'bullmq';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

export interface CompressionJobData {
  jobId: string;
  userId: string;
  fileId: string;
  fileKey: string;
  mimeType: string;
  outputFormat?: string;
  preset: 'ECONOMY' | 'BALANCED' | 'MAXIMUM';
  settings?: {
    quality?: number;
    width?: number;
    height?: number;
  };
}

type CompressionPreset = { quality: number };

const PRESETS: Record<string, CompressionPreset> = {
  ECONOMY: { quality: 60 },
  BALANCED: { quality: 75 },
  MAXIMUM: { quality: 90 },
};

export class CompressionProcessor {
  private readonly s3: S3Client;
  private readonly supabase;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'marshall-storage';

    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  async process(job: Job<CompressionJobData>): Promise<void> {
    const data = job.data;
    console.log(`[Compression] Processing job ${data.jobId}, file: ${data.fileKey}`);

    // Update job status to PROCESSING
    await this.updateJobStatus(data.jobId, 'PROCESSING');
    await job.updateProgress(5);

    // Determine compression strategy by mime type
    const isImage = data.mimeType.startsWith('image/');
    const isVideo = data.mimeType.startsWith('video/');
    const isAudio = data.mimeType.startsWith('audio/');

    if (!isImage && !isVideo && !isAudio) {
      throw new Error(`Unsupported mime type for compression: ${data.mimeType}`);
    }

    // Download source file from storage
    const tmpDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'marshall-'));
    const inputPath = path.join(tmpDir, `input-${data.jobId}`);
    const outputExt = this.getOutputExtension(data.mimeType, data.outputFormat);
    const outputPath = path.join(tmpDir, `output-${data.jobId}.${outputExt}`);

    try {
      await this.downloadFile(data.fileKey, inputPath);
      await job.updateProgress(20);

      // Compress
      let outputMimeType = data.mimeType;
      if (isImage) {
        outputMimeType = await this.compressImage(data, inputPath, outputPath);
      } else {
        // Video/audio — compression via ffmpeg would go here.
        // For now, copy the original (ffmpeg integration is a separate setup step).
        await fsPromises.copyFile(inputPath, outputPath);
        console.log(`[Compression] Video/audio compression skipped (ffmpeg not configured); passing through original.`);
      }
      await job.updateProgress(70);

      // Get file sizes for ratio calculation
      const inputStat = await fsPromises.stat(inputPath);
      const outputStat = await fsPromises.stat(outputPath);
      const compressionRatio = inputStat.size > 0
        ? parseFloat((1 - outputStat.size / inputStat.size).toFixed(4))
        : 0;

      // Upload compressed result
      const outputKey = this.buildOutputKey(data.fileKey, outputExt, data.jobId);
      await this.uploadFile(outputPath, outputKey, outputMimeType);
      await job.updateProgress(90);

      // Build output URL
      const outputUrl = `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${this.bucket}/${outputKey}`;

      // Persist compressed_files record and mark job COMPLETED
      await this.saveCompressedFile({
        jobId: data.jobId,
        userId: data.userId,
        originalFileId: data.fileId,
        name: path.basename(outputKey),
        mimeType: outputMimeType,
        sizeByes: outputStat.size,
        storageKey: outputKey,
        storageUrl: outputUrl,
        compressionRatio,
      });

      await this.updateJobStatus(data.jobId, 'COMPLETED', compressionRatio);
      await job.updateProgress(100);

      console.log(
        `[Compression] Job ${data.jobId} done. Ratio: ${(compressionRatio * 100).toFixed(1)}%`,
      );
    } finally {
      // Cleanup temp files
      await fsPromises.rm(tmpDir, { recursive: true, force: true });
    }
  }

  // ─────────────────────────── Image Compression ───────────────────────────

  private async compressImage(
    data: CompressionJobData,
    inputPath: string,
    outputPath: string,
  ): Promise<string> {
    const preset = PRESETS[data.preset] ?? PRESETS.BALANCED;
    const quality = data.settings?.quality ?? preset.quality;
    const outputFormat = (data.outputFormat || 'webp').toLowerCase();

    let pipeline = sharp(inputPath);

    // Resize if dimensions specified
    if (data.settings?.width || data.settings?.height) {
      pipeline = pipeline.resize(data.settings.width, data.settings.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Format-specific output
    switch (outputFormat) {
      case 'avif':
        await pipeline.avif({ quality, effort: 4 }).toFile(outputPath);
        return 'image/avif';
      case 'jpeg':
      case 'jpg':
        await pipeline.jpeg({ quality, mozjpeg: true }).toFile(outputPath);
        return 'image/jpeg';
      case 'png':
        await pipeline.png({ quality, compressionLevel: 9 }).toFile(outputPath);
        return 'image/png';
      case 'webp':
      default:
        await pipeline.webp({ quality, effort: 4 }).toFile(outputPath);
        return 'image/webp';
    }
  }

  // ─────────────────────────── Storage helpers ───────────────────────────

  private async downloadFile(key: string, destPath: string): Promise<void> {
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    const body = response.Body;
    if (!body) throw new Error(`Empty body for key: ${key}`);

    const fileStream = fs.createWriteStream(destPath);
    await new Promise<void>((resolve, reject) => {
      (body as NodeJS.ReadableStream).pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  }

  private async uploadFile(srcPath: string, key: string, mimeType: string): Promise<void> {
    const fileBuffer = await fsPromises.readFile(srcPath);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      }),
    );
  }

  // ─────────────────────────── DB helpers ───────────────────────────

  private async updateJobStatus(
    jobId: string,
    status: string,
    compressionRatio?: number,
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'PROCESSING') updates.started_at = new Date().toISOString();
    if (status === 'COMPLETED') {
      updates.completed_at = new Date().toISOString();
      if (compressionRatio !== undefined) updates.compression_ratio = compressionRatio;
    }

    await this.supabase.from('compression_jobs').update(updates).eq('id', jobId);
  }

  private async saveCompressedFile(params: {
    jobId: string;
    userId: string;
    originalFileId: string;
    name: string;
    mimeType: string;
    sizeByes: number;
    storageKey: string;
    storageUrl: string;
    compressionRatio: number;
  }): Promise<void> {
    await this.supabase.from('compressed_files').insert({
      job_id: params.jobId,
      user_id: params.userId,
      original_file_id: params.originalFileId,
      name: params.name,
      mime_type: params.mimeType,
      size_bytes: params.sizeByes,
      storage_key: params.storageKey,
      storage_url: params.storageUrl,
      compression_ratio: params.compressionRatio,
      created_at: new Date().toISOString(),
    });
  }

  // ─────────────────────────── Utils ───────────────────────────

  private getOutputExtension(mimeType: string, outputFormat?: string): string {
    if (outputFormat && outputFormat !== 'auto') return outputFormat.replace('image/', '');
    if (mimeType.startsWith('image/')) return 'webp';
    if (mimeType.startsWith('video/')) return 'mp4';
    if (mimeType.startsWith('audio/')) return 'mp3';
    return 'bin';
  }

  private buildOutputKey(inputKey: string, ext: string, jobId: string): string {
    const dir = path.dirname(inputKey);
    const base = path.basename(inputKey, path.extname(inputKey));
    return `${dir}/compressed-${base}-${jobId}.${ext}`;
  }
}
