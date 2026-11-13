'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  HardDrive,
  Bell,
  CheckCircle2,
  Key,
  Database,
  Sliders,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  // Profile Form State
  const initialName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    '';
  const [fullName, setFullName] = useState(initialName);
  const [profileSaving, setProfileSaving] = useState(false);

  // Security Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Storage & Compression Preferences State
  const [storageProvider, setStorageProvider] = useState<'r2' | 's3' | 'minio'>('r2');
  const [compressionQuality, setCompressionQuality] = useState<'balanced' | 'max' | 'fast'>('balanced');
  const [preserveOriginal, setPreserveOriginal] = useState(true);
  const [autoCompress, setAutoCompress] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);

  // Notifications State
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSavePreferences = () => {
    setPreferencesSaving(true);
    setTimeout(() => {
      setPreferencesSaving(false);
      toast.success('Preferences saved');
    }, 400);
  };

  const initials = (fullName || user?.email || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Settings</h1>
            <p className="text-sm text-slate-400">
              Manage your personal profile, security credentials, and storage defaults.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <HardDrive className="w-4 h-4" />
            Storage & Compression
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ── */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Update your display name and view your registered email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar size="lg" className="h-16 w-16 ring-2 ring-white/10">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                    <AvatarFallback className="text-lg bg-blue-600/30 text-blue-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {fullName || 'User Profile'}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      Account Active
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">
                      Display Name
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="bg-slate-950/60 border-white/10 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">
                      Email Address
                    </label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-950/40 border-white/5 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1.5">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-slate-950/60 border-white/10 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1.5">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-slate-950/60 border-white/10 text-slate-200"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={passwordSaving || !password}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Security</CardTitle>
              <CardDescription>
                Current authentication credentials and session details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Supabase JWT Session</p>
                    <p className="text-xs text-slate-500">
                      User ID: <span className="font-mono text-slate-400">{user?.id || '—'}</span>
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STORAGE & COMPRESSION TAB ── */}
        <TabsContent value="storage" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Provider</CardTitle>
              <CardDescription>
                Select your preferred S3-compatible backend storage engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'r2', title: 'Cloudflare R2', desc: 'Global edge storage, zero egress fees' },
                  { id: 's3', title: 'Amazon S3', desc: 'AWS S3 standard multi-region bucket' },
                  { id: 'minio', title: 'MinIO Local', desc: 'Local self-hosted dev instance' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStorageProvider(item.id as any)}
                    className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                      storageProvider === item.id
                        ? 'border-blue-500/50 bg-blue-600/10 shadow-md shadow-blue-500/10'
                        : 'border-white/8 bg-slate-950/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-semibold text-slate-200">{item.title}</span>
                      {storageProvider === item.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compression Defaults</CardTitle>
              <CardDescription>
                Configure default optimization algorithms and processing policies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-2">
                  Default Quality Target
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'balanced', title: 'Balanced', desc: 'Optimized quality & file size' },
                    { id: 'max', title: 'Maximum Savings', desc: 'Highest compression ratio' },
                    { id: 'fast', title: 'High Fidelity', desc: 'Minimal loss, fastest speed' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setCompressionQuality(lvl.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        compressionQuality === lvl.id
                          ? 'border-purple-500/50 bg-purple-600/10'
                          : 'border-white/8 bg-slate-950/40 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-semibold text-slate-200 block">
                        {lvl.title}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-slate-300 block">
                      Preserve original file copies
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Keep uncompressed files alongside compressed artifacts.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preserveOriginal}
                    onChange={(e) => setPreserveOriginal(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-slate-300 block">
                      Auto-compress media on upload
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Automatically schedule compression for videos and large images upon upload.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCompress}
                    onChange={(e) => setAutoCompress(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={preferencesSaving}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {preferencesSaving ? 'Saving...' : 'Save Storage Defaults'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ── */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email & In-App Alerts</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive regarding your workspace activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl border border-white/8 bg-slate-950/40 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-slate-200 block">
                    Job completion notifications
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Send a notification when long video compression finishes.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnComplete}
                  onChange={(e) => setNotifyOnComplete(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-white/8 bg-slate-950/40 cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-slate-200 block">
                    Job failure alerts
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Alert immediately if a video or document conversion fails.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnError}
                  onChange={(e) => setNotifyOnError(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => toast.success('Notification preferences updated')}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
