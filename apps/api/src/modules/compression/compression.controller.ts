import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CompressionService } from './compression.service';
import { CreateCompressionJobDto } from './dtos/create-compression-job.dto';
import { ListCompressionJobsQueryDto } from './dtos/list-compression-jobs-query.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);
const SSE_POLL_INTERVAL_MS = 1000;
const SSE_MAX_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@ApiTags('Compression')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('compression')
export class CompressionController {
  private readonly logger = new Logger(CompressionController.name);

  constructor(
    private readonly compressionService: CompressionService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get('jobs')
  @ApiOperation({ summary: 'List user compression jobs with pagination and filters' })
  @SwaggerApiResponse({ status: 200, description: 'Paginated list of compression jobs' })
  async listJobs(
    @CurrentUser('id') userId: string,
    @Query() query: ListCompressionJobsQueryDto,
  ) {
    return this.compressionService.listJobs(userId, query);
  }

  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and enqueue a new file compression job' })
  @SwaggerApiResponse({ status: 201, description: 'Compression job enqueued' })
  async createJob(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCompressionJobDto,
  ) {
    return this.compressionService.createJob(userId, dto);
  }

  @Get('jobs/:id/download')
  @ApiOperation({ summary: 'Get presigned download URL for compressed output' })
  @ApiParam({ name: 'id', description: 'Compression job UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Presigned download URL for compressed output' })
  async getDownloadUrl(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) jobId: string,
  ) {
    return this.compressionService.getDownloadUrl(userId, jobId);
  }

  @Post('jobs/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an active compression job' })
  @ApiParam({ name: 'id', description: 'Compression job UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Compression job cancelled' })
  async cancelJob(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) jobId: string,
  ) {
    return this.compressionService.cancelJob(userId, jobId);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get single compression job status and details' })
  @ApiParam({ name: 'id', description: 'Compression job UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Compression job details' })
  async getJob(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) jobId: string,
  ) {
    return this.compressionService.getJob(userId, jobId);
  }

  /**
   * SSE endpoint: streams real-time compression job progress.
   * Uses ?token= query param because browser EventSource cannot set Auth headers.
   * Streams events until job reaches terminal state or timeout (15 min).
   */
  @Get('jobs/:id/events')
  @ApiOperation({ summary: 'Stream real-time SSE progress for a compression job' })
  @ApiParam({ name: 'id', description: 'Compression job UUID' })
  @ApiQuery({ name: 'token', description: 'Supabase JWT access token', required: true })
  @SwaggerApiResponse({ status: 200, description: 'SSE stream of job progress events' })
  async streamJobEvents(
    @Param('id') jobId: string,
    @Query('token') token: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    // ── Validate token manually (guard doesn't fire on SSE due to raw response) ──
    if (!token) {
      res.status(401).send({ message: 'Missing token' });
      return;
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    let userId: string;
    try {
      const tempClient = createClient(supabaseUrl!, supabaseAnonKey!);
      const { data, error } = await tempClient.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).send({ message: 'Invalid token' });
        return;
      }
      userId = data.user.id;
    } catch {
      res.status(401).send({ message: 'Token validation failed' });
      return;
    }

    // ── Configure SSE headers ──
    const rawRes = (res as any).raw as import('http').ServerResponse;
    rawRes.setHeader('Content-Type', 'text/event-stream');
    rawRes.setHeader('Cache-Control', 'no-cache, no-transform');
    rawRes.setHeader('Connection', 'keep-alive');
    rawRes.setHeader('X-Accel-Buffering', 'no');
    rawRes.flushHeaders();

    const send = (event: string, data: unknown) => {
      try {
        rawRes.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        // Client disconnected
      }
    };

    // Send initial ping
    send('ping', { ts: Date.now() });

    const startTime = Date.now();
    let done = false;

    const poll = async () => {
      try {
        const { data: job, error } = await this.supabaseService.client
          .from('compression_jobs')
          .select('id, status, progress, error_message, compressed_size_bytes, original_size_bytes, updated_at')
          .eq('id', jobId)
          .eq('user_id', userId)
          .single();

        if (error || !job) {
          send('error', { message: 'Job not found or access denied' });
          done = true;
          rawRes.end();
          return;
        }

        const savingsPercentage =
          job.original_size_bytes && job.compressed_size_bytes
            ? Math.round((1 - job.compressed_size_bytes / job.original_size_bytes) * 100)
            : undefined;

        send('progress', {
          jobId: job.id,
          status: job.status,
          progress: job.progress ?? 0,
          compressedSizeBytes: job.compressed_size_bytes,
          savingsPercentage,
          error: job.error_message,
        });

        if (TERMINAL_STATUSES.has(job.status) || Date.now() - startTime > SSE_MAX_DURATION_MS) {
          done = true;
          send('done', { status: job.status });
          rawRes.end();
        }
      } catch (err: any) {
        this.logger.error(`SSE poll error for job ${jobId}: ${err.message}`);
        send('error', { message: 'Internal polling error' });
        done = true;
        rawRes.end();
      }
    };

    // Poll loop
    const interval = setInterval(async () => {
      if (done) {
        clearInterval(interval);
        return;
      }
      await poll();
    }, SSE_POLL_INTERVAL_MS);

    // Run first poll immediately without waiting
    await poll();

    // Clean up on client disconnect
    req.socket?.on('close', () => {
      done = true;
      clearInterval(interval);
    });
  }
}
