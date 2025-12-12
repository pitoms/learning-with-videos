/**
 * Video URL parsing and conversion utilities
 * Supports: YouTube and direct video URLs
 */

export type VideoSource =
  | { type: "youtube"; videoId: string; embedUrl: string; originalUrl: string }
  | { type: "direct"; url: string; originalUrl: string }
  | { type: "invalid"; originalUrl: string; error: string };

/**
 * Extracts YouTube video ID from various URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Checks if URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/**
 * Parse a video URL and return normalized video source info
 */
export function parseVideoUrl(url: string): VideoSource {
  if (!url || !url.trim()) {
    return { type: "invalid", originalUrl: url, error: "URL is required" };
  }

  const trimmedUrl = url.trim();

  // Check YouTube
  if (isYouTubeUrl(trimmedUrl)) {
    const videoId = getYouTubeVideoId(trimmedUrl);
    if (videoId) {
      return {
        type: "youtube",
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: trimmedUrl,
      };
    }
    return {
      type: "invalid",
      originalUrl: trimmedUrl,
      error: "Could not extract YouTube video ID",
    };
  }

  // Validate as direct URL
  try {
    new URL(trimmedUrl);
    return {
      type: "direct",
      url: trimmedUrl,
      originalUrl: trimmedUrl,
    };
  } catch {
    return {
      type: "invalid",
      originalUrl: trimmedUrl,
      error: "Please enter a valid URL",
    };
  }
}

/**
 * Get a playable/embeddable URL from any supported video source
 */
export function getPlayableUrl(url: string): string | null {
  const source = parseVideoUrl(url);

  switch (source.type) {
    case "youtube":
      return source.embedUrl;
    case "direct":
      return source.url;
    case "invalid":
      return null;
  }
}

/**
 * Get video source type label for display
 */
export function getVideoSourceLabel(url: string): string {
  const source = parseVideoUrl(url);

  switch (source.type) {
    case "youtube":
      return "YouTube";
    case "direct":
      return "Direct Link";
    case "invalid":
      return "Invalid";
  }
}

/**
 * Check if a video URL is valid (can be played)
 */
export function isValidVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  const source = parseVideoUrl(url);
  return source.type !== "invalid";
}
