import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { workerConfig } from '../config/worker.config';

export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = workerConfig.r2.bucketName;
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: workerConfig.r2.endpoint,
      credentials: {
        accessKeyId: workerConfig.r2.accessKeyId,
        secretAccessKey: workerConfig.r2.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Downloads an object from S3/R2 storage to a local temporary file.
   * Returns the absolute path of the downloaded temp file.
   */
  async downloadToTemp(storageKey: string): Promise<string> {
    await fs.promises.mkdir(workerConfig.tempDir, { recursive: true });

    const ext = path.extname(storageKey);
    const uniqueId = crypto.randomUUID();
    const tempFileName = `input-${uniqueId}${ext}`;
    const tempFilePath = path.join(workerConfig.tempDir, tempFileName);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Empty response body received from storage for key: "${storageKey}"`);
    }

    const writeStream = fs.createWriteStream(tempFilePath);
    await pipeline(response.Body as Readable, writeStream);

    return tempFilePath;
  }

  /**
   * Uploads a local file to S3/R2 storage using multipart streaming via @aws-sdk/lib-storage.
   */
  async uploadFromTemp(localPath: string, storageKey: string, mimeType: string): Promise<void> {
    await fs.promises.access(localPath, fs.constants.R_OK);

    const fileStream = fs.createReadStream(localPath);
    const parallelUpload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: storageKey,
        Body: fileStream,
        ContentType: mimeType,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024, // 5MB minimum part size
      leavePartsOnError: false,
    });

    await parallelUpload.done();
  }

  /**
   * Deletes an object from S3/R2 storage by storage key.
   */
  async deleteObject(storageKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: storageKey,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generates a storage key for the compressed output artifact.
   * Example: "uploads/user-1/photo.png" + "webp" => "uploads/user-1/photo-compressed.webp"
   */
  generateOutputKey(inputKey: string, outputFormat: string): string {
    const cleanFormat = outputFormat.trim().replace(/^\./, '').toLowerCase();
    const dir = path.posix.dirname(inputKey);
    const ext = path.posix.extname(inputKey);
    const baseName = path.posix.basename(inputKey, ext);

    const outputFileName = `${baseName}-compressed.${cleanFormat}`;
    return dir === '.' ? outputFileName : `${dir}/${outputFileName}`;
  }
}

export const storageService = new StorageService();
export default storageService;
