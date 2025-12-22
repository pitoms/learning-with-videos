/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

export type PlayerMode = "main" | "mini" | "hidden";

interface VideoPlayerState {
  videoId: string;
  videoSrc: string;
  videoTitle: string;
  currentTime: number;
  isPlaying: boolean;
  mode: PlayerMode;
  // Rect of the main slot for positioning
  mainSlotRect: DOMRect | null;
}

interface VideoPlayerContextType {
  state: VideoPlayerState;
  // Start playing a video (from VideoPage or elsewhere)
  playVideo: (
    videoId: string,
    videoSrc: string,
    videoTitle: string,
    mode?: PlayerMode,
    startTime?: number,
    rect?: DOMRect
  ) => void;
  // Switch to mini mode (when leaving VideoPage)
  switchToMini: () => void;
  // Switch to main mode (when entering VideoPage for same video)
  switchToMain: (rect?: DOMRect) => void;
  // Close/hide the player completely
  closePlayer: () => void;
  // Update playback state
  updatePlayback: (currentTime: number, isPlaying: boolean) => void;
  // Register the main slot rect (called by VideoPlayerSlot)
  setMainSlotRect: (rect: DOMRect | null) => void;
  // Direct control
  seekTo: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  // Ref to the video element for direct control
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ytPlayerRef: React.RefObject<YTPlayerAPI | null>;
}

// YouTube Player API subset
export interface YTPlayerAPI {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

const initialState: VideoPlayerState = {
  videoId: "",
  videoSrc: "",
  videoTitle: "",
  currentTime: 0,
  isPlaying: false,
  mode: "hidden",
  mainSlotRect: null,
};

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VideoPlayerState>(initialState);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerAPI | null>(null);

  const playVideo = useCallback(
    (
      videoId: string,
      videoSrc: string,
      videoTitle: string,
      mode: PlayerMode = "main",
      startTime = 0,
      rect?: DOMRect
    ) => {
      setState((prev) => {
        // If same video, just switch mode
        if (prev.videoId === videoId && prev.videoSrc === videoSrc) {
          return { ...prev, mode, mainSlotRect: rect ?? prev.mainSlotRect };
        }
        // New video
        return {
          ...prev,
          videoId,
          videoSrc,
          videoTitle,
          currentTime: startTime,
          isPlaying: true,
          mode,
          mainSlotRect: rect ?? prev.mainSlotRect,
        };
      });
    },
    []
  );

  const switchToMini = useCallback(() => {
    setState((prev) => {
      if (!prev.videoSrc) return prev;
      return { ...prev, mode: "mini" };
    });
  }, []);

  const switchToMain = useCallback((rect?: DOMRect) => {
    setState((prev) => {
      if (!prev.videoSrc) return prev;
      return { ...prev, mode: "main", mainSlotRect: rect ?? prev.mainSlotRect };
    });
  }, []);

  const closePlayer = useCallback(() => {
    setState(initialState);
  }, []);

  const updatePlayback = useCallback(
    (currentTime: number, isPlaying: boolean) => {
      setState((prev) => ({ ...prev, currentTime, isPlaying }));
    },
    []
  );

  const setMainSlotRect = useCallback((rect: DOMRect | null) => {
    setState((prev) => ({ ...prev, mainSlotRect: rect }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
    }
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
    if (ytPlayerRef.current) {
      if (playing) {
        ytPlayerRef.current.playVideo();
      } else {
        ytPlayerRef.current.pauseVideo();
      }
    }
    setState((prev) => ({ ...prev, isPlaying: playing }));
  }, []);

  return (
    <VideoPlayerContext.Provider
      value={{
        state,
        playVideo,
        switchToMini,
        switchToMain,
        closePlayer,
        updatePlayback,
        setMainSlotRect,
        seekTo,
        setIsPlaying,
        videoRef,
        ytPlayerRef,
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error("useVideoPlayer must be used within a VideoPlayerProvider");
  }
  return context;
}
