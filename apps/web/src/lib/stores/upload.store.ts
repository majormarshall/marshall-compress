import { create } from 'zustand';

export interface QueuedUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  fileId?: string;
  storageKey?: string;
}

interface UploadStoreState {
  queue: QueuedUpload[];
  addFiles: (files: File[]) => void;
  updateProgress: (id: string, progress: number) => void;
  setStatus: (id: string, status: QueuedUpload['status'], error?: string, fileId?: string) => void;
  removeFile: (id: string) => void;
  clearCompleted: () => void;
  resetQueue: () => void;
}

export const useUploadStore = create<UploadStoreState>((set) => ({
  queue: [],
  addFiles: (files: File[]) => {
    const newItems: QueuedUpload[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      progress: 0,
      status: 'pending',
    }));
    set((state) => ({ queue: [...state.queue, ...newItems] }));
  },
  updateProgress: (id: string, progress: number) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, progress: Math.min(100, Math.max(0, progress)) } : item
      ),
    }));
  },
  setStatus: (id: string, status: QueuedUpload['status'], error?: string, fileId?: string) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status, error, fileId: fileId || item.fileId } : item
      ),
    }));
  },
  removeFile: (id: string) => {
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    }));
  },
  clearCompleted: () => {
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'completed'),
    }));
  },
  resetQueue: () => set({ queue: [] }),
}));
