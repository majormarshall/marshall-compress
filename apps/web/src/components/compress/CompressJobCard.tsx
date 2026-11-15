'use client';

import React from 'react';
import {
  FileArchive,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  XCircle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatBytes, formatDate } from '@/components/cloud/FileCard';
import { useJobSSE } from '@/lib/hooks/useCompression';

export interface CompressJobCardProps {
  job: any;
  onCancel?: (jobId: string) => void;
  onDownload?: (jobId: string) => void;
  className?: string;
}

export function CompressJobCard({ job, onCancel, onDownload, className }: CompressJobCardProps) {
  // Support real-time SSE progress if the job is actively processing
  const sseData = useJobSSE(job.status === 'PROCESSING' || job.status === 'PENDING' ? job.id : null);

  const status = sseData.status || job.status || 'PENDING';
  const progress = sseData.progress > 0 ? sseData.progress : (job.progressPercent ?? job.progress ?? 0);
  const inputSize = job.inputSizeBytes ?? job.input_size_bytes ?? 0;
  const outputSize = sseData.compressedSizeBytes ?? job.outputSizeBytes ?? job.output_size_bytes ?? 0;
  const ratio = sseData.savingsPercentage
    ? sseData.savingsPercentage / 100
    : (job.compressionRatio ?? job.compression_ratio ?? (inputSize && outputSize ? (inputSize - outputSize) / inputSize : null));
  const errorMessage = sseData.error || job.errorMessage || job.error_message;
  const originalFileName = job.originalFileName || job.original_name || job.file_id || 'Compressed Asset';

  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" dot className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25">
            COMPLETED
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="violet" dot className="bg-violet-500/15 text-violet-300 border-violet-500/25 animate-pulse">
            PROCESSING
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" dot className="bg-amber-500/15 text-amber-300 border-amber-500/25">
            PENDING
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" dot className="bg-rose-500/15 text-rose-300 border-rose-500/25">
            FAILED
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="secondary" className="bg-slate-700/60 text-slate-400 border-slate-600/40">
            CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const savingsPercentage = ratio ? Math.round(ratio * 100) : null;

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-4 rounded-2xl border border-white/8 bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 shadow-xl',
        'hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5',
        className
      )}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 truncate">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-400 group-hover:scale-105 transition-transform">
            <FileArchive className="w-5 h-5" />
          </div>
          <div className="flex flex-col truncate">
            <h4 className="font-semibold text-slate-200 text-sm truncate group-hover:text-blue-400 transition-colors">
              {originalFileName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>Preset: {job.preset || job.settings?.preset || 'Balanced'}</span>
              <span>•</span>
              <span>{formatDate(job.createdAt || job.created_at || new Date().toISOString())}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Status-specific Display */}
      {status === 'PROCESSING' && (
        <div className="flex flex-col gap-2 rounded-xl bg-slate-950/40 p-3.5 border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-blue-400 font-medium">
              <Cpu className="w-3.5 h-3.5 animate-spin" /> Running multi-pass compression...
            </span>
            <span className="font-mono text-slate-300 font-bold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} variant="gradient" size="default" className="w-full" />
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-emerald-500/5 p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Original</span>
              <span className="text-sm font-mono text-slate-300 font-medium">{formatBytes(inputSize)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Compressed</span>
              <span className="text-sm font-mono text-emerald-300 font-bold">{formatBytes(outputSize)}</span>
            </div>
            {savingsPercentage !== null && savingsPercentage > 0 && (
              <Badge variant="success" className="ml-2 font-mono text-xs">
                -{savingsPercentage}% saved
              </Badge>
            )}
          </div>

          <Button
            size="sm"
            variant="default"
            onClick={() => onDownload?.(job.id)}
            className="shadow-lg shadow-blue-600/20 shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>
        </div>
      )}

      {status === 'FAILED' && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="truncate">{errorMessage || 'Compression pipeline encountered an error.'}</span>
        </div>
      )}

      {status === 'PENDING' && (
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/15">
          <Clock className="w-4 h-4 animate-spin shrink-0" />
          <span>Job queued in high-performance BullMQ worker pool...</span>
        </div>
      )}

      {/* Cancel Action if still active */}
      {(status === 'PENDING' || status === 'PROCESSING') && onCancel && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onCancel(job.id)}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancel Job
          </button>
        </div>
      )}
    </div>
  );
}
