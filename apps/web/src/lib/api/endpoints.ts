import { apiClient } from './client';
import type {
  UserProfile,
  FileItem,
  FolderItem,
  CompressionJob,
  CompressionSettings,
  UploadSessionRequest,
  UploadSessionResponse,
  CompleteUploadRequest,
  Note,
  NoteFolder,
  Meeting,
  MeetingProvider,
  MeetingStatus,
  NoteStatus,
  PaginatedList,
} from '@marshall/shared';

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ListFilesParams {
  folderId?: string | null;
  category?: string;
  search?: string;
  sortBy?: 'name' | 'size' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListJobsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface ListNotesParams {
  search?: string;
  folderId?: string | null;
  tag?: string;
  status?: NoteStatus;
  sortBy?: 'title' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateNoteDto {
  title: string;
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
  contentText?: string;
  folderId?: string | null;
  tags?: string[];
}

export interface UpdateNoteDto {
  title?: string;
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
  contentText?: string;
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface ListMeetingsParams {
  status?: MeetingStatus;
  provider?: MeetingProvider;
  page?: number;
  limit?: number;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  scheduledAt?: string;
  provider?: MeetingProvider;
  storageKey?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
}

export const authApi = {
  getMe: () => apiClient.get<UserProfile>('/auth/me'),
  register: (dto: RegisterDto) => apiClient.post<{ user: UserProfile }>('/auth/register', dto),
  logout: () => apiClient.post<{ success: boolean }>('/auth/logout'),
  forgotPassword: (email: string) => apiClient.post<{ success: boolean }>('/auth/forgot-password', { email }),
  resetPassword: (password: string, token: string) =>
    apiClient.post<{ success: boolean }>('/auth/reset-password', { password, token }),
};

export const filesApi = {
  listFiles: (params?: ListFilesParams) =>
    apiClient.get<{ files: FileItem[]; total: number }>('/files', {
      params: params as Record<string, string | number | boolean | undefined>,
    }),
  getFile: (fileId: string) => apiClient.get<FileItem>(`/files/${fileId}`),
  createUploadSession: (req: UploadSessionRequest) =>
    apiClient.post<UploadSessionResponse>('/files/upload/session', req),
  completeUpload: (req: CompleteUploadRequest) =>
    apiClient.post<FileItem>('/files/upload/complete', req),
  deleteFile: (fileId: string) =>
    apiClient.delete<{ success: boolean }>(`/files/${fileId}`),
  getDownloadUrl: (fileId: string) =>
    apiClient.get<{ downloadUrl: string; fileName: string }>(`/files/${fileId}/download`),
};

export const foldersApi = {
  listFolders: (parentId?: string | null) =>
    apiClient.get<FolderItem[]>('/folders', {
      params: parentId ? { parentId } : undefined,
    }),
  createFolder: (name: string, parentId?: string | null) =>
    apiClient.post<FolderItem>('/folders', { name, parentId }),
  deleteFolder: (folderId: string) =>
    apiClient.delete<{ success: boolean }>(`/folders/${folderId}`),
};

export const compressionApi = {
  createJob: (fileId: string, settings: CompressionSettings) =>
    apiClient.post<CompressionJob>('/compression/jobs', { fileId, settings }),
  listJobs: (params?: ListJobsParams) =>
    apiClient.get<{ jobs: CompressionJob[]; total: number }>('/compression/jobs', {
      params: params as Record<string, string | number | boolean | undefined>,
    }),
  getJob: (jobId: string) => apiClient.get<CompressionJob>(`/compression/jobs/${jobId}`),
  cancelJob: (jobId: string) => apiClient.post<CompressionJob>(`/compression/jobs/${jobId}/cancel`),
  getCompressedDownloadUrl: (jobId: string) =>
    apiClient.get<{ downloadUrl: string; fileName: string }>(`/compression/jobs/${jobId}/download`),
};

export const notesApi = {
  listNotes: (params?: ListNotesParams) =>
    apiClient.get<PaginatedList<Note>>('/notes', {
      params: params as Record<string, string | number | boolean | undefined>,
    }),
  getNote: (noteId: string) => apiClient.get<Note>(`/notes/${noteId}`),
  createNote: (dto: CreateNoteDto) => apiClient.post<Note>('/notes', dto),
  updateNote: (noteId: string, dto: UpdateNoteDto) =>
    apiClient.patch<Note>(`/notes/${noteId}`, dto),
  deleteNote: (noteId: string) => apiClient.delete<{ success: boolean }>(`/notes/${noteId}`),
  listFolders: () => apiClient.get<NoteFolder[]>('/notes/folders'),
  createFolder: (dto: { name: string; parentFolderId?: string | null; color?: string; icon?: string }) =>
    apiClient.post<NoteFolder>('/notes/folders', dto),
  deleteFolder: (folderId: string) =>
    apiClient.delete<{ success: boolean }>(`/notes/folders/${folderId}`),
};

export const meetingsApi = {
  listMeetings: (params?: ListMeetingsParams) =>
    apiClient.get<{ meetings: Meeting[]; total: number }>('/meetings', {
      params: params as Record<string, string | number | boolean | undefined>,
    }),
  getMeeting: (meetingId: string) => apiClient.get<Meeting>(`/meetings/${meetingId}`),
  createMeeting: (dto: CreateMeetingDto) => apiClient.post<Meeting>('/meetings', dto),
  updateMeeting: (meetingId: string, dto: Partial<CreateMeetingDto>) =>
    apiClient.patch<Meeting>(`/meetings/${meetingId}`, dto),
  deleteMeeting: (meetingId: string) =>
    apiClient.delete<{ success: boolean }>(`/meetings/${meetingId}`),
  updateActionItem: (meetingId: string, actionItemId: string, status: string) =>
    apiClient.patch<any>(`/meetings/${meetingId}/action-items/${actionItemId}`, { status }),
};

export const aiApi = {
  chat: (payload: { message: string; model?: string; provider?: string; conversationId?: string }) =>
    apiClient.post<{ response: string; conversationId: string }>('/ai/chat', payload),
  getConversations: () => apiClient.get<any[]>('/ai/conversations'),
  getConversation: (id: string) => apiClient.get<any>(`/ai/conversations/${id}`),
};


