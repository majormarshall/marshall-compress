'use client';

import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  LayoutGrid,
  List,
  FolderPlus,
  Search,
  Filter,
  RefreshCw,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FolderBreadcrumb } from '@/components/cloud/FolderBreadcrumb';
import { UploadDropzone } from '@/components/cloud/UploadDropzone';
import { FileGrid } from '@/components/cloud/FileGrid';
import { useFiles, useFolders, useDeleteFile, useCreateFolder } from '@/lib/hooks/useFiles';
import type { FileItem, FolderItem } from '@marshall/shared';
import { toast } from 'sonner';

export default function CloudStoragePage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Fetch real queries
  const { data: filesData, isLoading: filesLoading, refetch: refetchFiles } = useFiles({
    folderId: currentFolderId,
    search: searchQuery || undefined,
  });

  const { data: foldersData, isLoading: foldersLoading, refetch: refetchFolders } = useFolders(currentFolderId);
  const deleteFileMutation = useDeleteFile();
  const createFolderMutation = useCreateFolder();

  const files: FileItem[] = filesData?.files || [];
  const folders: FolderItem[] = foldersData || [];

  const handleNavigate = (targetId: string | null) => {
    if (targetId === null) {
      setCurrentFolderId(null);
      setFolderHistory([]);
      return;
    }
    const index = folderHistory.findIndex((f) => f.id === targetId);
    if (index !== -1) {
      setFolderHistory(folderHistory.slice(0, index + 1));
      setCurrentFolderId(targetId);
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    setCurrentFolderId(folder.id);
    setFolderHistory([...folderHistory, { id: folder.id, name: folder.name }]);
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await deleteFileMutation.mutateAsync(file.id);
        toast.success(`Deleted ${file.name}`);
      } catch {
        toast.error('Failed to delete file');
      }
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    if (file.storage_url) {
      window.open(file.storage_url, '_blank');
    } else {
      toast.info(`Preparing download for ${file.name}`);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        parentId: currentFolderId,
      });
      toast.success(`Created folder "${newFolderName}"`);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch {
      toast.error('Failed to create folder');
    }
  };

  const isLoading = filesLoading || foldersLoading;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <HardDrive className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Cloud Storage</h1>
            <Badge variant="cyan" className="ml-2">Secure R2/S3</Badge>
          </div>
          <p className="text-sm text-slate-400">
            Store, preview, organize, and share all your digital assets with enterprise encryption.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="border-white/10"
          >
            <FolderPlus className="w-4 h-4 mr-1.5 text-amber-400" />
            New Folder
          </Button>

          <Button
            variant={showUploadZone ? 'secondary' : 'default'}
            size="sm"
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="shadow-lg shadow-blue-600/20"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            {showUploadZone ? 'Close Upload' : 'Upload Files'}
          </Button>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'grid' ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${
                view === 'list' ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New Folder Modal / Inline Creator */}
      {isCreatingFolder && (
        <form
          onSubmit={handleCreateFolder}
          className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-md animate-fadeIn"
        >
          <FolderPlus className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 bg-slate-950/60 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <Button type="submit" size="sm" loading={createFolderMutation.isPending}>
            Create
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreatingFolder(false);
              setNewFolderName('');
            }}
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Collapsible Dropzone */}
      {showUploadZone && (
        <div className="animate-fadeIn">
          <UploadDropzone
            folderId={currentFolderId}
            onFilesAccepted={() => {
              refetchFiles();
            }}
          />
        </div>
      )}

      {/* Navigation Breadcrumbs + Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FolderBreadcrumb folders={folderHistory} onNavigate={handleNavigate} />

        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl bg-slate-900/60 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              refetchFiles();
              refetchFolders();
            }}
            className="p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Files & Folders Container */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 p-4 rounded-2xl border border-white/5 bg-slate-900/30">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/4 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <FileGrid
          files={files}
          folders={folders}
          view={view}
          onFolderClick={handleFolderClick}
          onFileDelete={handleDeleteFile}
          onFileDownload={handleDownloadFile}
        />
      )}
    </div>
  );
}
