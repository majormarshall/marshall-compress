import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import { workerConfig } from '../config/worker.config';

export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(workerConfig.supabase.url, workerConfig.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Returns underlying Supabase service-role client
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Retrieves metadata of an uploaded file from Supabase 'files' table.
   */
  async getFileRecord(fileId: string): Promise<{ storageKey: string; mimeType: string; sizeBytes: number }> {
    const { data, error } = await this.client
      .from('files')
      .select('storage_key, mime_type, size_bytes')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to retrieve file record for id "${fileId}": ${error?.message || 'File not found'}`
      );
    }

    return {
      storageKey: data.storage_key,
      mimeType: data.mime_type,
      sizeBytes: Number(data.size_bytes),
    };
  }

  /**
   * Updates progress (0 - 100) and optional status for a compression job.
   */
  async updateJobProgress(jobId: string, progress: number, status?: string): Promise<void> {
    const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
    const updates: Record<string, unknown> = {
      progress: clampedProgress,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
      if (status === 'PROCESSING') {
        updates.started_at = new Date().toISOString();
      }
    }

    const { error } = await this.client
      .from('compression_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update job progress for job "${jobId}": ${error.message}`);
    }
  }

  /**
   * Marks a compression job as completed, records output metrics and registers compressed asset.
   */
  async updateJobCompleted(
    jobId: string,
    outputKey: string,
    inputSize: number,
    outputSize: number,
    ratio: number,
    timeTakenMs: number
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    // 1. Fetch job to get related user and original file ID
    const { data: job, error: jobFetchError } = await this.client
      .from('compression_jobs')
      .select('id, user_id, file_id')
      .eq('id', jobId)
      .single();

    if (jobFetchError) {
      console.warn(`Could not fetch job metadata for completed job ${jobId}: ${jobFetchError.message}`);
    }

    // 2. Mark compression_job as COMPLETED
    const { error: jobUpdateError } = await this.client
      .from('compression_jobs')
      .update({
        status: 'COMPLETED',
        progress: 100,
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', jobId);

    if (jobUpdateError) {
      throw new Error(`Failed to update job completed status for job "${jobId}": ${jobUpdateError.message}`);
    }

    // 3. Insert or update compressed_files entry if job record was found
    if (job) {
      try {
        const { data: originalFile } = await this.client
          .from('files')
          .select('name, original_name, mime_type')
          .eq('id', job.file_id)
          .single();

        const baseFileName = originalFile?.name || originalFile?.original_name || path.basename(outputKey);
        const compressedName = baseFileName.startsWith('compressed_')
          ? baseFileName
          : `compressed_${baseFileName}`;
        const outputMimeType = originalFile?.mime_type || 'application/octet-stream';

        const { error: insertError } = await this.client.from('compressed_files').upsert(
          {
            job_id: jobId,
            user_id: job.user_id,
            original_file_id: job.file_id,
            name: compressedName,
            mime_type: outputMimeType,
            size_bytes: outputSize,
            storage_key: outputKey,
            compression_ratio: Number(ratio.toFixed(2)),
            time_taken_ms: Math.round(timeTakenMs),
            created_at: nowIso,
          },
          { onConflict: 'job_id' }
        );

        if (insertError) {
          console.warn(`Warning: Failed to insert compressed_files record for job ${jobId}: ${insertError.message}`);
        }
      } catch (err: unknown) {
        console.warn(`Warning: Exception inserting compressed_files for job ${jobId}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Marks a compression job as failed and sets the error message.
   */
  async updateJobFailed(jobId: string, error: string): Promise<void> {
    const { error: updateError } = await this.client
      .from('compression_jobs')
      .update({
        status: 'FAILED',
        error_message: error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to mark job "${jobId}" as failed: ${updateError.message}`);
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;
