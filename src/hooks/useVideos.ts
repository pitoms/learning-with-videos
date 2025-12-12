import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../services/api";

export function useVideos(userId: string) {
  return useQuery({
    queryKey: ["videos", userId],
    queryFn: () => api.getVideos(userId),
    enabled: !!userId,
  });
}

export function useVideo(videoId: string) {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: () => api.getVideo(videoId),
    enabled: !!videoId,
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createVideo,
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: ["videos", user_id] });
    },
  });
}
