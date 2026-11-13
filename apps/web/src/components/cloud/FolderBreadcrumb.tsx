'use client';

import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FolderBreadcrumbProps {
  path: Array<{ id: string; name: string }>;
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

export function FolderBreadcrumb({ path, onNavigate, className }: FolderBreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)}>
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">My Drive</span>
      </button>
      {path.map((segment, i) => (
        <React.Fragment key={segment.id}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            type="button"
            onClick={() => onNavigate(segment.id)}
            className={cn(
              'transition-colors truncate max-w-[120px]',
              i === path.length - 1
                ? 'text-slate-200 font-medium cursor-default'
                : 'text-slate-400 hover:text-blue-400'
            )}
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
