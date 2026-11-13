'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '../api/endpoints';

export function useFolders(parentId?: string | null) {
  return useQuery({
    queryKey: ['folders', parentId],
    queryFn: () => foldersApi.listFolders(parentId),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string | null }) =>
      foldersApi.createFolder(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => foldersApi.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
