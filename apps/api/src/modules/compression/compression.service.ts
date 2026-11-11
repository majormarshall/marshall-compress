import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { StorageService } from '../storage/storage.service';
import { CreateCompressionJobDto } from './dtos/create-compression-job.dto';
import { ListCompressionJobsQueryDto } from './dtos/list-compression-jobs-query.dto';
import {
  JobStatus,
  CompressionPreset,
  type CompressionJob,
  type PaginatedList,
  type CompressedFile,
} from '@marshall/shared';

@Injectable()
export class CompressionService implements OnModuleDestroy {
  private readonly logger = new Logger(CompressionService.name);
  private readonly compressionQueue: Queue;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly storageService: StorageService,
  ) {
    const redisHost = this.configService.get<string>('redis.host', '127.0.0.1');
    const redisPort = this.configService.get<number>('redis.port', 6379);
    const redisPassword = this.configService.get<string>('redis.password');

    this.compressionQueue = new Queue('compression', {
      connection: {
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        maxRetriesPerRequest: null,
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.compressionQueue.close();
  }

  /**
   * Create and enqueue a compression job
   */
  async createJob(
    userId: string,
    dto: CreateCompressionJobDto,
  ): Promise<CompressionJob> {
    // Verify file exists and belongs to user
    const { data: file, error: fileError } = await this.supabaseService.client
      .from('files')
      .select('*')
      .eq('id', dto.fileId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (fileError || !file) {
      throw new NotFoundException('File to compress not found');
    }

    const preset =
      dto.preset || dto.settings?.preset || CompressionPreset.BALANCED;

    // Create job record in Supabase
    const { data: job, error: jobError } = await this.supabaseService.client
      .from('compression_jobs')
      .insert({
        user_id: userId,
        file_id: dto.fileId,
        status: JobStatus.PENDING,
        preset,
        settings: dto.settings || {},
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (jobError || !job) {
      this.logger.error(`Failed to create compression job: ${jobError?.message}`);
      throw new BadRequestException(jobError?.message || 'Failed to initialize compression job');
    }

    // Enqueue BullMQ job
    try {
      await this.compressionQueue.add('compress', {
        jobId: job.id,
        userId,
        fileId: dto.fileId,
        storageKey: file.storage_key,
        originalFileName: file.name,
        mimeType: file.mime_type,
        preset,
        settings: dto.settings || {},
      });
    } catch (err: any) {
      this.logger.error(`Failed to enqueue BullMQ job: ${err.message}`, err.stack);
      // Even if redis is unreachable in dev, job record is safely stored in Supabase
    }

    return job as CompressionJob;
  }

  /**
   * List compression jobs for user
   */
  async listJobs(
    userId: string,
    query: ListCompressionJobsQueryDto,
  ): Promise<PaginatedList<CompressionJob>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let dbQuery = this.supabaseService.client
      .from('compression_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Error listing compression jobs: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items: (data as CompressionJob[]) || [],
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get single compression job by ID
   */
  async getJob(userId: string, jobId: string): Promise<CompressionJob & { compressedFile?: CompressedFile | null }> {
    const { data: job, error } = await this.supabaseService.client
      .from('compression_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !job) {
      throw new NotFoundException('Compression job not found');
    }

    // Attempt to fetch compressed file output if available
    let compressedFile: CompressedFile | null = null;
    if (job.status === JobStatus.COMPLETED) {
      const { data: cf } = await this.supabaseService.client
        .from('compressed_files')
        .select('*')
        .eq('job_id', jobId)
        .single();
      compressedFile = cf as CompressedFile;
    }

    return {
      ...(job as CompressionJob),
      compressedFile,
    };
  }

  /**
   * Cancel a pending or processing compression job
   */
  async cancelJob(userId: string, jobId: string): Promise<{ success: boolean; message: string }> {
    const job = await this.getJob(userId, jobId);

    if (job.status === JobStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed compression job');
    }

    if (job.status === JobStatus.CANCELLED) {
      return { success: true, message: 'Job is already cancelled' };
    }

    const { error } = await this.supabaseService.client
      .from('compression_jobs')
      .update({
        status: JobStatus.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error cancelling job ${jobId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Compression job cancelled successfully',
    };
  }

  /**
   * Generate download URL for compressed output file
   */
  async getDownloadUrl(userId: string, jobId: string): Promise<{ downloadUrl: string; fileName: string }> {
    const job = await this.getJob(userId, jobId);

    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException(`Cannot download compressed file: job status is ${job.status}`);
    }

    const { data: compressedFile, error } = await this.supabaseService.client
      .from('compressed_files')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !compressedFile) {
      throw new NotFoundException('Compressed output file record not found');
    }

    const downloadUrl = await this.storageService.generatePresignedDownloadUrl(
      compressedFile.storage_key,
      compressedFile.name,
      3600,
    );

    return {
      downloadUrl,
      fileName: compressedFile.name,
    };
  }
}
