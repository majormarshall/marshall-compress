import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { ListNotesQueryDto } from './dtos/list-notes-query.dto';
import { CreateNoteFolderDto } from './dtos/create-note-folder.dto';
import {
  NoteStatus,
  type Note,
  type NoteFolder,
  type PaginatedList,
} from '@marshall/shared';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Helper to format database note row into Note interface
   */
  private mapDbNote(row: any): Note {
    return {
      id: row.id,
      userId: row.user_id,
      folderId: row.folder_id,
      title: row.title,
      contentJson: row.content || null,
      contentHtml: row.content_html || '',
      contentText: row.content_text || '',
      status: row.status as NoteStatus,
      tags: Array.isArray(row.tags)
        ? row.tags.map((t: string) => ({
            id: t,
            userId: row.user_id,
            name: t,
            color: '#6B7280',
            createdAt: row.created_at,
          }))
        : [],
      isPinned: Boolean(row.pinned),
      isArchived: false,
      wordCount: row.word_count || 0,
      readingTimeMinutes: Math.ceil((row.word_count || 0) / 200),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  /**
   * List notes for a user with search and filtering
   */
  async listNotes(
    userId: string,
    query: ListNotesQueryDto,
  ): Promise<PaginatedList<Note>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let dbQuery = this.supabaseService.client
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (query.folderId !== undefined) {
      if (
        query.folderId === 'root' ||
        query.folderId === null ||
        query.folderId === ''
      ) {
        dbQuery = dbQuery.is('folder_id', null);
      } else {
        dbQuery = dbQuery.eq('folder_id', query.folderId);
      }
    }

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.isPinned !== undefined) {
      dbQuery = dbQuery.eq('pinned', query.isPinned);
    }

    if (query.search) {
      dbQuery = dbQuery.ilike('title', `%${query.search}%`);
    }

    const { data, count, error } = await dbQuery
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Error listing notes: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      items: ((data || []) as any[]).map((row) => this.mapDbNote(row)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Create a new note
   */
  async createNote(userId: string, dto: CreateNoteDto): Promise<Note> {
    const rawContent = dto.contentText || JSON.stringify(dto.contentJson || '');
    const wordCount = rawContent.trim()
      ? rawContent.trim().split(/\s+/).length
      : 0;

    const { data, error } = await this.supabaseService.client
      .from('notes')
      .insert({
        user_id: userId,
        folder_id: dto.folderId || null,
        title: dto.title.trim(),
        content: dto.contentJson || {},
        status: dto.status || NoteStatus.DRAFT,
        word_count: wordCount,
        tags: dto.tags || [],
        pinned: dto.isPinned ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Error creating note: ${error?.message}`);
      throw new BadRequestException(error?.message || 'Failed to create note');
    }

    return this.mapDbNote(data);
  }

  /**
   * Get single note by ID
   */
  async getNote(userId: string, noteId: string): Promise<Note> {
    const { data, error } = await this.supabaseService.client
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      throw new NotFoundException('Note not found');
    }

    return this.mapDbNote(data);
  }

  /**
   * Update an existing note
   */
  async updateNote(
    userId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ): Promise<Note> {
    await this.getNote(userId, noteId);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) {
      updates.title = dto.title.trim();
    }

    if (dto.contentJson !== undefined) {
      updates.content = dto.contentJson;
      const raw = dto.contentText || JSON.stringify(dto.contentJson);
      updates.word_count = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    }

    if (dto.folderId !== undefined) {
      updates.folder_id = dto.folderId;
    }

    if (dto.status !== undefined) {
      updates.status = dto.status;
    }

    if (dto.tags !== undefined) {
      updates.tags = dto.tags;
    }

    if (dto.isPinned !== undefined) {
      updates.pinned = dto.isPinned;
    }

    const { data, error } = await this.supabaseService.client
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Error updating note: ${error?.message}`);
      throw new BadRequestException(error?.message || 'Failed to update note');
    }

    return this.mapDbNote(data);
  }

  /**
   * Soft-delete a note
   */
  async deleteNote(
    userId: string,
    noteId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.getNote(userId, noteId);

    const { error } = await this.supabaseService.client
      .from('notes')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting note ${noteId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Note deleted successfully',
    };
  }

  /**
   * List note folders
   */
  async listFolders(userId: string): Promise<NoteFolder[]> {
    // Try note_folders table first, fallback to folders table
    const { data: noteFolders, error: noteFoldersErr } =
      await this.supabaseService.client
        .from('note_folders')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

    if (!noteFoldersErr && noteFolders) {
      return noteFolders.map((f: any) => ({
        id: f.id,
        userId: f.user_id,
        parentFolderId: f.parent_folder_id || f.parent_id || null,
        name: f.name,
        icon: f.icon,
        color: f.color,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      }));
    }

    const { data: folders, error: foldersErr } = await this.supabaseService.client
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (foldersErr) {
      this.logger.error(`Error listing note folders: ${foldersErr.message}`);
      throw new BadRequestException(foldersErr.message);
    }

    return (folders || []).map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      parentFolderId: f.parent_id || null,
      name: f.name,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));
  }

  /**
   * Create a note folder
   */
  async createFolder(
    userId: string,
    dto: CreateNoteFolderDto,
  ): Promise<NoteFolder> {
    // Attempt insert into note_folders table
    const { data: noteFolder, error: noteFolderErr } =
      await this.supabaseService.client
        .from('note_folders')
        .insert({
          user_id: userId,
          parent_folder_id: dto.parentFolderId || null,
          name: dto.name.trim(),
          color: dto.color,
          icon: dto.icon,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

    if (!noteFolderErr && noteFolder) {
      return {
        id: noteFolder.id,
        userId: noteFolder.user_id,
        parentFolderId: noteFolder.parent_folder_id,
        name: noteFolder.name,
        color: noteFolder.color,
        icon: noteFolder.icon,
        createdAt: noteFolder.created_at,
        updatedAt: noteFolder.updated_at,
      };
    }

    // Fallback to folders table
    const { data: folder, error: folderErr } = await this.supabaseService.client
      .from('folders')
      .insert({
        user_id: userId,
        parent_id: dto.parentFolderId || null,
        name: dto.name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (folderErr || !folder) {
      this.logger.error(`Error creating note folder: ${folderErr?.message}`);
      throw new BadRequestException(folderErr?.message || 'Failed to create note folder');
    }

    return {
      id: folder.id,
      userId: folder.user_id,
      parentFolderId: folder.parent_id,
      name: folder.name,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
    };
  }

  /**
   * Delete a note folder
   */
  async deleteFolder(
    userId: string,
    folderId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Attempt deleting from note_folders
    await this.supabaseService.client
      .from('note_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    // Also attempt deleting from folders in case it was created there
    await this.supabaseService.client
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    return {
      success: true,
      message: 'Note folder deleted successfully',
    };
  }
}
