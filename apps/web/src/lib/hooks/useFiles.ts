'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi, foldersApi, type ListFilesParams } from '../api/endpoints';
import type { UploadSessionRequest, CompleteUploadRequest } from '@marshall/shared';

export const FILES_QUERY_KEY = ['files'];

export function useFiles(params?: ListFilesParams) {
  return useQuery({
    queryKey: [...FILES_QUERY_KEY, params],
    queryFn: () => filesApi.listFiles(params),
    staleTime: 1000 * 30, // 30s
  });
}

export function useFile(fileId: string | null | undefined) {
  return useQuery({
    queryKey: ['file', fileId],
    queryFn: () => (fileId ? filesApi.getFile(fileId) : null),
    enabled: Boolean(fileId),
  });
}

export function useCreateUploadSession() {
  return useMutation({
    mutationFn: (req: UploadSessionRequest) => filesApi.createUploadSession(req),
  });
}

export function useCompleteUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CompleteUploadRequest) => filesApi.completeUpload(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => filesApi.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, dto }: { fileId: string; dto: { name?: string; folderId?: string | null } }) =>
      filesApi.updateFile(fileId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
    },
  });
}

export const FOLDERS_QUERY_KEY = ['folders'];

export function useFolders(parentId?: string | null) {
  return useQuery({
    queryKey: [...FOLDERS_QUERY_KEY, parentId],
    queryFn: () => foldersApi.listFolders(parentId),
    staleTime: 1000 * 30,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string | null }) =>
      foldersApi.createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => foldersApi.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

