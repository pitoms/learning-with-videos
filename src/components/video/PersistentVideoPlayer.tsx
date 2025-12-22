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
  X,
  Maximize2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLAYBACK_SPEEDS } from "../../constants";
import { parseVideoUrl } from "../../utils";
import { useVideoProgress } from "../../hooks";
import { useVideoPlayer } from "../../contexts/VideoPlayerContext";

export function PersistentVideoPlayer() {
  const navigate = useNavigate();
  const {
    state,
    videoRef,
    ytPlayerRef,
    updatePlayback,
    closePlayer,
    setIsPlaying,
    seekTo,
  } = useVideoPlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const initialSeekDone = useRef(false);
  const currentVideoIdRef = useRef<string>("");

  const [isYTReady, setIsYTReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { saveProgress, getResumeTime } = useVideoProgress(
    state.videoId || undefined
  );

  const videoSource = state.videoSrc ? parseVideoUrl(state.videoSrc) : null;
  const isYouTube = videoSource?.type === "youtube";
  const isNative = videoSource?.type === "direct";

  const stopTimeUpdateInterval = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
      timeUpdateInterval.current = null;
    }
  }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const startTimeUpdateInterval = useCallback(() => {
    stopTimeUpdateInterval();
    timeUpdateInterval.current = setInterval(() => {
      if (ytPlayerRef.current) {
        const time = ytPlayerRef.current.getCurrentTime();
        const dur = ytPlayerRef.current.getDuration();
        updatePlayback(time, true);
        if (dur > 0) {
          saveProgress(time, dur);
        }
      }
    }, 250);
  }, [updatePlayback, saveProgress, stopTimeUpdateInterval]);

  // Reset state when video changes
  useEffect(() => {
    if (state.videoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = state.videoId;
      initialSeekDone.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsYTReady(false);
      setDuration(0);
      setDragPosition({ x: 0, y: 0 });
    }
  }, [state.videoId]);

  // Initialize/cleanup YouTube player
  useEffect(() => {
    if (state.mode === "hidden" || !isYouTube || !videoSource) return;

    let mounted = true;

    const initPlayer = () => {
      if (!playerContainerRef.current || !mounted) return;

      // Clear previous player
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Player may already be destroyed
        }
        ytPlayerRef.current = null;
      }

      const playerId = `persistent-yt-player-${Date.now()}`;
      playerContainerRef.current.innerHTML = "";
      const playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      playerContainerRef.current.appendChild(playerDiv);

      ytPlayerRef.current = new window.YT.Player(playerId, {
        videoId: videoSource.videoId,
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
            if (!mounted) return;
            setIsYTReady(true);
            setDuration(event.target.getDuration());
            setVolume(event.target.getVolume() / 100);
            setIsMuted(event.target.isMuted());

            // Seek to resume position
            if (!initialSeekDone.current) {
              const resumeTime =
                state.currentTime > 0 ? state.currentTime : getResumeTime();
              if (resumeTime > 0) {
                event.target.seekTo(resumeTime, true);
              }
              initialSeekDone.current = true;
            }
            event.target.playVideo();
          },
          onStateChange: (event) => {
            if (!mounted) return;
            const YT = window.YT;
            if (event.data === YT.PlayerState.PLAYING) {
              updatePlayback(ytPlayerRef.current?.getCurrentTime() || 0, true);
              setIsBuffering(false);
              startTimeUpdateInterval();
            } else if (event.data === YT.PlayerState.PAUSED) {
              updatePlayback(ytPlayerRef.current?.getCurrentTime() || 0, false);
              stopTimeUpdateInterval();
            } else if (event.data === YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (event.data === YT.PlayerState.ENDED) {
              updatePlayback(duration, false);
              stopTimeUpdateInterval();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      setTimeout(initPlayer, 50);
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    return () => {
      mounted = false;
      stopTimeUpdateInterval();
    };
  }, [state.videoSrc, state.mode === "hidden"]);

  // Handle native video
  useEffect(() => {
    if (state.mode === "hidden" || !isNative || !videoRef.current) return;

    const video = videoRef.current;

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      if (!initialSeekDone.current) {
        const resumeTime =
          state.currentTime > 0 ? state.currentTime : getResumeTime();
        if (resumeTime > 0) {
          video.currentTime = resumeTime;
        }
        initialSeekDone.current = true;
      }
      video.play().catch(() => {
        updatePlayback(video.currentTime, false);
      });
    };

    const onTimeUpdate = () => {
      updatePlayback(video.currentTime, !video.paused);
      if (video.duration > 0 && !video.paused) {
        saveProgress(video.currentTime, video.duration);
      }
    };

    const onPlay = () => updatePlayback(video.currentTime, true);
    const onPause = () => {
      updatePlayback(video.currentTime, false);
      if (video.duration > 0) {
        saveProgress(video.currentTime, video.duration);
      }
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);

    // If already loaded, trigger manually
    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [
    state.videoSrc,
    state.mode === "hidden",
    isNative,
    updatePlayback,
    saveProgress,
    getResumeTime,
  ]);

  // Player controls
  const togglePlay = useCallback(() => {
    setIsPlaying(!state.isPlaying);
  }, [state.isPlaying, setIsPlaying]);

  const toggleMute = useCallback(() => {
    if (isYouTube && ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.unMute();
      } else {
        ytPlayerRef.current.mute();
      }
    }
    if (isNative && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }, [isYouTube, isNative, isMuted, videoRef, ytPlayerRef]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVol = parseFloat(e.target.value);
      if (isYouTube && ytPlayerRef.current) {
        ytPlayerRef.current.setVolume(newVol * 100);
        if (newVol > 0 && isMuted) ytPlayerRef.current.unMute();
      }
      if (isNative && videoRef.current) {
        videoRef.current.volume = newVol;
      }
      setVolume(newVol);
      setIsMuted(newVol === 0);
    },
    [isYouTube, isNative, isMuted, videoRef, ytPlayerRef]
  );

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const newTime = pos * duration;
      seekTo(newTime);
    },
    [duration, seekTo, progressRef]
  );

  const skip = useCallback(
    (seconds: number) => {
      const newTime = Math.max(
        0,
        Math.min(duration, state.currentTime + seconds)
      );
      seekTo(newTime);
    },
    [duration, state.currentTime, seekTo]
  );

  const handleSpeedChange = useCallback(
    (speed: number) => {
      if (isYouTube && ytPlayerRef.current) {
        ytPlayerRef.current.setPlaybackRate(speed);
      }
      if (isNative && videoRef.current) {
        videoRef.current.playbackRate = speed;
      }
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    },
    [isYouTube, isNative, videoRef, ytPlayerRef]
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    if (state.isPlaying) {
      hideControlsTimeout.current = setTimeout(
        () => setShowControls(false),
        3000
      );
    }
  }, [state.isPlaying]);

  // Keyboard shortcuts (only in main mode)
  useEffect(() => {
    if (state.mode !== "main") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

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
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.mode, togglePlay, toggleFullscreen, toggleMute, skip]);

  // Mini player dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, video, [data-progress-bar]"))
      return;
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 180;
      setDragPosition({
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Expand mini to main
  const expandToMain = useCallback(() => {
    navigate(`/video/${state.videoId}`);
  }, [navigate, state.videoId]);

  // Don't render if hidden or no video
  if (state.mode === "hidden" || !state.videoSrc || !videoSource) {
    return null;
  }

  const progress = duration > 0 ? (state.currentTime / duration) * 100 : 0;

  // Position styles
  const getContainerStyle = (): React.CSSProperties => {
    if (isFullscreen) {
      return { position: "fixed", inset: 0, zIndex: 9999 };
    }

    if (state.mode === "mini") {
      const base: React.CSSProperties = {
        position: "fixed",
        width: 320,
        zIndex: 50,
        transition: isDragging ? "none" : "all 300ms ease-out",
      };
      if (dragPosition.x === 0 && dragPosition.y === 0) {
        return { ...base, right: 24, bottom: 24 };
      }
      return { ...base, left: dragPosition.x, top: dragPosition.y };
    }

    // Main mode - overlay the slot
    if (state.mainSlotRect) {
      return {
        position: "fixed",
        left: state.mainSlotRect.left,
        top: state.mainSlotRect.top,
        width: state.mainSlotRect.width,
        height: state.mainSlotRect.height,
        zIndex: 40,
        transition: "all 300ms ease-out",
      };
    }

    // Fallback for main mode without rect - stay in mini position until rect is ready
    return {
      position: "fixed",
      width: 320,
      right: 24,
      bottom: 24,
      zIndex: 50,
      transition: "all 300ms ease-out",
    };
  };

  const isMini = state.mode === "mini";

  return (
    <div
      ref={containerRef}
      className={`bg-black overflow-hidden ${
        isMini ? "rounded-lg shadow-2xl" : "rounded-xl"
      } ${isDragging ? "cursor-grabbing" : isMini ? "cursor-grab" : ""}`}
      style={getContainerStyle()}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => state.isPlaying && setShowControls(false)}
      onMouseDown={isMini ? handleDragStart : undefined}
    >
      <div className={`relative ${isMini ? "aspect-video" : "w-full h-full"}`}>
        {/* Native Video */}
        {isNative && (
          <video
            ref={videoRef}
            src={videoSource.url}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
            playsInline
            autoPlay
            muted={isMuted}
          />
        )}

        {/* YouTube Player */}
        {isYouTube && (
          <>
            <div className="absolute inset-0 pointer-events-none [&>iframe]:w-full [&>iframe]:h-full">
              <div ref={playerContainerRef} />
            </div>
            <div
              className="absolute inset-0 cursor-pointer z-10"
              onClick={togglePlay}
            />
          </>
        )}

        {/* Loading/Buffering */}
        {(isBuffering || (isYouTube && !isYTReady)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Big play button when paused (main mode only) */}
        {!state.isPlaying &&
          !isBuffering &&
          !isMini &&
          (isNative || isYTReady) && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <Play
                  className="w-8 h-8 text-primary ml-1"
                  fill="currentColor"
                />
              </div>
            </div>
          )}

        {/* Controls overlay */}
        {isMini ? (
          <MiniControls
            title={state.videoTitle}
            isPlaying={state.isPlaying}
            progress={progress}
            progressRef={progressRef}
            onTogglePlay={togglePlay}
            onSeek={handleSeek}
            onExpand={expandToMain}
            onClose={closePlayer}
          />
        ) : (
          <MainControls
            show={showControls}
            title={state.videoTitle}
            isPlaying={state.isPlaying}
            currentTime={state.currentTime}
            duration={duration}
            progress={progress}
            progressRef={progressRef}
            volume={volume}
            isMuted={isMuted}
            playbackSpeed={playbackSpeed}
            showSpeedMenu={showSpeedMenu}
            isFullscreen={isFullscreen}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeek}
            onSkip={skip}
            onSpeedChange={handleSpeedChange}
            onToggleSpeedMenu={() => setShowSpeedMenu(!showSpeedMenu)}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
      </div>
    </div>
  );
}

// Mini player controls overlay
function MiniControls({
  title,
  isPlaying,
  progress,
  progressRef,
  onTogglePlay,
  onSeek,
  onExpand,
  onClose,
}: {
  title: string;
  isPlaying: boolean;
  progress: number;
  progressRef: React.RefObject<HTMLDivElement | null>;
  onTogglePlay: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onExpand: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-100 sm:opacity-0 sm:hover:opacity-100 transition-opacity pointer-events-none group/mini">
      <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between pointer-events-auto">
        <h3 className="text-white text-xs font-medium truncate flex-1 mr-2">
          {title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors pointer-events-auto"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 text-white" fill="currentColor" />
          )}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-auto">
        <div
          ref={progressRef}
          data-progress-bar
          className="w-full h-2 bg-white/30 rounded-full mb-2 cursor-pointer group/progress"
          onClick={onSeek}
        >
          <div
            className="h-full bg-primary rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main player controls overlay
function MainControls({
  show,
  title,
  isPlaying,
  currentTime,
  duration,
  progress,
  progressRef,
  volume,
  isMuted,
  playbackSpeed,
  showSpeedMenu,
  isFullscreen,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onSkip,
  onSpeedChange,
  onToggleSpeedMenu,
  onToggleFullscreen,
}: {
  show: boolean;
  title: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  progressRef: React.RefObject<HTMLDivElement | null>;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  showSpeedMenu: boolean;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSkip: (seconds: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleSpeedMenu: () => void;
  onToggleFullscreen: () => void;
}) {
  const formatTime = (t: number) => {
    if (!isFinite(t) || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 z-30 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Title */}
      <div className="absolute top-0 left-0 right-0 p-4">
        <h2 className="text-white font-semibold text-lg truncate">{title}</h2>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
          onClick={onSeek}
        >
          <div
            className="h-full bg-primary rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5 text-white" fill="currentColor" />
              )}
            </button>

            {/* Skip buttons */}
            <button
              onClick={() => onSkip(-10)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => onSkip(10)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/volume">
              <button
                onClick={onToggleMute}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={onVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-cool-sky"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={onToggleSpeedMenu}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
              >
                <Settings className="w-5 h-5 text-white" />
                <span className="text-white text-sm">{playbackSpeed}x</span>
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 rounded-lg py-2 min-w-[100px] shadow-xl">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => onSpeedChange(speed)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                        playbackSpeed === speed ? "text-cool-sky" : "text-white"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
