'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Cloud,
  Zap,
  FileText,
  Video,
  Bot,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const features = [
  { icon: Cloud, label: 'Unlimited Cloud Storage', desc: 'Multi-tier storage with instant access' },
  { icon: Zap, label: 'Ultra-Fast Compression', desc: 'Compress images, video & audio in seconds' },
  { icon: Video, label: 'Meeting Intelligence', desc: 'AI transcription and action item extraction' },
  { icon: FileText, label: 'Smart Notes', desc: 'Rich-text notes with AI-powered organization' },
  { icon: Bot, label: 'AI Assistant', desc: 'GPT-4o, Gemini, and Claude in one interface' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[#070a13]">
      {/* ─── Left brand panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Animated mesh background */}
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-marshall tracking-wider">MARSHALL</span>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Your AI-Powered
              <br />
              <span className="text-gradient-marshall">Productivity Hub</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Everything you need to work smarter — cloud storage, compression, meetings, notes, and AI in one platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{label}</div>
                  <div className="text-slate-500 text-xs">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-slate-600 text-xs">© 2026 MARSHALL — Enterprise AI Productivity Platform</p>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient-marshall tracking-wider">MARSHALL</span>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
