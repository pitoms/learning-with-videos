import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "video_progress";
const COMPLETION_THRESHOLD = 0.9; // 90% watched = completed

export interface VideoProgress {
  currentTime: number;
  duration: number;
  lastWatched: number;
  completed: boolean;
}

type ProgressMap = Record<string, VideoProgress>;

function getStoredProgress(): ProgressMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredProgress(progress: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable
  }
}

export function useVideoProgress(videoId: string | undefined) {
  const [progress, setProgress] = useState<VideoProgress | null>(null);

  // Load progress on mount
  useEffect(() => {
    if (!videoId) return;
    const stored = getStoredProgress();
    setProgress(stored[videoId] || null);
  }, [videoId]);

  const saveProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!videoId || duration <= 0) return;

      const watchedRatio = currentTime / duration;
      const completed = watchedRatio >= COMPLETION_THRESHOLD;

      const newProgress: VideoProgress = {
        currentTime,
        duration,
        lastWatched: Date.now(),
        completed,
      };

      setProgress(newProgress);

      const stored = getStoredProgress();
      stored[videoId] = newProgress;
      saveStoredProgress(stored);
    },
    [videoId]
  );

  const getResumeTime = useCallback((): number => {
    if (!progress) return 0;
    // Don't resume if completed or near end
    if (progress.completed) return 0;
    // Small buffer to avoid resuming at very end
    if (progress.duration - progress.currentTime < 5) return 0;
    return progress.currentTime;
  }, [progress]);

  return {
    progress,
    saveProgress,
    getResumeTime,
    isCompleted: progress?.completed ?? false,
    watchedPercent: progress
      ? Math.min(100, (progress.currentTime / progress.duration) * 100)
      : 0,
  };
}

// Hook to get progress for all videos (for VideoCard display)
export function useAllVideoProgress() {
  const [progressMap, setProgressMap] = useState<ProgressMap>({});

  useEffect(() => {
    setProgressMap(getStoredProgress());

    // Listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setProgressMap(getStoredProgress());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const getProgress = useCallback(
    (videoId: string): VideoProgress | null => {
      return progressMap[videoId] || null;
    },
    [progressMap]
  );

  return { progressMap, getProgress };
}
