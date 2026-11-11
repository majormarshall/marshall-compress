'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useUiStore } from '@/lib/stores/ui.store';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const routeTitleMap: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard/overview': { title: 'Overview', subtitle: 'Platform metrics and quick actions' },
  '/dashboard/cloud': { title: 'Cloud Storage', subtitle: 'Manage your files and secure folders' },
  '/dashboard/compress': { title: 'Media Compression', subtitle: 'Optimize images, videos, and audio' },
  '/dashboard/notes': { title: 'Notes', subtitle: 'Rich-text collaborative documents' },
  '/dashboard/meetings': { title: 'Meetings', subtitle: 'Automated transcripts and action items' },
  '/dashboard/ai': { title: 'AI Assistant', subtitle: 'Multi-model autonomous workflows' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Profile, security, and team preferences' },
};

export function Header() {
  const pathname = usePathname();
  const { toggleMobileMenu } = useUiStore();
  const { user, signOut } = useAuth();

  const currentRouteInfo = routeTitleMap[pathname] || {
    title: 'Workspace',
    subtitle: 'Unified enterprise console',
  };

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
    <header className="sticky top-0 z-30 h-16 w-full glass border-b border-white/10 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-none">
            {currentRouteInfo.title}
          </h1>
          {currentRouteInfo.subtitle && (
            <p className="hidden sm:block text-xs text-slate-400 mt-0.5 leading-none">
              {currentRouteInfo.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right section: Search bar + Notifications + User Avatar Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Input (Decorative & Responsive) */}
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search files, notes, jobs... (⌘K)"
            className="h-9 w-48 lg:w-64 rounded-xl bg-slate-900/60 border border-white/10 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            readOnly
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#080c16]" />
          </button>
        </div>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-500/40 transition-all outline-none"
              aria-label="Open user menu"
            >
              <Avatar size="sm" className="ring-1 ring-white/15">
                <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-slate-200 leading-none">
                  {userDisplayName}
                </p>
                <p className="text-xs text-slate-400 leading-none truncate">
                  {user?.email || 'user@marshall.io'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
                <User className="h-4 w-4 text-slate-400" />
                <span>Profile & Account</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Preferences</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/dashboard/ai" className="flex items-center gap-2 w-full">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>AI Subscriptions</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              danger
              onClick={() => signOut()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
