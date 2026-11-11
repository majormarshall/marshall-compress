'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Folder as FolderIcon,
  FileText,
  Calendar,
  Pin,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Note, NoteFolder } from '@marshall/shared';
import { cn } from '@/lib/utils';
import { formatDate } from '@/components/cloud/FileCard';

export interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelect: (noteId: string) => void;
  onCreate: () => void;
  folders?: NoteFolder[];
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
  onCreateFolder?: () => void;
  className?: string;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  onCreate,
  folders = [],
  selectedFolderId = null,
  onSelectFolder,
  onCreateFolder,
  className,
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes by search query and folder
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.contentText && note.contentText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFolder = selectedFolderId ? note.folderId === selectedFolderId : true;

    return matchesSearch && matchesFolder;
  });

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      {/* Top Header & Search */}
      <div className="flex flex-col gap-3 p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100 text-sm">Notes</span>
            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
              {notes.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={onCreate}
            className="h-8 px-3 text-xs shadow-md shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Note
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Folders List Header */}
      {folders.length > 0 && (
        <div className="flex flex-col p-3 border-b border-white/5 bg-slate-950/20">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Folders
            </span>
            {onCreateFolder && (
              <button
                type="button"
                onClick={onCreateFolder}
                className="text-[10px] text-slate-500 hover:text-slate-300"
                title="Create folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => onSelectFolder?.(null)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                selectedFolderId === null
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              All Notes
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => onSelectFolder?.(folder.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  selectedFolderId === folder.id
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
              >
                <FolderIcon className="w-3 h-3 text-amber-400" />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes List Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500">
            <FileText className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-medium text-slate-400">No notes found</p>
            <p className="text-[11px] mt-0.5">Click "New Note" to start writing.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const previewText = note.contentText || note.contentHtml?.replace(/<[^>]*>?/gm, '') || 'No additional text';

            return (
              <div
                key={note.id}
                onClick={() => onSelect(note.id)}
                className={cn(
                  'flex flex-col gap-1 p-3 rounded-xl transition-all duration-200 cursor-pointer select-none group',
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/30 shadow-md shadow-blue-500/5'
                    : 'hover:bg-white/5 border border-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className={cn(
                      'text-sm font-semibold truncate flex-1',
                      isSelected ? 'text-blue-300' : 'text-slate-200 group-hover:text-blue-400'
                    )}
                  >
                    {note.title || 'Untitled Note'}
                  </h4>
                  {note.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20 rotate-45" />
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {previewText}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                  {note.wordCount ? <span>{note.wordCount} words</span> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
