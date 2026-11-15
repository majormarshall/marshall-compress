'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle2, AlertCircle, FileIcon, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { filesApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

export interface UploadDropzoneProps {
  folderId?: string | null;
  onComplete?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function UploadDropzone({ folderId, onComplete, maxFiles = 20, maxSizeMb = 2048 }: UploadDropzoneProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const updateFile = (id: string, patch: Partial<UploadFile>) =>
    setUploadQueue(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const uploadFile = async (item: UploadFile) => {
    updateFile(item.id, { status: 'uploading', progress: 5 });
    try {
      // Create upload session
      const session = await filesApi.createUploadSession({
        fileName: item.file.name,
        sizeBytes: item.file.size,
        mimeType: item.file.type || 'application/octet-stream',
        folderId: folderId || undefined,
      });

      updateFile(item.id, { progress: 20 });

      const targetUrl = session.presignedUrls[0] || (session as any).uploadUrl;
      let etag = 'etag';

      // Upload directly to presigned URL
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = 20 + Math.round((e.loaded / e.total) * 70);
            updateFile(item.id, { progress: pct });
          }
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '') || 'etag-1';
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.open('PUT', targetUrl);
        xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream');
        xhr.send(item.file);
      });

      updateFile(item.id, { progress: 95 });

      // Complete upload
      await filesApi.completeUpload({
        uploadId: session.uploadId,
        storageKey: session.storageKey,
        fileName: item.file.name,
        sizeBytes: item.file.size,
        mimeType: item.file.type || 'application/octet-stream',
        folderId: folderId || undefined,
        parts: [{ partNumber: 1, etag }],
      });

      updateFile(item.id, { status: 'done', progress: 100 });
    } catch (err: any) {
      updateFile(item.id, { status: 'error', error: err.message || 'Upload failed' });
    }
  };

  const handleStartUpload = async () => {
    const pending = uploadQueue.filter(f => f.status === 'pending');
    if (!pending.length) return;
    setUploading(true);
    // Upload 3 at a time
    const chunks: UploadFile[][] = [];
    for (let i = 0; i < pending.length; i += 3) chunks.push(pending.slice(i, i + 3));
    for (const chunk of chunks) {
      await Promise.all(chunk.map(uploadFile));
    }
    setUploading(false);
    const done = uploadQueue.filter(f => f.status === 'done').map(f => f.file);
    onComplete?.(done);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    setUploadQueue(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSizeMb * 1024 * 1024,
  });

  const removeFile = (id: string) => setUploadQueue(prev => prev.filter(f => f.id !== id));
  const pendingCount = uploadQueue.filter(f => f.status === 'pending').length;
  const doneCount = uploadQueue.filter(f => f.status === 'done').length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-slate-900/60 backdrop-blur-xl p-5">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-500/60 bg-blue-500/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        )}
      >
        <input {...getInputProps()} />
        <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <Upload className={cn('w-7 h-7 transition-colors', isDragActive ? 'text-blue-400' : 'text-slate-500')} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Up to {maxSizeMb}MB per file · {maxFiles} files max</p>
        </div>
      </div>

      {/* File Queue */}
      {uploadQueue.length > 0 && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {uploadQueue.map(item => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-950/40 p-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center">
                {item.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : item.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : item.status === 'uploading' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <FileIcon className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{item.file.name}</p>
                {item.status === 'uploading' && (
                  <Progress value={item.progress} size="sm" className="mt-1" />
                )}
                {item.status === 'error' && (
                  <p className="text-[10px] text-rose-400 mt-0.5">{item.error}</p>
                )}
                {item.status === 'done' && (
                  <p className="text-[10px] text-emerald-400 mt-0.5">Uploaded successfully</p>
                )}
              </div>
              {item.status === 'pending' && (
                <button type="button" onClick={() => removeFile(item.id)} className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      {uploadQueue.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {doneCount > 0 && <span className="text-emerald-400">{doneCount} done</span>}
            {pendingCount > 0 && <span className="text-slate-400"> · {pendingCount} pending</span>}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setUploadQueue([])} className="text-slate-500">
              Clear
            </Button>
            {pendingCount > 0 && (
              <Button size="sm" onClick={handleStartUpload} disabled={uploading} className="shadow-lg shadow-blue-600/20">
                {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
                Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
