import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { FilesService } from './files.service';
import { CreateUploadSessionDto } from './dtos/create-upload-session.dto';
import { CompleteUploadDto } from './dtos/complete-upload.dto';
import { ListFilesQueryDto } from './dtos/list-files-query.dto';
import { UpdateFileDto } from './dtos/update-file.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Files')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'List user files with pagination and filters' })
  @SwaggerApiResponse({ status: 200, description: 'Paginated list of files' })
  async listFiles(
    @CurrentUser('id') userId: string,
    @Query() query: ListFilesQueryDto,
  ) {
    return this.filesService.listFiles(userId, query);
  }

  @Post('upload/session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate a multipart upload session' })
  @SwaggerApiResponse({ status: 200, description: 'Multipart upload session initialized' })
  async createUploadSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateUploadSessionDto,
  ) {
    return this.filesService.createUploadSession(userId, dto);
  }

  @Post('upload/complete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Finalize multipart upload and save file record' })
  @SwaggerApiResponse({ status: 201, description: 'File uploaded and record created' })
  async completeUpload(
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.filesService.completeUpload(userId, dto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Generate a presigned download URL for a file' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @SwaggerApiResponse({ status: 200, description: 'Presigned download URL' })
  async getDownloadUrl(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) fileId: string,
  ) {
    return this.filesService.getDownloadUrl(userId, fileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single file record by ID' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @SwaggerApiResponse({ status: 200, description: 'File metadata' })
  async getFile(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) fileId: string,
  ) {
    return this.filesService.getFile(userId, fileId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata (rename or move)' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @SwaggerApiResponse({ status: 200, description: 'File updated successfully' })
  async updateFile(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) fileId: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.filesService.updateFile(userId, fileId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a file and remove from storage' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @SwaggerApiResponse({ status: 200, description: 'File deleted' })
  async deleteFile(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) fileId: string,
  ) {
    return this.filesService.deleteFile(userId, fileId);
  }
}
