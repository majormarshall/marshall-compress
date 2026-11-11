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
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/stores/ui.store';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Cloud Storage', href: '/dashboard/cloud', icon: Cloud },
  { label: 'Compress', href: '/dashboard/compress', icon: Zap },
  { label: 'Notes', href: '/dashboard/notes', icon: FileText },
  { label: 'Meetings', href: '/dashboard/meetings', icon: Video },
  { label: 'AI Assistant', href: '/dashboard/ai', icon: Bot, badge: 'Pro' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
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
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'glass flex flex-col justify-between border-r border-white/10 select-none hidden md:flex',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-white/5">
          <Link
            href="/dashboard/overview"
            className={cn(
              'flex items-center gap-3 overflow-hidden transition-all',
              sidebarCollapsed ? 'justify-center w-full' : ''
            )}
            title="MARSHALL"
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-lg font-extrabold tracking-tight text-gradient-marshall">
                  MARSHALL
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                  Enterprise
                </span>
              </div>
            )}
          </Link>

          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/dashboard/overview' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5',
                  sidebarCollapsed ? 'justify-center px-0' : ''
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />

                {!sidebarCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!sidebarCollapsed && item.badge && (
                  <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}

                {/* Subtle indicator bar for active collapsed item */}
                {isActive && sidebarCollapsed && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-500 shadow-glow-blue" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Settings, User Profile, Sign Out, and Expand Button when collapsed */}
      <div className="p-2 border-t border-white/5 space-y-1">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors mb-1"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors',
            sidebarCollapsed ? 'justify-center px-0' : ''
          )}
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 truncate">Settings</span>}
        </Link>

        {/* User profile row */}
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5 mt-2',
            sidebarCollapsed ? 'justify-center px-0' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar size="sm" className="ring-1 ring-white/10 shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>

            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-slate-400 truncate leading-tight">
                  {user?.email || 'authenticated'}
                </span>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
