/**
 * Lifecycle status of a stored file.
 */
export enum FileStatus {
  UPLOADING = 'UPLOADING',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  QUARANTINED = 'QUARANTINED',
}

/**
 * Broad categories of supported files.
 */
export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  PDF = 'PDF',
  DOCUMENT = 'DOCUMENT',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER',
}

/**
 * Folder node within the virtual storage drive.
 */
export interface Folder {
  id: string;
  userId: string;
  parentFolderId: string | null;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata record for any uploaded file in Cloudflare R2 / S3.
 */
export interface FileRecord {
  id: string;
  userId: string;
  folderId: string | null;
  name: string;
  originalName: string;
  mimeType: string;
  type: FileType;
  sizeBytes: number;
  storageKey: string;
  publicUrl: string | null;
  status: FileStatus;
  checksumMd5?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Aggregated storage usage statistics for an account.
 */
export interface StorageUsage {
  usedBytes: number;
  limitBytes: number;
  fileCount: number;
  percentageUsed: number;
}

/**
 * Single chunk/part in an S3-compatible multipart upload.
 */
export interface UploadPart {
  partNumber: number;
  etag: string;
  sizeBytes: number;
}

/**
 * Active multipart upload session for large files.
 */
export interface MultipartUploadSession {
  uploadId: string;
  storageKey: string;
  userId: string;
  parts: UploadPart[];
  totalParts: number;
  partSizeBytes: number;
  status: 'INITIATED' | 'UPLOADING' | 'COMPLETED' | 'ABORTED';
  expiresAt: string;
}
