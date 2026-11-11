import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { CompressionSettings, CompressionPreset } from '@marshall/shared';

/**
 * Resolves audio bitrate string (e.g. "128k") based on settings or preset
 */
function resolveAudioBitrate(settings: CompressionSettings): string {
  if (settings.audioBitrateKbps && settings.audioBitrateKbps > 0) {
    return `${settings.audioBitrateKbps}k`;
  }

  switch (settings.preset) {
    case CompressionPreset.FAST:
      return '192k';
    case CompressionPreset.MAXIMUM:
      return '96k';
    case CompressionPreset.BALANCED:
    default:
      return '128k';
  }
}

/**
 * Compresses audio files using ffmpeg-static.
 * Supports MP3, AAC, and FLAC output formats with progress reporting.
 */
export async function processAudio(
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

  // Determine output audio format
  let targetFormat = settings.outputFormat
    ? settings.outputFormat.trim().toLowerCase().replace(/^\./, '')
    : path.extname(outputPath).slice(1).toLowerCase() || 'mp3';

  if (!['mp3', 'aac', 'flac'].includes(targetFormat)) {
    targetFormat = 'mp3';
  }

  const audioBitrate = resolveAudioBitrate(settings);

  const args: string[] = [
    '-y', // Overwrite output
    '-i',
    inputPath,
    '-vn', // Disable video stream if present in container
  ];

  // Optional metadata stripping
  if (settings.stripMetadata === true) {
    args.push('-map_metadata', '-1');
  }

  // Codec selection based on format
  if (targetFormat === 'flac') {
    const compressionLevel =
      settings.preset === CompressionPreset.MAXIMUM
        ? 8
        : settings.preset === CompressionPreset.FAST
          ? 2
          : 5;
    args.push('-c:a', 'flac', '-compression_level', `${compressionLevel}`);
  } else if (targetFormat === 'aac') {
    args.push('-c:a', 'aac', '-b:a', audioBitrate);
  } else {
    // Default: MP3 via libmp3lame
    args.push('-c:a', 'libmp3lame', '-b:a', audioBitrate);
  }

  // Progress monitoring via pipe:1
  args.push('-progress', 'pipe:1', outputPath);

  onProgress(5);

  return new Promise<{ outputSizeBytes: number }>((resolve, reject) => {
    const ffmpegProc = spawn(binaryPath, args);

    let totalDurationSec = 0;
    let stderrBuffer = '';

    ffmpegProc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderrBuffer = (stderrBuffer + text).slice(-4000);

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
      reject(new Error(`Failed to spawn ffmpeg for audio: ${err.message}`));
    });

    ffmpegProc.on('close', async (code) => {
      if (code !== 0) {
        return reject(
          new Error(`ffmpeg audio compression exited with code ${code}. Stderr: ${stderrBuffer.trim()}`)
        );
      }

      try {
        const stats = await fs.promises.stat(outputPath);
        onProgress(100);
        resolve({ outputSizeBytes: stats.size });
      } catch (err: unknown) {
        reject(
          new Error(
            `ffmpeg audio compression succeeded but output file not found at ${outputPath}: ${(err as Error).message}`
          )
        );
      }
    });
  });
}
