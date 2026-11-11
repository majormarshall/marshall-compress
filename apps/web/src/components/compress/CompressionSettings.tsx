'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  Scale,
  ShieldCheck,
  FileType,
  FileCheck,
  Play,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompressionPreset, type CompressionSettings as SettingsType, type FileItem } from '@marshall/shared';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/components/cloud/FileCard';

export interface CompressionSettingsProps {
  onSubmit: (settings: SettingsType, fileId: string) => void;
  files?: FileItem[];
  selectedFileId?: string;
  onSelectFile?: (fileId: string) => void;
  loading?: boolean;
  className?: string;
}

export function CompressionSettings({
  onSubmit,
  files = [],
  selectedFileId: initialSelectedFileId,
  onSelectFile,
  loading = false,
  className,
}: CompressionSettingsProps) {
  const [selectedFileId, setSelectedFileId] = useState<string>(
    initialSelectedFileId || (files.length > 0 ? files[0].id : '')
  );
  const [preset, setPreset] = useState<CompressionPreset>(CompressionPreset.BALANCED);
  const [quality, setQuality] = useState<number>(80);
  const [outputFormat, setOutputFormat] = useState<string>('auto');
  const [lossless, setLossless] = useState<boolean>(false);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handlePresetSelect = (newPreset: CompressionPreset) => {
    setPreset(newPreset);
    if (newPreset === CompressionPreset.FAST) {
      setQuality(65);
    } else if (newPreset === CompressionPreset.BALANCED) {
      setQuality(80);
    } else if (newPreset === CompressionPreset.MAXIMUM) {
      setQuality(92);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileId) return;

    onSubmit(
      {
        preset,
        quality,
        lossless,
        outputFormat: outputFormat === 'auto' ? undefined : outputFormat,
      },
      selectedFileId
    );
  };

  const presetOptions = [
    {
      key: CompressionPreset.FAST,
      label: 'Economy',
      icon: Zap,
      desc: 'Highest compression, ultra-small size',
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    },
    {
      key: CompressionPreset.BALANCED,
      label: 'Balanced',
      icon: Scale,
      desc: 'Optimal visual quality & file size',
      color: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    },
    {
      key: CompressionPreset.MAXIMUM,
      label: 'Maximum Quality',
      icon: ShieldCheck,
      desc: 'Virtually lossless, pristine fidelity',
      color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl',
        className
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Compression Pipeline</h3>
            <p className="text-xs text-slate-400">Configure multi-pass codec and optimization parameters</p>
          </div>
        </div>
        <Badge variant="violet" className="font-mono text-[11px]">
          Avif / WebP / H.265
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Select Source File
          </label>
          {files.length > 0 ? (
            <select
              value={selectedFileId}
              onChange={(e) => {
                setSelectedFileId(e.target.value);
                onSelectFile?.(e.target.value);
              }}
              className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {files.map((file) => (
                <option key={file.id} value={file.id} className="bg-slate-900 text-slate-100">
                  {file.name} ({formatBytes(file.size_bytes)})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-white/15 bg-slate-950/40 text-xs text-slate-400">
              <span>No files uploaded in cloud storage yet</span>
              <Badge variant="outline">Upload First</Badge>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Input: <strong className="text-slate-200">{formatBytes(selectedFile.size_bytes)}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="font-mono">{selectedFile.mime_type}</span>
            </div>
          )}
        </div>

        {/* Output Format Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Output Format
          </label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="auto" className="bg-slate-900 text-slate-100">Auto (Smart Codec Selection)</option>
            <option value="webp" className="bg-slate-900 text-slate-100">WebP (Images - High Compatibility)</option>
            <option value="avif" className="bg-slate-900 text-slate-100">AVIF (Images - Ultra Efficiency)</option>
            <option value="mp4" className="bg-slate-900 text-slate-100">MP4 / H.264 (Video)</option>
            <option value="mp3" className="bg-slate-900 text-slate-100">MP3 / AAC (Audio)</option>
          </select>
          <span className="text-[11px] text-slate-500">
            Auto matches best next-gen codec for your file type.
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Compression Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {presetOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = preset === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handlePresetSelect(opt.key)}
                className={cn(
                  'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200 select-none',
                  isSelected
                    ? `${opt.color} ring-2 ring-blue-500/40 shadow-lg scale-[1.01]`
                    : 'border-white/5 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold text-sm text-slate-200">{opt.label}</span>
                </div>
                <span className="text-[11px] text-slate-400 leading-tight">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Slider */}
      <div className="flex flex-col gap-2 rounded-xl bg-slate-950/50 p-4 border border-white/5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Target Quality Level
          </label>
          <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
            {quality}%
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="1"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
          <span>Max Compression (10%)</span>
          <span>Balanced (70-80%)</span>
          <span>Lossless/Pristine (100%)</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          disabled={!selectedFileId || loading}
          loading={loading}
          className="w-full sm:w-auto min-w-[200px]"
        >
          <Play className="w-4 h-4 mr-1.5 fill-current" />
          Start Compression
        </Button>
      </div>
    </form>
  );
}
