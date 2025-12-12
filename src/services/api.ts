/**
 * API service layer for interacting with the video learning platform backend
 */

import type {
  Video,
  CreateVideoPayload,
  Comment,
  CreateCommentPayload,
  VideosResponse,
  CommentsResponse,
} from "../types";

const API_BASE_URL = "/api";

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============ VIDEO ENDPOINTS ============

/**
 * Fetch all videos for a specific user
 */
export async function getVideos(userId: string): Promise<Video[]> {
  const data = await apiRequest<VideosResponse>(
    `/videos?user_id=${encodeURIComponent(userId)}`
  );
  return data.videos || [];
}

/** API response wrapper for single video */
interface VideoResponse {
  video: Video;
}

/**
 * Fetch a single video by ID
 */
export async function getVideo(videoId: string): Promise<Video> {
  const data = await apiRequest<VideoResponse>(
    `/videos/single?video_id=${encodeURIComponent(videoId)}`
  );
  return data.video;
}

/**
 * Create a new video
 */
export async function createVideo(payload: CreateVideoPayload): Promise<Video> {
  return apiRequest<Video>("/videos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============ COMMENT ENDPOINTS ============

/**
 * Fetch all comments for a specific video
 */
export async function getComments(videoId: string): Promise<Comment[]> {
  const data = await apiRequest<CommentsResponse>(
    `/videos/comments?video_id=${encodeURIComponent(videoId)}`
  );
  return data.comments || [];
}

/**
 * Create a new comment on a video
 */
export async function createComment(
  payload: CreateCommentPayload
): Promise<Comment> {
  return apiRequest<Comment>("/videos/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
