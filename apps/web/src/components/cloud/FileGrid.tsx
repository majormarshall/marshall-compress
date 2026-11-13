'use client';

import React, { useState } from 'react';
import {
  Download, Trash2, MoreVertical, Copy, Zap, FolderInput, Pencil,
  FolderIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { filesApi } from '@/lib/api/endpoints';
import { foldersApi } from '@/lib/api/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FileItem, FolderItem } from '@marshall/shared';
import { formatBytes, getMimeIcon } from './FileCard';

export interface FileGridProps {
  files: FileItem[];
  folders: FolderItem[];
  viewMode?: 'grid' | 'list';
  onFolderOpen?: (id: string, name: string) => void;
  onRefresh?: () => void;
}

export function FileGrid({ files, folders, viewMode = 'grid', onFolderOpen, onRefresh }: FileGridProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const { downloadUrl } = await filesApi.getDownloadUrl(fileId);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.click();
    } catch {
      toast.error('Failed to get download link');
    }
  };

  const handleCopyLink = async (fileId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/dashboard/cloud?fileId=${fileId}`);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await filesApi.deleteFile(fileId);
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['files'] });
      onRefresh?.();
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  const handleCompress = (fileId: string) => {
    // Navigate to compress page with fileId pre-filled
    window.location.href = `/dashboard/compress?fileId=${fileId}`;
  };

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-white/5 bg-slate-900/20">
        <FolderIcon className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">This folder is empty</h3>
        <p className="text-xs text-slate-500 mt-1">Upload files or create folders to get started.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col rounded-2xl border border-white/8 bg-slate-900/50 overflow-hidden">
        {/* Folders */}
        {folders.map(folder => (
          <div
            key={folder.id}
            onClick={() => onFolderOpen?.(folder.id, folder.name)}
            className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] border-b border-white/5 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3">
              <FolderIcon className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors">{folder.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Folder</Badge>
          </div>
        ))}
        {/* Files */}
        {files.map(file => (
          <div key={file.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] border-b border-white/5 last:border-0 transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
              {getMimeIcon(file.mime_type, 'md')}
              <div className="min-w-0">
                <p className="text-sm text-slate-300 truncate group-hover:text-blue-400 transition-colors">{file.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(file.size_bytes)}</p>
              </div>
            </div>
            <div className={cn('flex items-center gap-1 shrink-0 transition-opacity', openMenuId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
              <button type="button" onClick={() => handleDownload(file.id, file.name)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <DropdownMenu open={openMenuId === file.id} onOpenChange={(o) => setOpenMenuId(o ? file.id : null)}>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors" title="More actions">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => handleCopyLink(file.id)} className="gap-2">
                    <Copy className="w-3.5 h-3.5" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCompress(file.id)} className="gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    Compress
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid mode
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {/* Folders first */}
      {folders.map(folder => (
        <div
          key={folder.id}
          onClick={() => onFolderOpen?.(folder.id, folder.name)}
          className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/8 bg-slate-900/60 hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer transition-all duration-200"
        >
          <FolderIcon className="w-10 h-10 text-amber-400 group-hover:scale-105 transition-transform" />
          <span className="text-xs font-medium text-slate-300 text-center truncate w-full">{folder.name}</span>
        </div>
      ))}
      {/* Files */}
      {files.map(file => (
        <div
          key={file.id}
          className="group relative flex flex-col gap-3 p-4 rounded-2xl border border-white/8 bg-slate-900/60 hover:border-blue-500/30 transition-all duration-200"
        >
          <div className="flex items-center justify-center h-14 w-14 mx-auto rounded-xl bg-slate-800/60 border border-white/5 group-hover:scale-105 transition-transform">
            {getMimeIcon(file.mime_type, 'lg')}
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">{file.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{formatBytes(file.size_bytes)}</p>
          </div>
          {/* Overlay actions on hover */}
          <div className={cn('absolute top-2 right-2 flex gap-1 transition-opacity', openMenuId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDownload(file.id, file.name); }}
              className="p-1 rounded-lg text-slate-400 hover:text-blue-400 bg-slate-900/80 hover:bg-blue-500/10 transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <DropdownMenu open={openMenuId === file.id} onOpenChange={(o) => setOpenMenuId(o ? file.id : null)}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-white/10 transition-colors"
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handleCopyLink(file.id)} className="gap-2">
                  <Copy className="w-3.5 h-3.5" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCompress(file.id)} className="gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  Compress
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  className="gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
