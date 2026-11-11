'use client';

import React, { useState, useMemo } from 'react';
import {
  FileArchive,
  Sparkles,
  Sliders,
  HardDrive,
  RefreshCw,
  Plus,
  Zap,
  TrendingDown,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CompressionSettings } from '@/components/compress/CompressionSettings';
import { CompressJobCard } from '@/components/compress/CompressJobCard';
import { formatBytes } from '@/components/cloud/FileCard';
import {
  useCompressionJobs,
  useCreateCompressionJob,
  useCancelJob,
} from '@/lib/hooks/useCompression';
import { useFiles } from '@/lib/hooks/useFiles';
import type { CompressionSettings as SettingsType } from '@marshall/shared';
import { toast } from 'sonner';

export default function CompressionPage() {
  const [showSettings, setShowSettings] = useState(true);

  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useCompressionJobs();
  const { data: filesData } = useFiles();
  const createJobMutation = useCreateCompressionJob();
  const cancelJobMutation = useCancelJob();

  const jobs = jobsData?.jobs || [];
  const files = filesData?.files || [];

  // Compute stats
  const stats = useMemo(() => {
    let totalSaved = 0;
    let completedCount = 0;

    jobs.forEach((job: any) => {
      if (job.status === 'COMPLETED') {
        completedCount++;
        const input = job.inputSizeBytes ?? job.input_size_bytes ?? 0;
        const output = job.outputSizeBytes ?? job.output_size_bytes ?? 0;
        if (input > output) {
          totalSaved += input - output;
        }
      }
    });

    return {
      totalJobs: jobs.length,
      completedCount,
      storageSaved: totalSaved,
    };
  }, [jobs]);

  const handleCreateJob = async (settings: SettingsType, fileId: string) => {
    try {
      await createJobMutation.mutateAsync({ fileId, settings });
      toast.success('Compression job dispatched to worker queue');
      refetchJobs();
    } catch {
      toast.error('Failed to create compression job');
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJobMutation.mutateAsync(jobId);
      toast.info('Job cancelled');
    } catch {
      toast.error('Failed to cancel job');
    }
  };

  const handleDownload = (jobId: string) => {
    toast.info(`Fetching download link for job ${jobId}`);
  };

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FileArchive className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Media Compression</h1>
            <Badge variant="violet" className="ml-2">Lossless & Lossy Codecs</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Shrink image, audio, and video files by up to 90% without visible quality degradation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={showSettings ? 'secondary' : 'default'}
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="shadow-lg shadow-violet-600/20"
          >
            <Sliders className="w-4 h-4 mr-1.5" />
            {showSettings ? 'Hide Settings' : 'New Compression'}
          </Button>
          <button
            type="button"
            onClick={() => refetchJobs()}
            className="p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh jobs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900/70 to-slate-950/80 p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Jobs Run</span>
            <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {stats.totalJobs}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900/70 to-slate-950/80 p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Storage Saved</span>
            <span className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
              {formatBytes(stats.storageSaved)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900/70 to-slate-950/80 p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Completed Successfully</span>
            <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {stats.completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Settings Panel */}
      {showSettings && (
        <div className="animate-fadeIn">
          <CompressionSettings
            files={files}
            onSubmit={handleCreateJob}
            loading={createJobMutation.isPending}
          />
        </div>
      )}

      {/* Jobs Queue Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Compression Activity ({jobs.length})
          </h2>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 p-5 rounded-2xl border border-white/5 bg-slate-900/30">
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-4 w-1/4 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job: any) => (
              <CompressJobCard
                key={job.id}
                job={job}
                onCancel={handleCancelJob}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-4">
              <Zap className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">No compression jobs yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Select a file above and hit "Start Compression" to optimize your images, audio, and videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
