import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { StorageService } from '../storage/storage.service';
import { CreateUploadSessionDto } from './dtos/create-upload-session.dto';
import { CompleteUploadDto } from './dtos/complete-upload.dto';
import { ListFilesQueryDto } from './dtos/list-files-query.dto';
import {
  FileStatus,
  FileType,
  type FileItem,
  type UploadSessionResponse,
  type PaginatedList,
} from '@marshall/shared';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Helper to derive FileType from mimeType
   */
  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) return FileType.IMAGE;
    if (mimeType.startsWith('video/')) return FileType.VIDEO;
    if (mimeType.startsWith('audio/')) return FileType.AUDIO;
    if (mimeType === 'application/pdf') return FileType.PDF;
    if (
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('sheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint') ||
      mimeType.startsWith('text/')
    ) {
      return FileType.DOCUMENT;
    }
    if (
      mimeType.includes('zip') ||
      mimeType.includes('tar') ||
      mimeType.includes('rar') ||
      mimeType.includes('7z') ||
      mimeType.includes('gzip')
    ) {
      return FileType.ARCHIVE;
    }
    return FileType.OTHER;
  }

  /**
   * Create multipart upload session and return presigned URLs for all parts
   */
  async createUploadSession(
    userId: string,
    dto: CreateUploadSessionDto,
  ): Promise<UploadSessionResponse> {
    const partSizeBytes = 5 * 1024 * 1024; // 5 MB minimum part size
    const calculatedParts = Math.max(1, Math.ceil(dto.sizeBytes / partSizeBytes));
    const partCount = dto.partCount ? Math.max(1, dto.partCount) : calculatedParts;

    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `files/${userId}/${randomUUID()}-${sanitizedFileName}`;

    const uploadId = await this.storageService.createMultipartUpload(
      storageKey,
      dto.mimeType,
    );

    const presignedUrls: string[] = [];
    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const url = await this.storageService.generatePresignedPartUrl(
        storageKey,
        uploadId,
        partNumber,
        3600,
      );
      presignedUrls.push(url);
    }

    return {
      uploadId,
      storageKey,
      presignedUrls,
      partSizeBytes,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }

  /**
   * Complete multipart upload session and create file record in DB
   */
  async completeUpload(userId: string, dto: CompleteUploadDto): Promise<FileItem> {
    // Finalize multipart upload in S3/R2
    await this.storageService.completeMultipartUpload(
      dto.storageKey,
      dto.uploadId,
      dto.parts,
    );

    const fileType = this.determineFileType(dto.mimeType);
    const publicUrl = this.storageService.getPublicUrl(dto.storageKey);

    const { data, error } = await this.supabaseService.client
      .from('files')
      .insert({
        user_id: userId,
        folder_id: dto.folderId || null,
        name: dto.fileName,
        original_name: dto.fileName,
        mime_type: dto.mimeType,
        size_bytes: dto.sizeBytes,
        file_type: fileType,
        status: FileStatus.ACTIVE,
        storage_key: dto.storageKey,
        storage_url: publicUrl,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Failed to insert file record for ${dto.storageKey}: ${error?.message}`);
      throw new BadRequestException(error?.message || 'Failed to save file metadata');
    }

    return data as FileItem;
  }

  /**
   * List files for a user with pagination and filters
   */
  async listFiles(
    userId: string,
    query: ListFilesQueryDto,
  ): Promise<PaginatedList<FileItem>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let dbQuery = this.supabaseService.client
      .from('files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (query.folderId !== undefined) {
      if (query.folderId === 'root' || query.folderId === null || query.folderId === '') {
        dbQuery = dbQuery.is('folder_id', null);
      } else {
        dbQuery = dbQuery.eq('folder_id', query.folderId);
      }
    }

    if (query.search) {
      dbQuery = dbQuery.ilike('name', `%${query.search}%`);
    }

    if (query.fileType) {
      dbQuery = dbQuery.eq('file_type', query.fileType);
    }

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Error listing files: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items: (data as FileItem[]) || [],
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get single file record by ID
   */
  async getFile(userId: string, fileId: string): Promise<FileItem> {
    const { data, error } = await this.supabaseService.client
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new NotFoundException('File not found');
    }

    return data as FileItem;
  }

  /**
   * Soft delete a file
   */
  async deleteFile(userId: string, fileId: string): Promise<{ success: boolean; message: string }> {
    const file = await this.getFile(userId, fileId);

    const { error } = await this.supabaseService.client
      .from('files')
      .update({
        status: FileStatus.DELETED,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting file ${fileId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    // Attempt storage deletion
    try {
      await this.storageService.deleteObject(file.storage_key);
    } catch (err: any) {
      this.logger.warn(`Could not remove storage object for ${file.storage_key}: ${err.message}`);
    }

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  /**
   * Generate presigned download URL for a file
   */
  async getDownloadUrl(userId: string, fileId: string): Promise<{ downloadUrl: string; fileName: string }> {
    const file = await this.getFile(userId, fileId);

    const downloadUrl = await this.storageService.generatePresignedDownloadUrl(
      file.storage_key,
      file.name,
      3600,
    );

    return {
      downloadUrl,
      fileName: file.name,
    };
  }
}
