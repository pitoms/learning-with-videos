import { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useVideoPlayer } from "../../contexts/VideoPlayerContext";

interface VideoPlayerSlotProps {
  videoId: string;
  videoSrc: string;
  videoTitle: string;
}

/**
 * A placeholder component that reserves space for the main video player.
 * It reports its position to the VideoPlayerContext so the PersistentVideoPlayer
 * can position itself correctly in main mode.
 */
export function VideoPlayerSlot({
  videoId,
  videoSrc,
  videoTitle,
}: VideoPlayerSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const { state, playVideo, switchToMain, setMainSlotRect } = useVideoPlayer();

  // Update slot rect - synchronous to ensure it's set before mode switch
  const updateRect = useCallback(() => {
    if (slotRef.current) {
      const rect = slotRef.current.getBoundingClientRect();
      // Only update if we have valid dimensions
      if (rect.width > 0 && rect.height > 0) {
        setMainSlotRect(rect);
        return true;
      }
    }
    return false;
  }, [setMainSlotRect]);

  // Use layout effect to set rect synchronously before paint
  useLayoutEffect(() => {
    updateRect();
  }, [updateRect]);

  // Set up listeners for resize/scroll
  useEffect(() => {
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const observer = new ResizeObserver(updateRect);
    if (slotRef.current) {
      observer.observe(slotRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      observer.disconnect();
      setMainSlotRect(null);
    };
  }, [updateRect, setMainSlotRect]);

  // Start/switch to main mode after rect is set
  useEffect(() => {
    if (hasInitialized.current) return;

    function initializePlayer() {
      if (hasInitialized.current) return;
      if (!slotRef.current) return;

      const rect = slotRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Try again next frame
        requestAnimationFrame(initializePlayer);
        return;
      }

      hasInitialized.current = true;

      if (state.videoId === videoId && state.videoSrc === videoSrc) {
        // Same video - switch to main with rect
        switchToMain(rect);
      } else {
        // New video - play with rect
        playVideo(videoId, videoSrc, videoTitle, "main", 0, rect);
      }
    }

    initializePlayer();
  }, [
    videoId,
    videoSrc,
    videoTitle,
    state.videoId,
    state.videoSrc,
    switchToMain,
    playVideo,
  ]);

  return (
    <div
      ref={slotRef}
      className="aspect-video bg-black rounded-xl"
      aria-label="Video player area"
    />
  );
}
