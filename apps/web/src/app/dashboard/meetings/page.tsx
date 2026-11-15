'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeetings, useCreateMeeting } from '@/lib/hooks/useMeetings';
import type { Meeting } from '@marshall/shared';
import { formatDate } from '@/components/cloud/FileCard';
import { toast } from 'sonner';

export default function MeetingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: meetingsData, isLoading, refetch } = useMeetings({
    search: searchQuery || undefined,
  });
  const createMeetingMutation = useCreateMeeting();

  const meetings: Meeting[] = (meetingsData as any)?.meetings || [];

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await createMeetingMutation.mutateAsync({
        title: newTitle.trim(),
        scheduledAt: new Date().toISOString(),
        provider: 'GOOGLE_MEET' as any,
      });
      toast.success('Meeting registered for transcription');
      setNewTitle('');
      setIsCreating(false);
      refetch();
    } catch {
      toast.error('Failed to create meeting');
    }
  };

  const getPlatformBadge = (provider?: string) => {
    switch (provider?.toUpperCase()) {
      case 'ZOOM':
        return <Badge variant="cyan">Zoom</Badge>;
      case 'GOOGLE_MEET':
      case 'MEET':
        return <Badge variant="success">Google Meet</Badge>;
      case 'TEAMS':
      case 'MS_TEAMS':
        return <Badge variant="violet">Teams</Badge>;
      default:
        return <Badge variant="secondary">Audio Record</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Video className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Meeting Intelligence</h1>
            <Badge variant="success" className="ml-2">Live AI Summaries</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Autonomous speaker transcription, automated takeaways, and actionable task delegation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="default"
            onClick={() => setIsCreating(!isCreating)}
            className="shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Meeting
          </Button>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateMeeting}
          className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md animate-fadeIn"
        >
          <Video className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            placeholder="Meeting title (e.g. Q4 Roadmap Sync)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-slate-950/60 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
          <Button type="submit" size="sm" loading={createMeetingMutation.isPending}>
            Add Meeting
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreating(false);
              setNewTitle('');
            }}
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Recorded Meetings</span>
            <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {meetings.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">AI Summaries Generated</span>
            <span className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
              {meetings.filter((m) => m.notes?.summary).length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Pending Action Items</span>
            <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
              {meetings.reduce((acc, m) => acc + (m.notes?.actionItems?.length || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search meetings by title or discussion..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-900/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      {/* Meetings List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 p-5 rounded-2xl border border-white/5 bg-slate-900/30">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-4 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => {
            const summaryPreview =
              meeting.notes?.summary || meeting.description || 'No summary generated yet. Click to view transcript.';
            const actionItemsCount = meeting.notes?.actionItems?.length || 0;

            return (
              <Link
                key={meeting.id}
                href={`/dashboard/meetings/${meeting.id}`}
                className="group relative flex flex-col justify-between p-5 rounded-2xl border border-white/8 bg-gradient-to-b from-slate-900/70 to-slate-950/80 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 backdrop-blur-xl hover:-translate-y-1"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-100 text-base truncate group-hover:text-emerald-400 transition-colors">
                      {meeting.title}
                    </h3>
                    <div className="shrink-0">{getPlatformBadge(meeting.provider)}</div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {summaryPreview}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(meeting.scheduledStartTime || meeting.createdAt)}</span>
                  </span>

                  {actionItemsCount > 0 ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionItemsCount} tasks</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-300">
                      <span>View details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 mb-4">
            <Video className="h-8 w-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">No meetings recorded</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Connect your Zoom, Google Meet, or upload audio recordings to automatically transcribe and extract action items.
          </p>
        </div>
      )}
    </div>
  );
}
