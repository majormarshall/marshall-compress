'use client';

import React from 'react';
import { ChevronRight, HardDrive, Folder as FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface FolderBreadcrumbProps {
  folders: BreadcrumbItem[];
  onNavigate: (id: string | null) => void;
  className?: string;
}

export function FolderBreadcrumb({
  folders,
  onNavigate,
  className,
}: FolderBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-1.5 flex-wrap px-3 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md text-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all duration-200',
          folders.length === 0
            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        )}
      >
        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
        <span>Root Storage</span>
      </button>

      {folders.map((folder, index) => {
        const isLast = index === folders.length - 1;
        return (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate(folder.id)}
              disabled={isLast}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all duration-200 truncate max-w-[200px]',
                isLast
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm cursor-default'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
              title={folder.name}
            >
              <FolderIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
