'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { compressionApi, type ListJobsParams } from '../api/endpoints';
import type { CompressionJob, CompressionSettings } from '@marshall/shared';
import { createClient } from '../supabase/client';

export const COMPRESSION_JOBS_KEY = ['compression', 'jobs'];

export function useCompressionJobs(params?: ListJobsParams) {
  return useQuery({
    queryKey: [...COMPRESSION_JOBS_KEY, params],
    queryFn: () => compressionApi.listJobs(params),
    refetchInterval: (query: { state: { data?: { jobs?: CompressionJob[] } } }) => {
      // Auto-poll if any job is currently active
      const hasActive = query.state.data?.jobs?.some(
        (j: CompressionJob) => j.status === 'PROCESSING' || (j.status as string) === 'QUEUED' || j.status === 'PENDING'
      );
      return hasActive ? 2500 : false;
    },
  });
}

export function useCompressionJob(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ['compression', 'job', jobId],
    queryFn: () => (jobId ? compressionApi.getJob(jobId) : null),
    enabled: Boolean(jobId),
  });
}

export function useCreateCompressionJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, settings }: { fileId: string; settings: CompressionSettings }) =>
      compressionApi.createJob(fileId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPRESSION_JOBS_KEY });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => compressionApi.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPRESSION_JOBS_KEY });
    },
  });
}

export interface SSEJobProgress {
  progress: number;
  status: CompressionJob['status'];
  compressedSizeBytes?: number;
  savingsPercentage?: number;
  error?: string;
}

/**
 * Connects to Server-Sent Events (SSE) endpoint to receive live real-time job compression progress.
 */
export function useJobSSE(jobId?: string | null): SSEJobProgress {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SSEJobProgress>({
    progress: 0,
    status: 'PENDING',
  });

  useEffect(() => {
    if (!jobId) return;

    let eventSource: EventSource | null = null;
    let isCancelled = false;

    const setupSSE = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isCancelled) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = session?.access_token ? `?token=${encodeURIComponent(session.access_token)}` : '';
      const sseUrl = `${baseUrl}/compression/jobs/${jobId}/events${token}`;

      eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setState({
            progress: payload.progress ?? 0,
            status: payload.status ?? 'PROCESSING',
            compressedSizeBytes: payload.compressedSizeBytes,
            savingsPercentage: payload.savingsPercentage,
            error: payload.error,
          });

          if (payload.status === 'COMPLETED' || payload.status === 'FAILED' || payload.status === 'CANCELLED') {
            queryClient.invalidateQueries({ queryKey: COMPRESSION_JOBS_KEY });
            queryClient.invalidateQueries({ queryKey: ['compression', 'job', jobId] });
            eventSource?.close();
          }
        } catch {
          // Non-JSON SSE ping or format
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE is unavailable or closes
        eventSource?.close();
      };
    };

    setupSSE();

    return () => {
      isCancelled = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [jobId, queryClient]);

  return state;
}
