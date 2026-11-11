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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CompressionService } from './compression.service';
import { CreateCompressionJobDto } from './dtos/create-compression-job.dto';
import { ListCompressionJobsQueryDto } from './dtos/list-compression-jobs-query.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Compression')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('compression')
export class CompressionController {
  constructor(private readonly compressionService: CompressionService) {}

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
}
