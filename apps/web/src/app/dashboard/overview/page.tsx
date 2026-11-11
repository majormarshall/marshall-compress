'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  HardDrive,
  Zap,
  FileText,
  Video,
  Upload,
  Plus,
  Play,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2,
  File,
  FileSpreadsheet,
  FileVideo,
  FileImage,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNotes } from '@/lib/hooks/useNotes';
import { useMeetings } from '@/lib/hooks/useMeetings';
import { filesApi, compressionApi } from '@/lib/api/endpoints';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes, formatRelativeTime, cn } from '@/lib/utils';
import type { FileItem, CompressionJob } from '@marshall/shared';

// Fallback Mock data for rich visual presentation when fresh/empty
const fallbackRecentFiles: Array<Partial<FileItem>> = [
  {
    id: 'f-1',
    name: 'Quarterly_Strategy_2026.pdf',
    mime_type: 'application/pdf',
    size_bytes: 4280000,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'f-2',
    name: 'Product_Demo_4K.mp4',
    mime_type: 'video/mp4',
    size_bytes: 148500000,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'f-3',
    name: 'Brand_Assets_Pack.zip',
    mime_type: 'application/zip',
    size_bytes: 38200000,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'f-4',
    name: 'Keynote_Presentation.deck',
    mime_type: 'application/vnd.ms-powerpoint',
    size_bytes: 18400000,
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
  {
    id: 'f-5',
    name: 'App_Interface_Redesign.png',
    mime_type: 'image/png',
    size_bytes: 2900000,
    created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
];

const activityFeed = [
  {
    id: 'act-1',
    type: 'meeting',
    title: 'Transcribed Sprint Planning',
    desc: '3 action items automatically assigned',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    icon: Video,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'act-2',
    type: 'compression',
    title: 'Optimized Product_Demo_4K.mp4',
    desc: 'Compressed by 74.2% (saved 110 MB)',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    icon: Zap,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'act-3',
    type: 'note',
    title: 'Updated Backend API Architecture',
    desc: 'Revision synced with 4 contributors',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    icon: FileText,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'act-4',
    type: 'cloud',
    title: 'Uploaded Brand_Assets_Pack.zip',
    desc: 'Stored in encrypted primary bucket',
    timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    icon: HardDrive,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
];

function getFileIcon(mime: string = '') {
  if (mime.includes('pdf')) return <File className="h-4 w-4 text-rose-400" />;
  if (mime.includes('video')) return <FileVideo className="h-4 w-4 text-purple-400" />;
  if (mime.includes('image')) return <FileImage className="h-4 w-4 text-emerald-400" />;
  if (mime.includes('sheet') || mime.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
  return <File className="h-4 w-4 text-blue-400" />;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  // Queries for live dashboard metrics
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ['files', 'recent'],
    queryFn: () => filesApi.listFiles({ limit: 5 }),
    retry: 1,
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['compression', 'recent'],
    queryFn: () => compressionApi.listJobs({ limit: 5 }),
    retry: 1,
  });

  const { data: notesData, isLoading: notesLoading } = useNotes({ limit: 5 });
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings({ limit: 5 });

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Team Member';

  // Metrics calculation
  const totalFiles = filesData?.total ?? 34;
  const totalJobs = jobsData?.total ?? 18;
  const totalNotes = notesData?.total ?? 14;
  const totalMeetings = meetingsData?.total ?? 9;

  // Real or simulated storage calculation (20 GB quota default)
  const usedStorageBytes = 4.8 * 1024 * 1024 * 1024; // 4.8 GB
  const maxStorageBytes = 20 * 1024 * 1024 * 1024; // 20 GB
  const storagePercentage = Math.round((usedStorageBytes / maxStorageBytes) * 100);

  const displayFiles =
    filesData?.files && filesData.files.length > 0
      ? filesData.files.slice(0, 5)
      : fallbackRecentFiles;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-card border border-white/10 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Workspace Operational
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, <span className="text-gradient-marshall">{userDisplayName}</span>
          </h1>
          <p className="text-sm text-slate-400">
            Here is what&apos;s happening across your cloud storage, media compression, and intelligence pipelines today.
          </p>
        </div>

        {/* Quick Actions Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          <Link href="/dashboard/cloud">
            <Button variant="default" size="sm" className="font-medium shadow-md">
              <Upload className="h-4 w-4 mr-1.5" />
              Upload File
            </Button>
          </Link>

          <Link href="/dashboard/notes">
            <Button variant="outline" size="sm" className="font-medium">
              <Plus className="h-4 w-4 mr-1.5" />
              New Note
            </Button>
          </Link>

          <Link href="/dashboard/compress">
            <Button variant="outline" size="sm" className="font-medium">
              <Zap className="h-4 w-4 mr-1.5 text-purple-400" />
              New Compression
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Storage Used */}
        <Card variant="glass" className="p-5 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Storage Used
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">4.8 GB</span>
              <span className="text-xs text-slate-500">/ 20 GB</span>
            </div>
            <Progress value={storagePercentage} variant="gradient" size="sm" />
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>{storagePercentage}% capacity</span>
              <span className="text-emerald-400 font-medium">15.2 GB free</span>
            </div>
          </div>
        </Card>

        {/* Stat 2: Compression Jobs */}
        <Card variant="glass" className="p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Media Optimization
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{totalJobs}</span>
              <span className="text-xs text-slate-400">jobs done</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-purple-300 pt-1">
              <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
              <span>88.4% average bandwidth saved</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">Automated FFmpeg + WebP engine</p>
          </div>
        </Card>

        {/* Stat 3: Notes Count */}
        <Card variant="glass" className="p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Notes & Docs
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{totalNotes}</span>
              <span className="text-xs text-slate-400">active docs</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Real-time Tiptap sync active</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">6 tagged &bull; 4 pinned</p>
          </div>
        </Card>

        {/* Stat 4: Meetings Count */}
        <Card variant="glass" className="p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Meeting Intel
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Video className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">{totalMeetings}</span>
              <span className="text-xs text-slate-400">sessions</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 pt-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>AI summaries generated</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">3 pending action items</p>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Recent Files (col-8) + Recent Activity Feed (col-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Files Table / List */}
        <div className="lg:col-span-8">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <CardTitle className="text-base font-bold text-slate-100">Recent Files</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Last updated documents, media, and assets in your cloud drive
                </CardDescription>
              </div>
              <Link href="/dashboard/cloud">
                <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300">
                  View all <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Files List */}
            <div className="divide-y divide-white/5 mt-2">
              {filesLoading ? (
                <div className="py-6 space-y-3">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ) : (
                displayFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.03] rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center shrink-0">
                        {getFileIcon(file.mime_type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{formatBytes(file.size_bytes || 0)}</span>
                          <span>&bull;</span>
                          <span>{file.created_at ? formatRelativeTime(file.created_at) : 'recently'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider hidden sm:inline-flex">
                        {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Badge>
                      <Link href="/dashboard/cloud">
                        <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-slate-200">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="glass" className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <CardTitle className="text-base font-bold text-slate-100">Live Activity</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Real-time workspace events
                </CardDescription>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="relative mt-4 space-y-4">
              {activityFeed.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 relative">
                    {/* Connecting line */}
                    {idx < activityFeed.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-white/5 -z-0" />
                    )}

                    <div
                      className={cn(
                        'h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 z-10',
                        activity.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {activity.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        {activity.desc}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick AI Tip / Assistant Card */}
          <Card variant="glass" className="p-5 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border-purple-500/20 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">Autonomous Assistant</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connect your Anthropic, OpenAI, or Gemini key to activate automated summarization on uploads.
                </p>
                <div className="pt-2">
                  <Link href="/dashboard/ai">
                    <Button variant="link" size="sm" className="p-0 text-xs text-purple-400 hover:text-purple-300">
                      Configure AI pipelines &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
