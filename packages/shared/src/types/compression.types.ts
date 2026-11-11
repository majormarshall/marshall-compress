/**
 * Compression presets trading off speed vs compression ratio.
 */
export enum CompressionPreset {
  FAST = 'FAST',
  BALANCED = 'BALANCED',
  MAXIMUM = 'MAXIMUM',
}

/**
 * Processing states of a compression job.
 */
export enum CompressionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Detailed compression settings provided by the user or preset defaults.
 */
export interface CompressionSettings {
  preset: CompressionPreset;
  quality: number; // 1 - 100
  lossless: boolean;
  targetSizeKb?: number;
  outputFormat?: string;
  stripMetadata?: boolean;
}

/**
 * Async compression task tracked in BullMQ and stored in Supabase.
 */
export interface CompressionJob {
  id: string;
  userId: string;
  fileId: string;
  preset: CompressionPreset;
  settings: CompressionSettings;
  status: CompressionStatus;
  progressPercent: number;
  inputSizeBytes: number;
  outputSizeBytes: number | null;
  compressionRatio: number | null; // e.g., 0.45 = 45% smaller
  qualityScore: number | null; // SSIM / PSNR / perceptual metric (0-100)
  timeTakenMs: number | null;
  outputStorageKey: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * Completed compressed file asset metadata.
 */
export interface CompressedFile {
  id: string;
  jobId: string;
  originalFileId: string;
  storageKey: string;
  mimeType: string;
  inputSizeBytes: number;
  outputSizeBytes: number;
  compressionRatio: number;
  qualityScore: number;
  timeTakenMs: number;
  downloadUrl: string;
  createdAt: string;
}

/**
 * Real-time progress update published over WebSocket / SSE.
 */
export interface CompressionProgress {
  jobId: string;
  progressPercent: number;
  currentStep: string;
  etaSeconds: number | null;
  processedBytes: number;
  totalBytes: number;
}

/**
 * Aggregated summary for multiple files processed in batch.
 */
export interface BatchCompressionResult {
  batchId: string;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  totalInputSizeBytes: number;
  totalOutputSizeBytes: number;
  overallRatio: number;
  items: CompressedFile[];
  errors: Array<{
    fileId: string;
    error: string;
  }>;
}
