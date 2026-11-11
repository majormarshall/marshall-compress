'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Sparkles,
  FolderPlus,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteList } from '@/components/notes/NoteList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import {
  useNotes,
  useNoteFolders,
  useCreateNote,
  useUpdateNote,
  useCreateNoteFolder,
} from '@/lib/hooks/useNotes';
import type { Note } from '@marshall/shared';
import { toast } from 'sonner';

export default function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: notesData, isLoading: notesLoading, refetch: refetchNotes } = useNotes({
    folderId: selectedFolderId,
  });
  const { data: foldersData } = useNoteFolders();
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const createFolderMutation = useCreateNoteFolder();

  const notes: Note[] = (notesData as any)?.notes || (notesData as any)?.items || [];
  const folders = foldersData || [];

  // Default select first note when notes load
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  const activeNote = notes.find((n) => n.id === selectedNoteId) || (notes.length > 0 ? notes[0] : null);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: 'Untitled Note',
        folderId: selectedFolderId,
        contentHtml: '',
        contentText: '',
      });
      setSelectedNoteId(newNote.id);
      toast.success('New note created');
      refetchNotes();
    } catch {
      toast.error('Failed to create note');
    }
  };

  const handleEditorChange = useCallback(
    (updated: { title: string; contentHtml: string; contentJson?: any; contentText?: string }) => {
      if (!selectedNoteId) return;

      setSaving(true);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          await updateNoteMutation.mutateAsync({
            id: selectedNoteId,
            dto: {
              title: updated.title,
              contentHtml: updated.contentHtml,
              contentJson: updated.contentJson,
              contentText: updated.contentText,
            },
          });
        } catch {
          // silently handle or log
        } finally {
          setSaving(false);
        }
      }, 1000);
    },
    [selectedNoteId, updateNoteMutation]
  );

  const handleCreateFolder = async () => {
    const name = prompt('Enter new folder name:');
    if (!name?.trim()) return;
    try {
      await createFolderMutation.mutateAsync({ name: name.trim() });
      toast.success(`Created folder "${name}"`);
    } catch {
      toast.error('Failed to create folder');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-7xl mx-auto p-6 w-full gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileText className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Knowledge Notes</h1>
          <Badge variant="cyan" className="ml-2">Rich Markdown & Tiptap</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleCreateFolder}>
            <FolderPlus className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Folder
          </Button>
          <Button size="sm" variant="default" onClick={handleCreateNote}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Note
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Note List (1/3 or 4 cols) */}
        <div className="md:col-span-4 h-full">
          {notesLoading ? (
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-white/5 bg-slate-900/40 h-full">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : (
            <NoteList
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelect={(id) => setSelectedNoteId(id)}
              onCreate={handleCreateNote}
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={(id) => setSelectedFolderId(id)}
              onCreateFolder={handleCreateFolder}
            />
          )}
        </div>

        {/* Right Note Editor (2/3 or 8 cols) */}
        <div className="md:col-span-8 h-full">
          <NoteEditor
            note={activeNote}
            onChange={handleEditorChange}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}
