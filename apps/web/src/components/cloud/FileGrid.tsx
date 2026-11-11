'use client';

import React from 'react';
import {
  Folder as FolderIcon,
  ChevronRight,
  HardDrive,
  Download,
  Trash2,
  Copy,
  Calendar,
  FileBox,
} from 'lucide-react';
import type { FileItem, FolderItem } from '@marshall/shared';
import { FileCard, formatBytes, formatDate, getFileIcon } from './FileCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FileGridProps {
  files: FileItem[];
  folders: FolderItem[];
  view: 'grid' | 'list';
  onFolderClick?: (folder: FolderItem) => void;
  onFileDelete?: (file: FileItem) => void;
  onFileDownload?: (file: FileItem) => void;
  onFolderDelete?: (folder: FolderItem) => void;
  className?: string;
}

export function FileGrid({
  files,
  folders,
  view,
  onFolderClick,
  onFileDelete,
  onFileDownload,
  onFolderDelete,
  className,
}: FileGridProps) {
  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-4">
          <FileBox className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">No files or folders yet</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Upload files or create your first folder to organize and securely manage your cloud assets.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Folders ({folders.length})
            </h3>
          </div>

          <div
            className={cn(
              'grid gap-3',
              view === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1'
            )}
          >
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onFolderClick?.(folder)}
                className="group relative flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-slate-900/60 hover:bg-slate-800/80 hover:border-blue-500/30 transition-all duration-200 cursor-pointer backdrop-blur-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <FolderIcon className="w-5 h-5 fill-amber-500/30" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                      {folder.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Folder
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onFolderDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFolderDelete(folder);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                      title="Delete folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Files ({files.length})
            </h3>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={onFileDelete}
                  onDownload={onFileDownload}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/5 rounded-2xl border border-white/8 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-950/40">
                <span className="col-span-6">Name</span>
                <span className="col-span-2">Size</span>
                <span className="col-span-2">Modified</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 text-sm hover:bg-white/5 transition-colors group"
                >
                  <div className="col-span-6 flex items-center gap-3 truncate">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 shrink-0">
                      {getFileIcon(file.mime_type, 'w-4 h-4')}
                    </div>
                    <span className="font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                      {file.name}
                    </span>
                  </div>

                  <span className="col-span-2 text-xs text-slate-400 font-mono">
                    {formatBytes(file.size_bytes)}
                  </span>

                  <span className="col-span-2 text-xs text-slate-500 font-mono">
                    {formatDate(file.created_at)}
                  </span>

                  <div className="col-span-2 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onFileDownload?.(file)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onFileDelete?.(file)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
