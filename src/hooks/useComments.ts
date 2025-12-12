/**
 * Custom hooks for comment-related data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/api";
import type { CreateCommentPayload } from "../types";

/** Query key factory for comments */
export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (videoId: string) => [...commentKeys.lists(), videoId] as const,
};

/**
 * Hook to fetch all comments for a video
 */
export function useComments(videoId: string) {
  return useQuery({
    queryKey: commentKeys.list(videoId),
    queryFn: () => api.getComments(videoId),
    enabled: !!videoId,
  });
}

/**
 * Hook to create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => api.createComment(payload),
    onSuccess: (_, variables) => {
      // Invalidate the video's comment list to refetch
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.video_id),
      });
    },
  });
}
