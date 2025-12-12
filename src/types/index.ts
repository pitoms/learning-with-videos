/**
 * Core type definitions for the video learning platform
 */

/** Video object returned from the API */
export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  created_at?: string;
}

/** Payload for creating a new video */
export interface CreateVideoPayload {
  user_id: string;
  title: string;
  description: string;
  video_url: string;
}

/** Comment object returned from the API */
export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at?: string;
}

/** Payload for creating a new comment */
export interface CreateCommentPayload {
  video_id: string;
  user_id: string;
  content: string;
}

/** API response wrapper for videos list */
export interface VideosResponse {
  videos: Video[];
}

/** API response wrapper for comments list */
export interface CommentsResponse {
  comments: Comment[];
}

/** Video note with timestamp for noted zones */
export interface VideoNote {
  id: string;
  videoId: string;
  content: string;
  timestamp: number;
  estimatedDuration: number;
  createdAt: string;
}
