import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateMeetingDto } from './dtos/create-meeting.dto';
import { ListMeetingsQueryDto } from './dtos/list-meetings-query.dto';
import {
  MeetingStatus,
  ActionItemStatus,
  type Meeting,
  type ActionItem,
  type PaginatedList,
} from '@marshall/shared';

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private mapDbMeeting(row: any): Meeting {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || null,
      status: (row.status as MeetingStatus) || MeetingStatus.COMPLETED,
      provider: row.platform || row.provider || 'MANUAL_UPLOAD',
      externalMeetingId: row.external_meeting_id || null,
      scheduledStartTime: row.scheduled_at || row.created_at,
      scheduledEndTime: null,
      actualStartTime: row.started_at || null,
      actualEndTime: row.ended_at || null,
      recording: row.recording_url
        ? {
            id: row.id,
            meetingId: row.id,
            storageKey: row.recording_url,
            fileSizeBytes: row.file_size_bytes || 0,
            durationSeconds: row.duration_seconds || 0,
            mimeType: 'video/mp4',
            url: row.recording_url,
            createdAt: row.created_at,
          }
        : undefined,
      transcript:
        row.transcript_text
          ? {
              id: row.id,
              meetingId: row.id,
              segments: [],
              rawText: row.transcript_text,
              language: 'en',
              durationSeconds: row.duration_seconds || 0,
              createdAt: row.created_at,
            }
          : undefined,
      notes: row.summary
        ? {
            id: row.id,
            meetingId: row.id,
            summary: row.summary,
            keyPoints: [],
            decisions: [],
            actionItems: [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDbActionItem(row: any): ActionItem {
    return {
      id: row.id,
      meetingId: row.meeting_id,
      description: row.description,
      assignee: row.assignee || null,
      assigneeEmail: row.assignee_email || null,
      dueDate: row.due_date || null,
      status: (row.status as ActionItemStatus) || ActionItemStatus.OPEN,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };
  }

  async findAll(
    userId: string,
    query: ListMeetingsQueryDto,
  ): Promise<PaginatedList<Meeting>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let dbQuery = this.supabaseService.client
      .from('meetings')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.search) {
      dbQuery = dbQuery.ilike('title', `%${query.search}%`);
    }

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Error listing meetings: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    const total = count || 0;
    return {
      items: ((data || []) as any[]).map((row) => this.mapDbMeeting(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, meetingId: string): Promise<Meeting> {
    const { data, error } = await this.supabaseService.client
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Meeting not found');
    }

    return this.mapDbMeeting(data);
  }

  async create(userId: string, dto: CreateMeetingDto): Promise<Meeting> {
    const { data, error } = await this.supabaseService.client
      .from('meetings')
      .insert({
        user_id: userId,
        title: dto.title.trim(),
        description: dto.description || null,
        status: MeetingStatus.COMPLETED,
        platform: dto.provider || 'MANUAL_UPLOAD',
        scheduled_at: dto.scheduledAt || new Date().toISOString(),
        recording_url: dto.storageKey || null,
        file_size_bytes: dto.fileSizeBytes || 0,
        duration_seconds: dto.durationSeconds || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !data) {
      this.logger.error(`Error creating meeting: ${error?.message}`);
      throw new BadRequestException(error?.message || 'Failed to create meeting');
    }

    return this.mapDbMeeting(data);
  }

  async delete(userId: string, meetingId: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(userId, meetingId);

    const { error } = await this.supabaseService.client
      .from('meetings')
      .delete()
      .eq('id', meetingId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting meeting: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return { success: true, message: 'Meeting deleted successfully' };
  }

  async getTranscript(userId: string, meetingId: string): Promise<{ rawText: string; segments: any[] }> {
    const meeting = await this.findOne(userId, meetingId);

    return {
      rawText: meeting.transcript?.rawText || '',
      segments: meeting.transcript?.segments || [],
    };
  }

  async getActionItems(userId: string, meetingId: string): Promise<ActionItem[]> {
    await this.findOne(userId, meetingId);

    const { data, error } = await this.supabaseService.client
      .from('action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching action items: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return ((data || []) as any[]).map((row) => this.mapDbActionItem(row));
  }
}
