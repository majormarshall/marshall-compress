'use client';

import React, { useState } from 'react';
import {
  FileIcon, FileVideoIcon, FileImageIcon, FileTextIcon, FileSpreadsheetIcon,
  FileArchiveIcon, FileMusicIcon, FileCodeIcon,
  Download, Trash2, MoreVertical, Copy, Zap, FolderInput, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileItem } from '@marshall/shared';

export function formatBytes(bytes: number = 0): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function getMimeIcon(mime: string = '', size: 'sm' | 'md' | 'lg' = 'md') {
  const cls = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  if (mime.includes('video')) return <FileVideoIcon className={cn(cls, 'text-purple-400')} />;
  if (mime.includes('image')) return <FileImageIcon className={cn(cls, 'text-emerald-400')} />;
  if (mime.includes('pdf')) return <FileTextIcon className={cn(cls, 'text-rose-400')} />;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return <FileSpreadsheetIcon className={cn(cls, 'text-green-400')} />;
  if (mime.includes('audio')) return <FileMusicIcon className={cn(cls, 'text-pink-400')} />;
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed'))
    return <FileArchiveIcon className={cn(cls, 'text-amber-400')} />;
  if (mime.includes('javascript') || mime.includes('typescript') || mime.includes('json') || mime.includes('html'))
    return <FileCodeIcon className={cn(cls, 'text-cyan-400')} />;
  return <FileIcon className={cn(cls, 'text-blue-400')} />;
}

export interface FileCardProps {
  file: FileItem;
  onDownload?: (fileId: string, fileName: string) => void;
  onDelete?: (fileId: string) => void;
  onRename?: (fileId: string, currentName: string) => void;
  onCompress?: (fileId: string, fileName: string) => void;
  onMove?: (fileId: string) => void;
  className?: string;
}

export function FileCard({ file, onDownload, onDelete, onRename, onCompress, onMove, className }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      // Build a shareable link — the actual presigned URL is fetched on download;
      // for copy-link we just copy the in-app route so users can reference it.
      await navigator.clipboard.writeText(`${window.location.origin}/dashboard/cloud?fileId=${file.id}`);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={cn(
      'group flex items-center gap-3 p-4 rounded-2xl border border-white/8 bg-slate-900/60 hover:border-blue-500/30 hover:shadow-xl transition-all duration-200',
      className
    )}>
      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
        {getMimeIcon(file.mime_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">{file.name}</p>
        <p className="text-xs text-slate-500">{formatBytes(file.size_bytes)} · {formatDate(file.created_at)}</p>
      </div>

      {/* Action area */}
      <div className={cn('flex items-center gap-1 shrink-0 transition-opacity', menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        {onDownload && (
          <button
            type="button"
            onClick={() => onDownload(file.id, file.name)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onRename && (
              <DropdownMenuItem onClick={() => onRename(file.id, file.name)} className="gap-2">
                <Pencil className="w-3.5 h-3.5" />
                Rename
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
              <Copy className="w-3.5 h-3.5" />
              Copy link
            </DropdownMenuItem>
            {onCompress && (
              <DropdownMenuItem onClick={() => onCompress(file.id, file.name)} className="gap-2">
                <Zap className="w-3.5 h-3.5" />
                Compress
              </DropdownMenuItem>
            )}
            {onMove && (
              <DropdownMenuItem onClick={() => onMove(file.id)} className="gap-2">
                <FolderInput className="w-3.5 h-3.5" />
                Move to folder
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(file.id)}
                className="gap-2 text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
