'use client';

import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  FileCode,
  File,
  Download,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { FileItem } from '@marshall/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface FileCardProps {
  file: FileItem;
  onDelete?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  className?: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getFileIcon(mimeType: string, className = 'w-6 h-6') {
  if (mimeType.startsWith('image/')) return <ImageIcon className={cn('text-sky-400', className)} />;
  if (mimeType.startsWith('video/')) return <Video className={cn('text-violet-400', className)} />;
  if (mimeType.startsWith('audio/')) return <Music className={cn('text-emerald-400', className)} />;
  if (mimeType === 'application/pdf') return <FileText className={cn('text-rose-400', className)} />;
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('rar') ||
    mimeType.includes('compressed')
  ) {
    return <Archive className={cn('text-amber-400', className)} />;
  }
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('html') ||
    mimeType.includes('typescript') ||
    mimeType.includes('xml')
  ) {
    return <FileCode className={cn('text-cyan-400', className)} />;
  }
  return <File className={cn('text-slate-400', className)} />;
}

export function FileCard({ file, onDelete, onDownload, className }: FileCardProps) {
  const [copied, setCopied] = useState(false);
  const isImage = file.mime_type.startsWith('image/');
  const imagePreviewUrl = file.thumbnail_url || file.storage_url;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = file.storage_url || `${window.location.origin}/files/${file.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(file);
    } else if (file.storage_url) {
      window.open(file.storage_url, '_blank');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(file);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-4 transition-all duration-300 backdrop-blur-xl',
        'hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10',
        className
      )}
    >
      {/* Top Preview Area */}
      <div className="relative mb-3 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 border border-white/5">
        {isImage && imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt={file.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Hide broken image and fallback to icon
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-blue-500/30 transition-colors">
              {getFileIcon(file.mime_type, 'w-6 h-6')}
            </div>
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              {file.name.split('.').pop() || 'FILE'}
            </span>
          </div>
        )}

        {/* Hover Quick Action Buttons Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/90 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:scale-105 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy public link"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/90 text-slate-200 border border-white/10 hover:bg-slate-700 hover:scale-105 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete file"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white hover:scale-105 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Info */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4
            className="font-medium text-slate-200 text-sm truncate flex-1 leading-snug group-hover:text-blue-400 transition-colors"
            title={file.name}
          >
            {file.name}
          </h4>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 bg-slate-800/60">
            {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>{formatBytes(file.size_bytes)}</span>
          <span>{formatDate(file.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
