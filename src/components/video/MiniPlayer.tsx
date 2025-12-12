import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Play, Pause, Maximize2 } from "lucide-react";
import { useMiniPlayer } from "../../contexts";
import { parseVideoUrl } from "../../utils";

// Mini player YT player interface (subset of full interface)
interface MiniYTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export function MiniPlayer() {
  const navigate = useNavigate();
  const { state, closeMiniPlayer, updateCurrentTime, setIsPlaying } =
    useMiniPlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<MiniYTPlayer | null>(null);
  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [isYTReady, setIsYTReady] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Use ref to avoid stale closure in async callbacks
  const initialTimeRef = useRef(state.currentTime);
  const shouldAutoplayRef = useRef(state.isPlaying);

  const videoSource = state.videoSrc ? parseVideoUrl(state.videoSrc) : null;

  // Update refs when state changes on mini player activation
  useEffect(() => {
    if (state.isActive) {
      initialTimeRef.current = state.currentTime;
      shouldAutoplayRef.current = state.isPlaying;
    }
  }, [state.isActive, state.currentTime, state.isPlaying]);

  // Initialize YouTube player
  useEffect(() => {
    if (!state.isActive || videoSource?.type !== "youtube") {
      return;
    }

    let checkReadyInterval: ReturnType<typeof setInterval> | null = null;
    let playerInitialized = false;

    const initPlayer = () => {
      if (!playerContainerRef.current || playerInitialized) return;
      playerInitialized = true;

      // Create a fresh div for the player
      const playerId = `mini-youtube-player-${Date.now()}`;
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
        } as Record<string, number>,
        events: {
          onReady: (event: {
            target: {
              getDuration: () => number;
              playVideo: () => void;
              seekTo: (t: number, a: boolean) => void;
            };
          }) => {
            setIsYTReady(true);
            // Seek to saved position using ref to avoid stale closure
            if (initialTimeRef.current > 0) {
              event.target.seekTo(initialTimeRef.current, true);
            }
            // Always autoplay when mini player opens
            event.target.playVideo();
          },
          onStateChange: (event) => {
            const YT = window.YT;
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
              }
              timeUpdateInterval.current = setInterval(() => {
                if (ytPlayerRef.current) {
                  const currentTime = ytPlayerRef.current.getCurrentTime();
                  const totalDuration = ytPlayerRef.current.getDuration();
                  updateCurrentTime(currentTime);
                  setProgress(
                    totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0
                  );
                }
              }, 250);
            } else if (event.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
              }
            } else if (event.data === YT.PlayerState.ENDED) {
              setIsPlaying(false);
              if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
              }
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      // Small delay to ensure DOM is ready
      setTimeout(initPlayer, 100);
    } else {
      // Load YouTube API if not already loaded
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      checkReadyInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          if (checkReadyInterval) clearInterval(checkReadyInterval);
          initPlayer();
        }
      }, 100);
    }

    return () => {
      if (checkReadyInterval) {
        clearInterval(checkReadyInterval);
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // Player may already be destroyed
        }
        ytPlayerRef.current = null;
      }
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      setIsYTReady(false);
    };
  }, [state.isActive, state.videoSrc]);

  // Handle native video time updates and autoplay
  useEffect(() => {
    if (!state.isActive || videoSource?.type !== "direct" || !videoRef.current)
      return;

    const video = videoRef.current;

    const handleTimeUpdate = () => {
      updateCurrentTime(video.currentTime);
      setProgress(
        video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0
      );
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    // Seek to saved position using ref to avoid stale closure
    const seekToTime = initialTimeRef.current;

    const startPlayback = () => {
      if (seekToTime > 0) {
        video.currentTime = seekToTime;
      }
      video.play().catch(() => {});
    };

    // If video is ready, start immediately; otherwise wait for loadeddata
    if (video.readyState >= 2) {
      startPlayback();
    } else {
      video.addEventListener("loadeddata", startPlayback, { once: true });
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [state.isActive, state.videoSrc]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (videoSource?.type === "youtube" && ytPlayerRef.current && isYTReady) {
      if (state.isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    } else if (videoSource?.type === "direct" && videoRef.current) {
      if (state.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [videoSource?.type, state.isPlaying, isYTReady]);

  // Expand to full video page (VideoPage handles closing mini player)
  const expandToFullPlayer = useCallback(() => {
    navigate(`/video/${state.videoId}`);
  }, [navigate, state.videoId]);

  // Handle seek on progress bar click
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );

      if (videoSource?.type === "youtube" && ytPlayerRef.current && isYTReady) {
        const duration = ytPlayerRef.current.getDuration();
        const newTime = pos * duration;
        ytPlayerRef.current.seekTo(newTime, true);
        updateCurrentTime(newTime);
        setProgress(pos * 100);
      } else if (videoSource?.type === "direct" && videoRef.current) {
        const duration = videoRef.current.duration;
        const newTime = pos * duration;
        videoRef.current.currentTime = newTime;
        updateCurrentTime(newTime);
        setProgress(pos * 100);
      }
    },
    [videoSource?.type, isYTReady, updateCurrentTime]
  );

  // Dragging handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on interactive elements
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("video") ||
      (e.target as HTMLElement).closest("[data-progress-bar]")
    ) {
      return;
    }
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 180;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Reset position when activated
  useEffect(() => {
    if (state.isActive) {
      setPosition({ x: 0, y: 0 });
      setIsYTReady(false);
    }
  }, [state.isActive]);

  if (!state.isActive || !videoSource || videoSource.type === "invalid") {
    return null;
  }

  const containerStyle =
    position.x === 0 && position.y === 0
      ? { right: "24px", bottom: "24px" }
      : {
          left: `${position.x}px`,
          top: `${position.y}px`,
          right: "auto",
          bottom: "auto",
        };

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 w-80 bg-black rounded-lg shadow-2xl overflow-hidden transition-shadow ${
        isDragging ? "cursor-grabbing shadow-3xl" : "cursor-grab"
      }`}
      style={containerStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-black">
        {videoSource.type === "youtube" && (
          <>
            <div className="absolute inset-0 pointer-events-none [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:pointer-events-auto">
              <div ref={playerContainerRef} />
            </div>
            {/* Overlay to block YouTube's native hover title */}
            <div className="absolute inset-0 pointer-events-none z-5" />
          </>
        )}

        {videoSource.type === "direct" && (
          <video
            ref={videoRef}
            src={videoSource.url}
            className="w-full h-full object-contain"
            playsInline
            autoPlay
            muted={false}
          />
        )}

        {/* Loading state for YouTube */}
        {videoSource.type === "youtube" && !isYTReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-0 hover:opacity-100 transition-opacity">
          {/* Top bar with title and close */}
          <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between">
            <h3 className="text-white text-xs font-medium truncate flex-1 mr-2">
              {state.videoTitle}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeMiniPlayer();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close mini player"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Center play/pause button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors pointer-events-auto"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className="w-6 h-6 text-white" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 text-white" fill="currentColor" />
              )}
            </button>
          </div>

          {/* Bottom bar with expand button */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            {/* Progress bar */}
            <div
              ref={progressRef}
              data-progress-bar
              className="w-full h-2 bg-white/30 rounded-full mb-2 cursor-pointer group/progress"
              onClick={handleSeek}
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
                  expandToFullPlayer();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Expand to full player"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
