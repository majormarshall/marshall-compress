'use client';

import React, { useState, useCallback } from 'react';
import {
  HardDrive, FolderPlus, Upload, RefreshCw, Grid3X3,
  List, Search, ChevronRight, Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadDropzone } from '@/components/cloud/UploadDropzone';
import { FileGrid } from '@/components/cloud/FileGrid';
import { FolderBreadcrumb } from '@/components/cloud/FolderBreadcrumb';
import { useFiles } from '@/lib/hooks/useFiles';
import { useFolders, useCreateFolder } from '@/lib/hooks/useFolders';
import { toast } from 'sonner';

export default function CloudPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);

  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useFiles({
    folderId: currentFolderId,
    search: search || undefined,
  });
  const { data: folders, refetch: refetchFolders } = useFolders(currentFolderId);
  const createFolderMutation = useCreateFolder();

  const files = filesData?.files || [];
  const total = filesData?.total || 0;

  const handleFolderOpen = (folderId: string, folderName: string) => {
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  const handleBreadcrumbNav = (folderId: string | null) => {
    if (folderId === null) {
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const idx = folderPath.findIndex(f => f.id === folderId);
      setFolderPath(prev => prev.slice(0, idx + 1));
      setCurrentFolderId(folderId);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('New folder name:');
    if (!name?.trim()) return;
    try {
      await createFolderMutation.mutateAsync({ name: name.trim(), parentId: currentFolderId });
      toast.success(`Folder "${name}" created`);
      refetchFolders();
    } catch {
      toast.error('Failed to create folder');
    }
  };

  const handleUploadComplete = useCallback(() => {
    setShowUpload(false);
    refetchFiles();
    toast.success('File uploaded successfully');
  }, [refetchFiles]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <HardDrive className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Cloud Storage</h1>
            <Badge variant="outline" className="ml-2 font-mono text-xs">{total} files</Badge>
          </div>
          <p className="text-sm text-slate-400">Cloudflare R2 object storage with pre-signed secure access.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { refetchFiles(); refetchFolders(); }}
            className="p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button variant="outline" size="sm" onClick={handleCreateFolder}>
            <FolderPlus className="w-4 h-4 mr-1.5 text-amber-400" /> New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)} className="shadow-lg shadow-blue-600/20">
            <Upload className="w-4 h-4 mr-1.5" /> Upload
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      {showUpload && (
        <div className="animate-fadeIn">
          <UploadDropzone folderId={currentFolderId} onComplete={handleUploadComplete} />
        </div>
      )}

      {/* Toolbar: Breadcrumb + Search + View toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <FolderBreadcrumb path={folderPath} onNavigate={handleBreadcrumbNav} />

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 w-48"
            />
          </div>
          <div className="flex border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* File Grid */}
      {filesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <FileGrid
          files={files}
          folders={folders || []}
          viewMode={viewMode}
          onFolderOpen={handleFolderOpen}
          onRefresh={() => { refetchFiles(); refetchFolders(); }}
        />
      )}
    </div>
  );
}
