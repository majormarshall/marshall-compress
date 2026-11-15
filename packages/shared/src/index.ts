/**
 * @marshall/shared
 * Common domain models, enums, DTOs, and utility types for the MARSHALL platform.
 * Re-exports all granular type modules plus top-level convenience aliases.
 */

// Re-export all granular type modules
export * from './types/index';
export * from './schemas/auth.schemas';

// ============================================================================
// API-Layer DTOs / Aliases expected by the web app endpoints
// ============================================================================

/** Alias: Folder is used as FolderItem in the web API layer */
export type { Folder as FolderItem } from './types/file.types';

/** Request body for initiating a multipart upload session */
export interface UploadSessionRequest {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folderId?: string | null;
  /** Number of parts to pre-sign. If omitted the server calculates based on sizeBytes. */
  partCount?: number;
}

/** Response from the upload session creation endpoint */
export interface UploadSessionResponse {
  uploadId: string;
  storageKey: string;
  /** Pre-signed URLs for each part (index = partNumber - 1) */
  presignedUrls: string[];
  partSizeBytes: number;
  expiresAt: string;
}

/** Completed part metadata sent by the client after uploading */
export interface CompletedPart {
  partNumber: number;
  etag: string;
}

/** Request body to finalise a multipart upload and create the file record */
export interface CompleteUploadRequest {
  uploadId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folderId?: string | null;
  parts: CompletedPart[];
}

/** Paginated list wrapper */
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Enums
// ============================================================================

export enum UserRole {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}

export enum FileStatus {
  UPLOADING = 'UPLOADING',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  QUARANTINED = 'QUARANTINED',
}

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  PDF = 'PDF',
  DOCUMENT = 'DOCUMENT',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum CompressionPreset {
  FAST = 'FAST',
  BALANCED = 'BALANCED',
  MAXIMUM = 'MAXIMUM',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ActionItemStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum NoteStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum AiProvider {
  OPENAI = 'OPENAI',
  GOOGLE = 'GOOGLE',
  ANTHROPIC = 'ANTHROPIC',
}

export enum AiJobType {
  SUMMARIZE = 'SUMMARIZE',
  TRANSCRIBE = 'TRANSCRIBE',
  QA = 'QA',
  ORGANIZE = 'ORGANIZE',
}

// ============================================================================
// Domain Entities / Interfaces
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  parent_id?: string | null;
  name: string;
  path?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: string;
  user_id: string;
  folder_id?: string | null;
  name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  file_type: FileType;
  status: FileStatus;
  storage_key: string;
  storage_url?: string | null;
  thumbnail_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CompressionJobSettings {
  quality?: number;
  lossless?: boolean;
  targetSizeKb?: number;
  outputFormat?: string;
  stripMetadata?: boolean;
  width?: number;
  height?: number;
  audioBitrateKbps?: number;
  videoBitrateKbps?: number;
  preset?: CompressionPreset;
}

export type CompressionSettings = CompressionJobSettings;

export interface CompressionJobData {
  jobId: string;
  userId: string;
  fileId: string;
  storageKey?: string;
  originalFileName?: string;
  mimeType?: string;
  preset?: CompressionPreset;
  settings?: CompressionSettings;
}


export interface CompressionJob {
  id: string;
  user_id: string;
  file_id: string;
  status: JobStatus;
  preset: CompressionPreset;
  settings: CompressionJobSettings;
  progress: number;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompressedFile {
  id: string;
  job_id: string;
  user_id: string;
  original_file_id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  storage_url?: string | null;
  compression_ratio: number;
  time_taken_ms?: number | null;
  created_at: string;
}

// ============================================================================
// API Response Structures
// ============================================================================

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: ApiResponseMeta;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}
