'use client';

import React from 'react';
import {
  CheckSquare,
  Square,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActionItemStatus, type ActionItem } from '@marshall/shared';
import { cn } from '@/lib/utils';
import { formatDate } from '@/components/cloud/FileCard';

export interface ActionItemsListProps {
  actionItems: ActionItem[];
  onToggle?: (id: string, newStatus: ActionItemStatus) => void;
  className?: string;
}

export function ActionItemsList({ actionItems, onToggle, className }: ActionItemsListProps) {
  if (actionItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-white/5 bg-slate-900/30">
        <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Action Items Extracted</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          AI automatically extracts tasks, owners, and deadlines from meeting discussions.
        </p>
      </div>
    );
  }

  const completedCount = actionItems.filter((i) => i.status === ActionItemStatus.DONE).length;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Extracted Tasks ({completedCount}/{actionItems.length} completed)
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {actionItems.map((item) => {
          const isDone = item.status === ActionItemStatus.DONE;
          return (
            <div
              key={item.id}
              onClick={() =>
                onToggle?.(
                  item.id,
                  isDone ? ActionItemStatus.OPEN : ActionItemStatus.DONE
                )
              }
              className={cn(
                'group flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md select-none',
                isDone
                  ? 'bg-slate-950/40 border-white/5 opacity-70'
                  : 'bg-slate-900/60 border-white/10 hover:border-blue-500/30 hover:bg-slate-800/80 shadow-md'
              )}
            >
              <button
                type="button"
                className="mt-0.5 text-slate-400 hover:text-blue-400 transition-colors"
              >
                {isDone ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />
                )}
              </button>

              <div className="flex-1 flex flex-col gap-1.5">
                <p
                  className={cn(
                    'text-sm font-medium leading-snug',
                    isDone ? 'line-through text-slate-500' : 'text-slate-200'
                  )}
                >
                  {item.description}
                </p>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {item.assignee && (
                    <Badge variant="secondary" className="flex items-center gap-1 font-normal text-[11px] py-0 h-5">
                      <User className="w-3 h-3 text-blue-400" />
                      <span>{item.assignee}</span>
                    </Badge>
                  )}

                  {item.dueDate && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>Due {formatDate(item.dueDate)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
