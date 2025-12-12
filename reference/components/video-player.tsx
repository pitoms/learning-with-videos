"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"

export function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.volume = value[0]
      setVolume(value[0])
      setIsMuted(value[0] === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full"
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        onClick={togglePlay}
      />

      {/* Top Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 lg:p-6 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <h1 className="text-lg lg:text-2xl font-semibold text-white text-balance">
          Introduction to Advanced Web Development
        </h1>
        <p className="text-sm text-white/70 mt-1">Chapter 1: Getting Started</p>
      </div>

      {/* Play/Pause Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
          !isPlaying ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="rounded-full bg-primary/20 backdrop-blur-sm p-6 lg:p-8">
          <Play className="h-12 w-12 lg:h-16 lg:w-16 text-white fill-white" />
        </div>
      </div>

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 py-3 lg:px-6 lg:py-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Progress Bar */}
        <div className="mb-3 lg:mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 lg:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 h-9 w-9 lg:h-10 lg:w-10"
            >
              {isPlaying ? <Pause className="h-5 w-5 lg:h-6 lg:w-6" /> : <Play className="h-5 w-5 lg:h-6 lg:w-6" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-white hover:bg-white/20 h-9 w-9 lg:h-10 lg:w-10"
            >
              <SkipBack className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-white hover:bg-white/20 h-9 w-9 lg:h-10 lg:w-10"
            >
              <SkipForward className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>

            {/* Volume Control */}
            <div className="hidden lg:flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-10 w-10"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 lg:gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9 lg:h-10 lg:w-10">
              <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 h-9 w-9 lg:h-10 lg:w-10"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4 lg:h-5 lg:w-5" />
              ) : (
                <Maximize className="h-4 w-4 lg:h-5 lg:w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
