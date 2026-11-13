'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { useUpdateFile } from '@/lib/hooks/useFiles';
import { toast } from 'sonner';

export interface RenameFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function RenameFileDialog({ isOpen, onClose, file, onSuccess }: RenameFileDialogProps) {
  const [fileName, setFileName] = useState('');
  const updateFileMutation = useUpdateFile();

  useEffect(() => {
    if (file) {
      setFileName(file.name);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const trimmed = fileName.trim();
    if (!trimmed) {
      toast.error('File name cannot be empty');
      return;
    }

    if (trimmed === file.name) {
      onClose();
      return;
    }

    try {
      await updateFileMutation.mutateAsync({
        fileId: file.id,
        dto: { name: trimmed },
      });
      toast.success('File renamed successfully');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to rename file');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Pencil className="w-5 h-5 text-blue-400" />
            Rename File
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              File Name
            </label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter new file name..."
              autoFocus
              className="bg-slate-950/60 border-white/10 text-slate-200"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateFileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateFileMutation.isPending || !fileName.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {updateFileMutation.isPending ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
