'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, type ListNotesParams, type CreateNoteDto, type UpdateNoteDto } from '../api/endpoints';
import type { Note, NoteFolder } from '@marshall/shared';

export const NOTES_QUERY_KEY = ['notes'];
export const NOTE_FOLDERS_QUERY_KEY = ['notes', 'folders'];

export function useNotes(params?: ListNotesParams) {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, params],
    queryFn: () => notesApi.listNotes(params),
    staleTime: 1000 * 30,
  });
}

export function useNote(noteId: string | null | undefined) {
  return useQuery({
    queryKey: ['note', noteId],
    queryFn: () => (noteId ? notesApi.getNote(noteId) : null),
    enabled: Boolean(noteId),
  });
}

export function useNoteFolders() {
  return useQuery({
    queryKey: NOTE_FOLDERS_QUERY_KEY,
    queryFn: () => notesApi.listFolders(),
    staleTime: 1000 * 60,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNoteDto) => notesApi.createNote(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNoteDto }) =>
      notesApi.updateNote(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['note', variables.id] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => notesApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

export function useCreateNoteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; parentFolderId?: string | null; color?: string; icon?: string }) =>
      notesApi.createFolder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTE_FOLDERS_QUERY_KEY });
    },
  });
}
