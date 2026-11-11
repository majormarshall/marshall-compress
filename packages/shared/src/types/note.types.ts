/**
 * Publication status of a note.
 */
export enum NoteStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

/**
 * Supported formats for document export.
 */
export enum NoteExportFormat {
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
  MARKDOWN = 'MARKDOWN',
}

/**
 * Categorical tag for tagging notes and knowledge items.
 */
export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

/**
 * Organizational folder containing notes.
 */
export interface NoteFolder {
  id: string;
  userId: string;
  parentFolderId: string | null;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Note entity supporting Tiptap rich-text content, tags, and versioning.
 */
export interface Note {
  id: string;
  userId: string;
  folderId: string | null;
  title: string;
  contentJson: Record<string, unknown> | null; // Tiptap JSON schema structure
  contentHtml: string;
  contentText: string;
  status: NoteStatus;
  tags: Tag[];
  isPinned: boolean;
  isArchived: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
