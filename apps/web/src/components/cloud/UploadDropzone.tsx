'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, AlertCircle, X, File, Sparkles } from 'lucide-react';
import { useUploadStore } from '@/lib/stores/upload.store';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatBytes } from './FileCard';

export interface UploadDropzoneProps {
  onFilesAccepted?: (files: File[]) => void;
  className?: string;
  folderId?: string | null;
}

export function UploadDropzone({ onFilesAccepted, className, folderId }: UploadDropzoneProps) {
  const { queue, addFiles, updateProgress, setStatus, removeFile, clearCompleted } = useUploadStore();

  const handleSimulatedUpload = useCallback((files: File[]) => {
    // When files are dropped, add to store and simulate reactive progress upload
    addFiles(files);

    files.forEach((file) => {
      const generatedId = `${file.name}`;
      // Simulate incremental upload progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 15;
        if (currentProgress >= 100) {
          clearInterval(interval);
          // Find matching queue item
          const match = useUploadStore.getState().queue.find((q) => q.file.name === file.name && q.status !== 'completed');
          if (match) {
            updateProgress(match.id, 100);
            setStatus(match.id, 'completed');
          }
        } else {
          const match = useUploadStore.getState().queue.find((q) => q.file.name === file.name && q.status !== 'completed');
          if (match) {
            setStatus(match.id, 'uploading');
            updateProgress(match.id, currentProgress);
          }
        }
      }, 250);
    });
  }, [addFiles, updateProgress, setStatus]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      handleSimulatedUpload(acceptedFiles);
      if (onFilesAccepted) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [handleSimulatedUpload, onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: true,
  });

  const activeUploads = queue.filter((q) => q.status === 'uploading' || q.status === 'pending');
  const completedUploads = queue.filter((q) => q.status === 'completed');

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer select-none',
          'bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-xl',
          isDragActive
            ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_35px_rgba(59,130,246,0.35)] scale-[1.01]'
            : 'border-white/10 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5',
          isDragReject && 'border-rose-500 bg-rose-500/10'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 shadow-inner',
              isDragActive
                ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/50 animate-bounce'
                : 'bg-white/5 border-white/10 text-blue-400 group-hover:scale-110'
            )}
          >
            <UploadCloud className="h-8 w-8" />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold text-slate-100">
              {isDragActive ? (
                <span className="text-blue-400">Release to drop files here</span>
              ) : (
                <>
                  Drop files here or <span className="text-blue-400 underline underline-offset-4 hover:text-blue-300">click to browse</span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-400">
              Supports documents, photos, audio, video and archives up to 5GB
            </p>
          </div>
        </div>
      </div>

      {/* Upload Queue Progress Area */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-slate-900/50 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Upload Queue ({queue.length})
            </span>
            {completedUploads.length > 0 && (
              <button
                type="button"
                onClick={clearCompleted}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-slate-950/40 p-3"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <File className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{item.file.name}</span>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">
                      ({formatBytes(item.file.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-blue-400 font-mono font-medium">
                        {Math.round(item.progress)}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.status === 'uploading' && (
                  <Progress
                    value={item.progress}
                    variant="gradient"
                    size="sm"
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
