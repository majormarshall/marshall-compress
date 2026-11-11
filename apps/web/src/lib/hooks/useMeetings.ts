'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, type ListMeetingsParams, type CreateMeetingDto } from '../api/endpoints';
import type { Meeting } from '@marshall/shared';

export const MEETINGS_QUERY_KEY = ['meetings'];

export function useMeetings(params?: ListMeetingsParams) {
  return useQuery({
    queryKey: [...MEETINGS_QUERY_KEY, params],
    queryFn: () => meetingsApi.listMeetings(params),
    staleTime: 1000 * 30,
  });
}

export function useMeeting(meetingId: string | null | undefined) {
  return useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => (meetingId ? meetingsApi.getMeeting(meetingId) : null),
    enabled: Boolean(meetingId),
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMeetingDto) => meetingsApi.createMeeting(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => meetingsApi.deleteMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      meetingId,
      actionItemId,
      status,
    }: {
      meetingId: string;
      actionItemId: string;
      status: string;
    }) => meetingsApi.updateActionItem(meetingId, actionItemId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
    },
  });
}
