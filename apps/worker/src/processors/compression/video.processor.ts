import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { CompressionSettings, CompressionPreset } from '@marshall/shared';

/**
 * Maps CompressionPreset to ffmpeg x264/x265 preset string
 */
function mapFfmpegPreset(preset?: CompressionPreset): string {
  switch (preset) {
    case CompressionPreset.FAST:
      return 'ultrafast';
    case CompressionPreset.MAXIMUM:
      return 'slow';
    case CompressionPreset.BALANCED:
    default:
      return 'medium';
  }
}

/**
 * Converts user quality score (1-100) or preset to x264 CRF (0-51)
 */
function resolveX264Crf(settings: CompressionSettings): number {
  if (typeof settings.quality === 'number' && settings.quality > 0) {
    const clampedQuality = Math.min(100, Math.max(1, settings.quality));
    // quality 100 => crf 18, quality 1 => crf 45
    return Math.round(45 - (clampedQuality / 100) * 27);
  }

  switch (settings.preset) {
    case CompressionPreset.FAST:
      return 28;
    case CompressionPreset.MAXIMUM:
      return 20;
    case CompressionPreset.BALANCED:
    default:
      return 24;
  }
}

/**
 * Converts user quality score (1-100) or preset to VP9 CRF (0-63)
 */
function resolveVp9Crf(settings: CompressionSettings): number {
  if (typeof settings.quality === 'number' && settings.quality > 0) {
    const clampedQuality = Math.min(100, Math.max(1, settings.quality));
    // quality 100 => crf 20, quality 1 => crf 50
    return Math.round(50 - (clampedQuality / 100) * 30);
  }

  switch (settings.preset) {
    case CompressionPreset.FAST:
      return 36;
    case CompressionPreset.MAXIMUM:
      return 24;
    case CompressionPreset.BALANCED:
    default:
      return 31;
  }
}

/**
 * Compresses video using ffmpeg-static child process.
 * Supports MP4, WebM, and MKV formats with progress reporting.
 */
export async function processVideo(
  inputPath: string,
  outputPath: string,
  settings: CompressionSettings,
  onProgress: (pct: number) => void
): Promise<{ outputSizeBytes: number }> {
  const binaryPath =
    typeof ffmpegPath === 'string'
      ? ffmpegPath
      : ((ffmpegPath as unknown as { default: string })?.default || '');

  if (!binaryPath) {
    throw new Error('ffmpeg-static binary path could not be resolved');
  }

  // Ensure output directory exists
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  // Determine output container format
  let targetFormat = settings.outputFormat
    ? settings.outputFormat.trim().toLowerCase().replace(/^\./, '')
    : path.extname(outputPath).slice(1).toLowerCase() || 'mp4';

  if (!['mp4', 'webm', 'mkv'].includes(targetFormat)) {
    targetFormat = 'mp4';
  }

  const ffmpegPreset = mapFfmpegPreset(settings.preset);
  const audioBitrate = settings.audioBitrateKbps ? `${settings.audioBitrateKbps}k` : '128k';

  const args: string[] = [
    '-y', // Overwrite output file
    '-i',
    inputPath,
  ];

  // Optional dimension scaling
  if (settings.width || settings.height) {
    const w = settings.width ? `${settings.width}` : '-2';
    const h = settings.height ? `${settings.height}` : '-2';
    args.push('-vf', `scale=${w}:${h}:force_original_aspect_ratio=decrease`);
  }

  // Optional metadata stripping
  if (settings.stripMetadata === true) {
    args.push('-map_metadata', '-1');
  }

  // Format-specific codec parameters
  if (targetFormat === 'webm') {
    const crf = resolveVp9Crf(settings);
    args.push('-c:v', 'libvpx-vp9', '-crf', `${crf}`, '-b:v', '0');

    if (settings.preset === CompressionPreset.FAST) {
      args.push('-deadline', 'realtime', '-cpu-used', '4');
    } else if (settings.preset === CompressionPreset.MAXIMUM) {
      args.push('-deadline', 'good', '-cpu-used', '0');
    } else {
      args.push('-deadline', 'good', '-cpu-used', '2');
    }

    args.push('-c:a', 'libopus', '-b:a', audioBitrate);
  } else if (targetFormat === 'mkv') {
    const crf = resolveX264Crf(settings);
    args.push(
      '-c:v',
      'libx264',
      '-preset',
      ffmpegPreset,
      '-crf',
      `${crf}`,
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate,
      '-pix_fmt',
      'yuv420p'
    );
    if (settings.videoBitrateKbps) {
      args.push('-b:v', `${settings.videoBitrateKbps}k`);
    }
  } else {
    // Default: MP4 container
    const crf = resolveX264Crf(settings);
    args.push(
      '-c:v',
      'libx264',
      '-preset',
      ffmpegPreset,
      '-crf',
      `${crf}`,
      '-c:a',
      'aac',
      '-b:a',
      audioBitrate,
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart'
    );
    if (settings.videoBitrateKbps) {
      args.push('-b:v', `${settings.videoBitrateKbps}k`);
    }
  }

  // Progress output via pipe:1
  args.push('-progress', 'pipe:1', outputPath);

  onProgress(5);

  return new Promise<{ outputSizeBytes: number }>((resolve, reject) => {
    const ffmpegProc = spawn(binaryPath, args);

    let totalDurationSec = 0;
    let stderrBuffer = '';

    // Parse duration from stderr
    ffmpegProc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderrBuffer = (stderrBuffer + text).slice(-4000); // keep last 4KB of logs

      if (totalDurationSec === 0) {
        const match = text.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
        if (match) {
          const hours = parseFloat(match[1]);
          const minutes = parseFloat(match[2]);
          const seconds = parseFloat(match[3]);
          totalDurationSec = hours * 3600 + minutes * 60 + seconds;
        }
      }
    });

    // Parse progress from stdout (key=value lines from -progress pipe:1)
    ffmpegProc.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      const lines = text.split('\n');

      for (const line of lines) {
        const [key, value] = line.trim().split('=');
        if (!key || !value) continue;

        if (key === 'out_time_us') {
          const currentUs = parseInt(value, 10);
          if (!isNaN(currentUs) && totalDurationSec > 0) {
            const currentSec = currentUs / 1000000;
            const pct = Math.min(99, Math.max(5, Math.round((currentSec / totalDurationSec) * 100)));
            onProgress(pct);
          }
        } else if (key === 'progress' && value === 'end') {
          onProgress(99);
        }
      }
    });

    ffmpegProc.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
    });

    ffmpegProc.on('close', async (code) => {
      if (code !== 0) {
        return reject(
          new Error(`ffmpeg process exited with code ${code}. Stderr: ${stderrBuffer.trim()}`)
        );
      }

      try {
        const stats = await fs.promises.stat(outputPath);
        onProgress(100);
        resolve({ outputSizeBytes: stats.size });
      } catch (err: unknown) {
        reject(
          new Error(
            `ffmpeg succeeded but output file not found at ${outputPath}: ${(err as Error).message}`
          )
        );
      }
    });
  });
}
