import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Keyboard,
} from "lucide-react";
import { PLAYBACK_SPEEDS } from "../../constants";
import { parseVideoUrl } from "../../utils";
import { useVideoProgress } from "../../hooks";
import { useVideoPlayer } from "../../contexts";
import type { VideoNote } from "../../types";

interface VideoPlayerProps {
  src: string | undefined;
  title: string;
  videoId?: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, isPlaying: boolean) => void;
  notes?: VideoNote[];
}

// Player state interface shared between native and YouTube players
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackSpeed: number;
  showSpeedMenu: boolean;
  showControls: boolean;
  isBuffering: boolean;
}

// Player controls interface
interface PlayerControls {
  togglePlay: () => void;
  toggleMute: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  seekTo: (fraction: number) => void;
  skip: (seconds: number) => void;
  toggleFullscreen: () => void;
  handleSpeedChange: (speed: number) => void;
  handleMouseMove: () => void;
  setShowSpeedMenu: (show: boolean) => void;
  setShowControls: (show: boolean) => void;
  setVolume: (volume: number) => void;
}

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: YTPlayerOptions
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    modestbranding?: 0 | 1;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    iv_load_policy?: 1 | 3;
    fs?: 0 | 1;
    playsinline?: 0 | 1;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  getAvailablePlaybackRates: () => number[];
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

export function VideoPlayer({
  src,
  title,
  videoId,
  initialTime,
  onTimeUpdate,
  notes = [],
}: VideoPlayerProps) {
  // Handle missing video source
  if (!src) {
    return (
      <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Video unavailable</p>
          <p className="text-sm">No video source provided</p>
        </div>
      </div>
    );
  }

  const videoSource = parseVideoUrl(src);

  if (videoSource.type === "youtube") {
    return (
      <YouTubePlayer
        youtubeVideoId={videoSource.videoId}
        title={title}
        videoId={videoId}
        initialTime={initialTime}
        onTimeUpdate={onTimeUpdate}
        notes={notes}
      />
    );
  }

  if (videoSource.type === "direct") {
    return (
      <NativeVideoPlayer
        src={videoSource.url}
        title={title}
        videoId={videoId}
        initialTime={initialTime}
        onTimeUpdate={onTimeUpdate}
        notes={notes}
      />
    );
  }

  // Invalid URL - show error
  return (
    <div className="aspect-video bg-onyx rounded-xl flex items-center justify-center">
      <div className="text-center text-jet/50">
        <p className="text-lg font-medium">Video unavailable</p>
        <p className="text-sm">Invalid video URL</p>
      </div>
    </div>
  );
}

// Format time to mm:ss
function formatTime(time: number): string {
  if (!isFinite(time) || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * YouTube Player with custom controls using IFrame API
 */
function YouTubePlayer({
  youtubeVideoId,
  title,
  videoId,
  initialTime,
  onTimeUpdate,
  notes = [],
}: {
  youtubeVideoId: string;
  title: string;
  videoId?: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, isPlaying: boolean) => void;
  notes?: VideoNote[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Progress tracking
  const { saveProgress, getResumeTime } = useVideoProgress(videoId);
  const initialSeekDone = useRef(false);
  const initialTimeRef = useRef(initialTime);
  const { ytPlayerRef } = useVideoPlayer();

  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    isMuted: false,
    isFullscreen: false,
    playbackSpeed: 1,
    showSpeedMenu: false,
    showControls: true,
    isBuffering: false,
  });

  // Initialize YouTube player
  const initPlayer = useCallback(() => {
    if (!playerContainerRef.current || playerRef.current) return;

    const playerId = `youtube-player-${youtubeVideoId}`;
    playerContainerRef.current.id = playerId;

    playerRef.current = new window.YT.Player(playerId, {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        fs: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          setIsReady(true);
          ytPlayerRef.current = playerRef.current;
          const duration = event.target.getDuration();
          setState((s) => ({
            ...s,
            duration,
            volume: event.target.getVolume(),
            isMuted: event.target.isMuted(),
          }));
          // Resume from initialTime (mini player) or saved position
          if (!initialSeekDone.current) {
            const resumeTime = initialTimeRef.current ?? getResumeTime();
            if (resumeTime > 0) {
              event.target.seekTo(resumeTime, true);
            }
            initialSeekDone.current = true;
          }
          event.target.playVideo();
        },
        onStateChange: (event) => {
          const { data, target } = event;
          const YT = window.YT;

          if (data === YT.PlayerState.PLAYING) {
            setState((s) => ({ ...s, isPlaying: true, isBuffering: false }));
            onTimeUpdate?.(playerRef.current?.getCurrentTime() || 0, true);
            // Start time update interval
            if (timeUpdateInterval.current) {
              clearInterval(timeUpdateInterval.current);
            }
            timeUpdateInterval.current = setInterval(() => {
              if (playerRef.current) {
                const currentTime = playerRef.current.getCurrentTime() || 0;
                const duration = playerRef.current.getDuration() || 0;
                setState((s) => ({
                  ...s,
                  currentTime,
                }));
                onTimeUpdate?.(currentTime, true);
                // Save progress
                if (duration > 0) {
                  saveProgress(currentTime, duration);
                }
              }
            }, 250);
          } else if (data === YT.PlayerState.PAUSED) {
            setState((s) => ({ ...s, isPlaying: false }));
            const currentTime = playerRef.current?.getCurrentTime() || 0;
            const duration = playerRef.current?.getDuration() || 0;
            onTimeUpdate?.(currentTime, false);
            // Save progress on pause
            if (duration > 0) {
              saveProgress(currentTime, duration);
            }
            if (timeUpdateInterval.current) {
              clearInterval(timeUpdateInterval.current);
            }
          } else if (data === YT.PlayerState.BUFFERING) {
            setState((s) => ({ ...s, isBuffering: true }));
          } else if (data === YT.PlayerState.ENDED) {
            setState((s) => ({ ...s, isPlaying: false }));
            const currentTime = playerRef.current?.getCurrentTime() || 0;
            const duration = playerRef.current?.getDuration() || 0;
            onTimeUpdate?.(currentTime, false);
            // Mark as completed
            if (duration > 0) {
              saveProgress(duration, duration);
            }
            if (timeUpdateInterval.current) {
              clearInterval(timeUpdateInterval.current);
            }
          }

          // Update duration if changed
          const duration = target.getDuration();
          if (duration > 0) {
            setState((s) => ({ ...s, duration }));
          }
        },
        onError: (event) => {
          console.error("YouTube player error:", event.data);
        },
      },
    });
  }, [youtubeVideoId, getResumeTime, saveProgress, onTimeUpdate, ytPlayerRef]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      ytPlayerRef.current = null;
    };
  }, [initPlayer, ytPlayerRef]);

  // Player controls
  const togglePlay = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    if (state.isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isReady, state.isPlaying]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    if (state.isMuted) {
      playerRef.current.unMute();
      setState((s) => ({ ...s, isMuted: false }));
    } else {
      playerRef.current.mute();
      setState((s) => ({ ...s, isMuted: true }));
    }
  }, [isReady, state.isMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!playerRef.current || !isReady) return;
      const newVolume = parseFloat(e.target.value) * 100;
      playerRef.current.setVolume(newVolume);
      setState((s) => ({
        ...s,
        volume: newVolume,
        isMuted: newVolume === 0,
      }));
      if (newVolume > 0 && state.isMuted) {
        playerRef.current.unMute();
      }
    },
    [isReady, state.isMuted]
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!playerRef.current || !isReady || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * state.duration;
      playerRef.current.seekTo(newTime, true);
      setState((s) => ({ ...s, currentTime: newTime }));
    },
    [isReady, state.duration]
  );

  const seekTo = useCallback(
    (fraction: number) => {
      if (!playerRef.current || !isReady) return;
      const clampedFraction = Math.max(0, Math.min(1, fraction));
      const newTime = clampedFraction * state.duration;
      playerRef.current.seekTo(newTime, true);
      setState((s) => ({ ...s, currentTime: newTime }));
    },
    [isReady, state.duration]
  );

  const skip = useCallback(
    (seconds: number) => {
      if (!playerRef.current || !isReady) return;
      const newTime = Math.max(
        0,
        Math.min(state.duration, state.currentTime + seconds)
      );
      playerRef.current.seekTo(newTime, true);
      setState((s) => ({ ...s, currentTime: newTime }));
    },
    [isReady, state.duration, state.currentTime]
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      if (!playerRef.current || !isReady) return;
      playerRef.current.setPlaybackRate(speed);
      setState((s) => ({ ...s, playbackSpeed: speed, showSpeedMenu: false }));
    },
    [isReady]
  );

  const handleMouseMove = useCallback(() => {
    setState((s) => ({ ...s, showControls: true }));
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    if (state.isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setState((s) => ({ ...s, showControls: false }));
      }, 3000);
    }
  }, [state.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          if (playerRef.current && isReady) {
            const newVol = Math.min(100, state.volume + 10);
            playerRef.current.setVolume(newVol);
            setState((s) => ({ ...s, volume: newVol }));
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (playerRef.current && isReady) {
            const newVol = Math.max(0, state.volume - 10);
            playerRef.current.setVolume(newVol);
            setState((s) => ({ ...s, volume: newVol }));
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, skip, state.volume, isReady]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState((s) => ({ ...s, isFullscreen: !!document.fullscreenElement }));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const controls: PlayerControls = {
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    seekTo,
    skip,
    toggleFullscreen,
    handleSpeedChange,
    handleMouseMove,
    setShowSpeedMenu: (show) =>
      setState((s) => ({ ...s, showSpeedMenu: show })),
    setShowControls: (show) => setState((s) => ({ ...s, showControls: show })),
    setVolume: (vol) => setState((s) => ({ ...s, volume: vol })),
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${
        state.isFullscreen
          ? "fixed inset-0 w-full h-full z-50"
          : "w-full aspect-video rounded-xl"
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() =>
        state.isPlaying && setState((s) => ({ ...s, showControls: false }))
      }
    >
      {/* YouTube Player Container - wrapper needed because YT API replaces the target div */}
      <div className="absolute inset-0 pointer-events-none [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:pointer-events-auto">
        <div ref={playerContainerRef} />
      </div>

      {/* Overlay to block YouTube's native hover title */}
      <div className="absolute inset-0 pointer-events-none z-5" />

      {/* Click overlay for play/pause */}
      <div
        className="absolute inset-0 cursor-pointer z-10"
        onClick={togglePlay}
      />

      {/* Loading state before player is ready */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Buffering Indicator */}
      {state.isBuffering && isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Big Play Button (when paused) */}
      {!state.isPlaying && !state.isBuffering && isReady && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <PlayerControlsOverlay
        state={state}
        controls={controls}
        progress={progress}
        progressRef={progressRef}
        title={title}
        volumeScale={100}
        showKeyboardHints={showKeyboardHints}
        setShowKeyboardHints={setShowKeyboardHints}
        notes={notes}
        duration={state.duration}
      />
    </div>
  );
}

interface NativeVideoPlayerProps {
  src: string | undefined;
  title: string;
  videoId?: string;
  initialTime?: number;
  onTimeUpdate?: (currentTime: number, isPlaying: boolean) => void;
  notes?: VideoNote[];
}

function NativeVideoPlayer({
  src,
  title,
  videoId,
  initialTime,
  onTimeUpdate,
  notes = [],
}: NativeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Progress tracking
  const { saveProgress, getResumeTime } = useVideoProgress(videoId);
  const initialSeekDone = useRef(false);
  const initialTimeRef = useRef(initialTime);
  const { videoRef: contextVideoRef } = useVideoPlayer();

  // Sync local videoRef to context
  useEffect(() => {
    contextVideoRef.current = videoRef.current;
    return () => {
      contextVideoRef.current = null;
    };
  }, [contextVideoRef]);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    playbackSpeed: 1,
    showSpeedMenu: false,
    showControls: true,
    isBuffering: false,
  });

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (state.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [state.isPlaying]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !state.isMuted;
    setState((s) => ({ ...s, isMuted: !s.isMuted }));
  }, [state.isMuted]);

  // Volume change
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;

      const newVolume = parseFloat(e.target.value);
      video.volume = newVolume;
      setState((s) => ({ ...s, volume: newVolume, isMuted: newVolume === 0 }));
    },
    []
  );

  // Seek
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const progress = progressRef.current;
      if (!video || !progress) return;
      const rect = progress.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * state.duration;
    },
    [state.duration]
  );

  const seekTo = useCallback(
    (fraction: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clampedFraction = Math.max(0, Math.min(1, fraction));
      video.currentTime = clampedFraction * state.duration;
    },
    [state.duration]
  );

  // Skip forward/backward
  const skip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(
        0,
        Math.min(state.duration, video.currentTime + seconds)
      );
    },
    [state.duration]
  );

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Playback speed
  const handleSpeedChange = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setState((s) => ({ ...s, playbackSpeed: speed, showSpeedMenu: false }));
  }, []);

  // Show/hide controls
  const handleMouseMove = useCallback(() => {
    setState((s) => ({ ...s, showControls: true }));
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    if (state.isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setState((s) => ({ ...s, showControls: false }));
      }, 3000);
    }
  }, [state.isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skip(10);
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, state.volume + 0.1);
            videoRef.current.volume = newVol;
            setState((s) => ({ ...s, volume: newVol }));
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, state.volume - 0.1);
            videoRef.current.volume = newVol;
            setState((s) => ({ ...s, volume: newVol }));
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, skip, state.volume]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setState((s) => ({ ...s, isPlaying: true }));
      onTimeUpdate?.(video.currentTime, true);
    };
    const onPause = () => {
      setState((s) => ({ ...s, isPlaying: false }));
      onTimeUpdate?.(video.currentTime, false);
      // Save progress on pause
      if (video.duration > 0) {
        saveProgress(video.currentTime, video.duration);
      }
    };
    const handleTimeUpdate = () => {
      setState((s) => ({ ...s, currentTime: video.currentTime }));
      onTimeUpdate?.(video.currentTime, !video.paused);
      // Save progress periodically
      if (video.duration > 0 && !video.paused) {
        saveProgress(video.currentTime, video.duration);
      }
    };
    const onDurationChange = () => {
      setState((s) => ({ ...s, duration: video.duration }));
      // Resume from initialTime (mini player) or saved position
      if (!initialSeekDone.current && video.duration > 0) {
        const resumeTime = initialTimeRef.current ?? getResumeTime();
        if (resumeTime > 0) {
          video.currentTime = resumeTime;
        }
        initialSeekDone.current = true;
      }
    };
    const onWaiting = () => setState((s) => ({ ...s, isBuffering: true }));
    const onCanPlay = () => setState((s) => ({ ...s, isBuffering: false }));
    const onEnded = () => {
      // Mark as completed when video ends
      if (video.duration > 0) {
        saveProgress(video.duration, video.duration);
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("ended", onEnded);
    };
  }, [onTimeUpdate, saveProgress, getResumeTime]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setState((s) => ({ ...s, isFullscreen: !!document.fullscreenElement }));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const controls: PlayerControls = {
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    seekTo,
    skip,
    toggleFullscreen,
    handleSpeedChange,
    handleMouseMove,
    setShowSpeedMenu: (show) =>
      setState((s) => ({ ...s, showSpeedMenu: show })),
    setShowControls: (show) => setState((s) => ({ ...s, showControls: show })),
    setVolume: (vol) => setState((s) => ({ ...s, volume: vol })),
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${
        state.isFullscreen
          ? "fixed inset-0 w-full h-full z-50"
          : "w-full aspect-video rounded-xl"
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() =>
        state.isPlaying && setState((s) => ({ ...s, showControls: false }))
      }
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
        autoPlay
      />

      {/* Buffering Indicator */}
      {state.isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Big Play Button (when paused) */}
      {!state.isPlaying && !state.isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <PlayerControlsOverlay
        state={state}
        controls={controls}
        progress={progress}
        progressRef={progressRef}
        title={title}
        volumeScale={1}
        showKeyboardHints={showKeyboardHints}
        setShowKeyboardHints={setShowKeyboardHints}
        notes={notes}
        duration={state.duration}
      />
    </div>
  );
}

/**
 * Shared Controls Overlay component for both YouTube and Native players
 */
interface PlayerControlsOverlayProps {
  state: PlayerState;
  controls: PlayerControls;
  progress: number;
  progressRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  volumeScale: number;
  showKeyboardHints: boolean;
  setShowKeyboardHints: (show: boolean) => void;
  notes?: VideoNote[];
  duration: number;
}

function PlayerControlsOverlay({
  state,
  controls,
  progress,
  progressRef,
  title,
  volumeScale,
  showKeyboardHints,
  setShowKeyboardHints,
  notes = [],
  duration,
}: PlayerControlsOverlayProps) {
  const normalizedVolume = state.volume / volumeScale;
  const isMuted = state.isMuted || state.volume === 0;
  const [isDragging, setIsDragging] = useState(false);

  const calculateFraction = useCallback(
    (clientX: number): number => {
      if (!progressRef.current) return 0;
      const rect = progressRef.current.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    [progressRef]
  );

  const handleDragStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      controls.seekTo(calculateFraction(clientX));
    },
    [controls, calculateFraction]
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      controls.seekTo(calculateFraction(clientX));
    },
    [isDragging, controls, calculateFraction]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  // Touch event handlers
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleDragStart(touch.clientX);
      }
    },
    [handleDragStart]
  );

  // Global mouse/touch move and end listeners
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) handleDragMove(touch.clientX);
    };
    const onTouchEnd = () => handleDragEnd();
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <>
      {/* Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 z-30 ${
          state.showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className={`relative w-full h-6 cursor-pointer mb-4 group/progress touch-none ${
            isDragging ? "select-none" : ""
          }`}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {/* Wave visualization based on notes */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 24"
            preserveAspectRatio="none"
          >
            {(() => {
              if (duration <= 0) {
                return (
                  <rect
                    x="0"
                    y="20"
                    width="100%"
                    height="4"
                    fill="rgb(255 255 255 / 0.2)"
                  />
                );
              }
              const segments = 30;
              const heights: number[] = [];
              for (let i = 0; i <= segments; i++) {
                const time = (i / segments) * duration;
                const noteInfluence = notes.reduce((acc, note) => {
                  const dist = Math.abs(time - note.timestamp);
                  const baseRadius = 8;
                  const lengthBonus = Math.min(note.content.length / 20, 15);
                  const radius = baseRadius + lengthBonus;
                  if (dist < radius) {
                    return Math.max(acc, 1 - (dist / radius) ** 2);
                  }
                  return acc;
                }, 0);
                heights.push(4 + noteInfluence * 16);
              }
              const getHeightAt = (pct: number): number => {
                const idx = (pct / 100) * segments;
                const lo = Math.floor(idx);
                const hi = Math.min(lo + 1, segments);
                const t = idx - lo;
                return heights[lo] * (1 - t) + heights[hi] * t;
              };
              const generatePath = (startX: number, endX: number): string => {
                if (startX >= endX) return "";
                const startY = 24 - getHeightAt(startX);
                const endY = 24 - getHeightAt(endX);
                const points: string[] = [
                  `M ${startX} 24 L ${startX} ${startY}`,
                ];
                const startIdx = Math.ceil((startX / 100) * segments);
                const endIdx = Math.floor((endX / 100) * segments);
                for (let i = startIdx; i <= endIdx && i <= segments; i++) {
                  const x = (i / segments) * 100;
                  const y = 24 - heights[i];
                  const prevX =
                    i === startIdx ? startX : ((i - 1) / segments) * 100;
                  const prevY = i === startIdx ? startY : 24 - heights[i - 1];
                  const cpX = (prevX + x) / 2;
                  points.push(`C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`);
                }
                const lastX =
                  endIdx >= startIdx ? (endIdx / segments) * 100 : startX;
                const lastY =
                  endIdx >= startIdx ? 24 - heights[endIdx] : startY;
                const cpX = (lastX + endX) / 2;
                points.push(
                  `C ${cpX} ${lastY}, ${cpX} ${endY}, ${endX} ${endY}`
                );
                points.push(`L ${endX} 24 Z`);
                return points.join(" ");
              };
              const fullPath = generatePath(0, 100);
              return (
                <>
                  <defs>
                    <clipPath id="waveform-clip">
                      <path d={fullPath} />
                    </clipPath>
                  </defs>
                  <path d={fullPath} fill="rgb(255 255 255 / 0.2)" />
                  <rect
                    x="0"
                    y="0"
                    width={progress}
                    height="24"
                    fill="hsl(var(--primary))"
                    clipPath="url(#waveform-clip)"
                  />
                  {notes.map((note) => {
                    const centerPct = (note.timestamp / duration) * 100;
                    const baseRadius = 8;
                    const lengthBonus = Math.min(note.content.length / 20, 15);
                    const radius = baseRadius + lengthBonus;
                    const radiusPct = (radius / duration) * 100;
                    const clampedStart = Math.max(0, centerPct - radiusPct);
                    const clampedEnd = Math.min(100, centerPct + radiusPct);
                    if (clampedStart >= progress) return null;
                    const highlightEnd = Math.min(clampedEnd, progress);
                    if (clampedStart >= highlightEnd) return null;
                    return (
                      <rect
                        key={note.id}
                        x={clampedStart}
                        y="0"
                        width={highlightEnd - clampedStart}
                        height="24"
                        fill="rgb(250 204 21 / 0.7)"
                        clipPath="url(#waveform-clip)"
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
          {/* Scrubber handle */}
          <div
            className={`absolute bottom-0 w-3 h-3 bg-white rounded-full transition-opacity z-20 -translate-x-1/2 ${
              isDragging
                ? "opacity-100 scale-125"
                : "opacity-0 group-hover/progress:opacity-100"
            }`}
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={controls.togglePlay}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </button>

            {/* Skip Backward */}
            <button
              onClick={() => controls.skip(-10)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => controls.skip(10)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={controls.toggleMute}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : normalizedVolume}
                onChange={controls.handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-cool-sky"
              />
            </div>

            {/* Time */}
            <span className="text-sm font-medium ml-2">
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => controls.setShowSpeedMenu(!state.showSpeedMenu)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
                aria-label="Playback speed"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {state.playbackSpeed}x
                </span>
              </button>

              {state.showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black rounded-lg overflow-hidden shadow-lg">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => controls.handleSpeedChange(speed)}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${
                        speed === state.playbackSpeed ? "bg-primary" : ""
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts */}
            <button
              onClick={() => setShowKeyboardHints(!showKeyboardHints)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={controls.toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={
                state.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
              }
            >
              {state.isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Title (shown on hover) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/60 to-transparent transition-opacity duration-300 z-30 ${
          state.showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <h2 className="text-white font-semibold text-lg truncate">{title}</h2>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHints && (
        <div
          className="absolute inset-0 bg-black/80 flex items-center justify-center z-40"
          onClick={() => setShowKeyboardHints(false)}
        >
          <div
            className="bg-black rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-lg mb-4">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { key: "Space / K", action: "Play / Pause" },
                { key: "F", action: "Toggle fullscreen" },
                { key: "M", action: "Toggle mute" },
                { key: "←", action: "Rewind 10s" },
                { key: "→", action: "Forward 10s" },
                { key: "↑", action: "Volume up" },
                { key: "↓", action: "Volume down" },
              ].map(({ key, action }) => (
                <div key={key} className="flex justify-between text-white/90">
                  <span className="text-white/60">{action}</span>
                  <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowKeyboardHints(false)}
              className="mt-4 w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
