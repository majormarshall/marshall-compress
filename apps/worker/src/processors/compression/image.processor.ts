import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { CompressionSettings, CompressionPreset } from '@marshall/shared';

/**
 * Compresses and optionally transforms an image using Sharp.
 * Supports JPEG, PNG, WebP, and AVIF formats with quality, metadata stripping, and dimension adjustments.
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  settings: CompressionSettings,
  onProgress: (pct: number) => void
): Promise<{ outputSizeBytes: number }> {
  onProgress(10);

  // Ensure output directory exists
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  let pipeline = sharp(inputPath);

  pipeline.on('progress', (info) => {
    if (typeof info?.percent === 'number') {
      onProgress(Math.min(95, Math.max(10, Math.round(info.percent))));
    }
  });

  // Determine metadata handling: Sharp strips metadata by default unless withMetadata() is called
  if (settings.stripMetadata === false) {
    pipeline = pipeline.withMetadata();
  }

  // Handle optional dimension resizing
  if (settings.width || settings.height) {
    pipeline = pipeline.resize({
      width: settings.width,
      height: settings.height,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Determine format from settings or input metadata / output file extension
  let targetFormat = settings.outputFormat
    ? settings.outputFormat.trim().toLowerCase().replace(/^\./, '')
    : '';

  if (!targetFormat) {
    const ext = path.extname(outputPath).slice(1).toLowerCase();
    if (ext) {
      targetFormat = ext;
    } else {
      const meta = await sharp(inputPath).metadata();
      targetFormat = (meta.format || 'webp').toLowerCase();
    }
  }

  onProgress(25);

  const resolveQuality = (baseQuality: number): number => {
    if (typeof settings.quality === 'number' && settings.quality > 0) {
      return Math.min(100, Math.max(1, settings.quality));
    }
    switch (settings.preset) {
      case CompressionPreset.FAST:
        return Math.min(100, baseQuality + 10);
      case CompressionPreset.MAXIMUM:
        return Math.max(1, baseQuality - 15);
      case CompressionPreset.BALANCED:
      default:
        return baseQuality;
    }
  };

  switch (targetFormat) {
    case 'jpg':
    case 'jpeg': {
      pipeline = pipeline.jpeg({
        quality: resolveQuality(75),
        mozjpeg: true,
        progressive: true,
      });
      break;
    }

    case 'png': {
      const compressionLevel =
        settings.preset === CompressionPreset.MAXIMUM
          ? 9
          : settings.preset === CompressionPreset.FAST
            ? 3
            : 6;
      pipeline = pipeline.png({
        quality: resolveQuality(80),
        compressionLevel,
        progressive: true,
        palette: settings.preset === CompressionPreset.MAXIMUM,
      });
      break;
    }

    case 'webp': {
      const effort =
        settings.preset === CompressionPreset.MAXIMUM
          ? 6
          : settings.preset === CompressionPreset.FAST
            ? 2
            : 4;
      pipeline = pipeline.webp({
        quality: resolveQuality(75),
        lossless: settings.lossless ?? false,
        effort,
      });
      break;
    }

    case 'avif': {
      const effort =
        settings.preset === CompressionPreset.MAXIMUM
          ? 7
          : settings.preset === CompressionPreset.FAST
            ? 2
            : 4;
      pipeline = pipeline.avif({
        quality: resolveQuality(65),
        lossless: settings.lossless ?? false,
        effort,
      });
      break;
    }

    default: {
      // Default fallback: WebP encoding
      pipeline = pipeline.webp({
        quality: resolveQuality(75),
        lossless: settings.lossless ?? false,
        effort: 4,
      });
      break;
    }
  }

  onProgress(50);
  await pipeline.toFile(outputPath);

  const stats = await fs.promises.stat(outputPath);
  onProgress(100);

  return { outputSizeBytes: stats.size };
}
