'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderInput, FolderIcon, HardDrive, Check, ChevronRight } from 'lucide-react';
import { useFolders } from '@/lib/hooks/useFolders';
import { useUpdateFile } from '@/lib/hooks/useFiles';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { FolderItem } from '@marshall/shared';

export interface MoveFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: { id: string; name: string; folder_id?: string | null } | null;
  onSuccess?: () => void;
}

export function MoveFileDialog({ isOpen, onClose, file, onSuccess }: MoveFileDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [navFolderId, setNavFolderId] = useState<string | null>(null);
  const updateFileMutation = useUpdateFile();

  // Load folders for current navigation level
  const { data: folders, isLoading } = useFolders(navFolderId);

  const handleMove = async () => {
    if (!file) return;

    if (selectedFolderId === file.folder_id) {
      toast.info('File is already in this folder');
      onClose();
      return;
    }

    try {
      await updateFileMutation.mutateAsync({
        fileId: file.id,
        dto: { folderId: selectedFolderId },
      });
      toast.success('File moved successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to move file');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <FolderInput className="w-5 h-5 text-indigo-400" />
            Move &ldquo;{file?.name}&rdquo;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <p className="text-xs text-slate-400">
            Select a target destination for this file:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-1 rounded-xl border border-white/10 bg-slate-950/40 p-2">
            {/* Root Drive Option */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                selectedFolderId === null
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-white/5'
              )}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span className="font-medium">Root Drive</span>
              </div>
              {selectedFolderId === null && <Check className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Folder list */}
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading folders...</div>
            ) : folders && folders.length > 0 ? (
              folders.map((folder: FolderItem) => {
                const isSelected = selectedFolderId === folder.id;
                return (
                  <div
                    key={folder.id}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                    >
                      <FolderIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </button>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 mr-1" />}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                No subfolders at this level.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateFileMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={updateFileMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {updateFileMutation.isPending ? 'Moving...' : 'Move Here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
