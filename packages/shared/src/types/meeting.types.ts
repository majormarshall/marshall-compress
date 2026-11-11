/**
 * Status lifecycle of a meeting.
 */
export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Tracking status of an action item extracted from a meeting.
 */
export enum ActionItemStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/**
 * Meeting platform provider.
 */
export type MeetingProvider = 'ZOOM' | 'GOOGLE_MEET' | 'MANUAL_UPLOAD';

/**
 * Individual timed segment of speech with speaker diarization.
 */
export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

/**
 * Full transcribed conversation of a meeting.
 */
export interface Transcript {
  id: string;
  meetingId: string;
  segments: TranscriptSegment[];
  rawText: string;
  language: string;
  durationSeconds: number;
  createdAt: string;
}

/**
 * Actionable task assigned to a participant.
 */
export interface ActionItem {
  id: string;
  meetingId: string;
  description: string;
  assignee: string | null;
  assigneeEmail?: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI-generated structured meeting minutes and executive summary.
 */
export interface MeetingNote {
  id: string;
  meetingId: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Audio / video recording file details associated with the meeting.
 */
export interface Recording {
  id: string;
  meetingId: string;
  storageKey: string;
  fileSizeBytes: number;
  durationSeconds: number;
  mimeType: string;
  url: string;
  createdAt: string;
}

/**
 * Meeting entity containing metadata, recording, transcript, and notes.
 */
export interface Meeting {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  provider: MeetingProvider;
  externalMeetingId: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  recording?: Recording;
  transcript?: Transcript;
  notes?: MeetingNote;
  createdAt: string;
  updatedAt: string;
}
