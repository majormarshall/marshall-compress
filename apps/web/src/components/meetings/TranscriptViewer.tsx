'use client';

import React, { useState, useMemo } from 'react';
import { Search, User, Clock, Filter, MessageSquare } from 'lucide-react';
import type { TranscriptSegment } from '@marshall/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ParsedTranscriptItem {
  id?: string;
  speaker: string;
  text: string;
  timestamp?: string;
  startMs?: number;
}

export interface TranscriptViewerProps {
  transcript: string | TranscriptSegment[];
  speakers?: string[];
  className?: string;
}

const SPEAKER_COLORS = [
  { bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300', icon: 'text-blue-400' },
  { bg: 'bg-violet-500/15 border-violet-500/30 text-violet-300', icon: 'text-violet-400' },
  { bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', icon: 'text-emerald-400' },
  { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300', icon: 'text-amber-400' },
  { bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300', icon: 'text-rose-400' },
  { bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300', icon: 'text-cyan-400' },
];

function formatMs(ms?: number): string {
  if (ms === undefined || ms === null) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function TranscriptViewer({ transcript, speakers: customSpeakers, className }: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);

  // Normalize transcript into structured ParsedTranscriptItem array
  const parsedItems: ParsedTranscriptItem[] = useMemo(() => {
    if (Array.isArray(transcript)) {
      return transcript.map((seg, idx) => ({
        id: seg.id || `seg-${idx}`,
        speaker: seg.speaker || 'Speaker',
        text: seg.text || '',
        startMs: seg.startMs,
        timestamp: formatMs(seg.startMs),
      }));
    }

    if (typeof transcript === 'string') {
      const lines = transcript.split('\n').filter((l) => l.trim().length > 0);
      const items: ParsedTranscriptItem[] = [];

      lines.forEach((line, idx) => {
        // Match 'Speaker Name (00:15): text' or 'Speaker Name: text'
        const match = line.match(/^([^:(]+)(?:\s*\(([^)]+)\))?\s*:\s*(.+)$/);
        if (match) {
          items.push({
            id: `line-${idx}`,
            speaker: match[1]?.trim() || 'Speaker',
            timestamp: match[2]?.trim(),
            text: match[3]?.trim() || '',
          });
        } else {
          items.push({
            id: `line-${idx}`,
            speaker: 'Speaker',
            text: line.trim(),
          });
        }
      });

      return items;
    }

    return [];
  }, [transcript]);

  // Extract unique speaker names
  const speakers = useMemo(() => {
    if (customSpeakers && customSpeakers.length > 0) return customSpeakers;
    const names = new Set<string>();
    parsedItems.forEach((item) => names.add(item.speaker));
    return Array.from(names);
  }, [customSpeakers, parsedItems]);

  // Assign consistent color index per speaker
  const getSpeakerStyle = (speakerName: string) => {
    const idx = Math.abs(
      speakerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % SPEAKER_COLORS.length
    );
    return SPEAKER_COLORS[idx] ?? SPEAKER_COLORS[0]!;
  };

  // Filter items by search query and speaker filter
  const filteredItems = parsedItems.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpeaker = selectedSpeaker ? item.speaker === selectedSpeaker : true;
    return matchesSearch && matchesSpeaker;
  });

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search and Speaker Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/8 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter by speaker */}
        {speakers.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSpeaker(null)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                selectedSpeaker === null
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              All Speakers ({speakers.length})
            </button>
            {speakers.map((spk) => {
              const isSelected = selectedSpeaker === spk;
              return (
                <button
                  key={spk}
                  type="button"
                  onClick={() => setSelectedSpeaker(spk)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                    isSelected
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  {spk}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Transcript Bubbles */}
      <div className="flex flex-col gap-3.5 max-h-[600px] overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-slate-500 rounded-xl border border-white/5 bg-slate-900/20">
            <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-medium text-slate-400">No matching transcript segments found</p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const style = getSpeakerStyle(item.speaker);
            return (
              <div
                key={item.id || idx}
                className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/70 transition-colors backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                        style.bg
                      )}
                    >
                      <User className={cn('w-3 h-3', style.icon)} />
                      <span>{item.speaker}</span>
                    </span>
                  </div>

                  {item.timestamp && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-200 leading-relaxed pl-1 pt-1">
                  {item.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
