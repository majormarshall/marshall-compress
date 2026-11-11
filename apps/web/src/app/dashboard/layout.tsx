'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useUiStore } from '@/lib/stores/ui.store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { sidebarCollapsed } = useUiStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Loading state with stylized branding loader
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#070a13] flex flex-col items-center justify-center p-4">
        <div className="relative flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-40 blur-md -z-10 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient-marshall">
            MARSHALL
          </span>
          <span className="text-xs text-slate-500 mt-2 font-mono">
            Loading secure workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Container adjusting for sidebar */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'md:pl-[68px]' : 'md:pl-[240px]',
          'pb-20 md:pb-6' // Extra bottom space on mobile for MobileNav
        )}
      >
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation & Drawer */}
      <MobileNav />
    </div>
  );
}
