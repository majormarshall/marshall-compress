import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateFolderDto } from './dtos/create-folder.dto';
import { UpdateFolderDto } from './dtos/update-folder.dto';
import { ListFoldersQueryDto } from './dtos/list-folders-query.dto';
import type { Folder } from '@marshall/shared';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * List folders for a user filtered by parentId
   */
  async listFolders(userId: string, query: ListFoldersQueryDto): Promise<Folder[]> {
    let dbQuery = this.supabaseService.client
      .from('folders')
      .select('*')
      .eq('user_id', userId);

    if (
      !query.parentId ||
      query.parentId === 'root' ||
      query.parentId === 'null' ||
      query.parentId === ''
    ) {
      dbQuery = dbQuery.is('parent_id', null);
    } else {
      dbQuery = dbQuery.eq('parent_id', query.parentId);
    }

    const { data, error } = await dbQuery.order('name', { ascending: true });

    if (error) {
      this.logger.error(`Error listing folders: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return (data as Folder[]) || [];
  }

  /**
   * Get single folder by ID
   */
  async getFolder(userId: string, folderId: string): Promise<Folder> {
    const { data, error } = await this.supabaseService.client
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Folder not found');
    }

    return data as Folder;
  }

  /**
   * Create a new folder
   */
  async createFolder(userId: string, dto: CreateFolderDto): Promise<Folder> {
    if (dto.parentId) {
      await this.getFolder(userId, dto.parentId);
    }

    const { data, error } = await this.supabaseService.client
      .from('folders')
      .insert({
        user_id: userId,
        parent_id: dto.parentId || null,
        name: dto.name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Error creating folder: ${error?.message}`);
      throw new BadRequestException(error?.message || 'Failed to create folder');
    }

    return data as Folder;
  }

  /**
   * Rename or move a folder
   */
  async updateFolder(
    userId: string,
    folderId: string,
    dto: UpdateFolderDto,
  ): Promise<Folder> {
    await this.getFolder(userId, folderId);

    if (dto.parentId) {
      if (dto.parentId === folderId) {
        throw new BadRequestException('A folder cannot be its own parent');
      }
      await this.getFolder(userId, dto.parentId);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) {
      updates.name = dto.name.trim();
    }

    if (dto.parentId !== undefined) {
      updates.parent_id = dto.parentId;
    }

    const { data, error } = await this.supabaseService.client
      .from('folders')
      .update(updates)
      .eq('id', folderId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Error updating folder: ${error?.message}`);
      throw new BadRequestException(error?.message || 'Failed to update folder');
    }

    return data as Folder;
  }

  /**
   * Delete folder
   */
  async deleteFolder(
    userId: string,
    folderId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.getFolder(userId, folderId);

    const { error } = await this.supabaseService.client
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting folder: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Folder deleted successfully',
    };
  }
}
