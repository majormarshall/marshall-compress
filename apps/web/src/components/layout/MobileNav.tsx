'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cloud,
  Zap,
  FileText,
  Video,
  Bot,
  X,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/stores/ui.store';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Cloud', href: '/dashboard/cloud', icon: Cloud },
  { label: 'Compress', href: '/dashboard/compress', icon: Zap },
  { label: 'Notes', href: '/dashboard/notes', icon: FileText },
  { label: 'Meetings', href: '/dashboard/meetings', icon: Video },
  { label: 'AI', href: '/dashboard/ai', icon: Bot },
];

export function MobileNav() {
  const pathname = usePathname();
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const { user, signOut } = useAuth();

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'User';

  const userInitials = userDisplayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Fixed bottom, visible < md) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 glass border-t border-white/10 px-2 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/dashboard/overview' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[48px]',
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              )}
              title={item.label}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-all',
                  isActive ? 'bg-blue-600/20 text-blue-400' : ''
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[54px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Drawer Overlay & Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative z-10 w-4/5 max-w-xs h-full glass border-r border-white/10 p-5 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xl font-extrabold text-gradient-marshall">
                    MARSHALL
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <div className="space-y-1 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard/overview' && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar size="sm">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {userDisplayName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
