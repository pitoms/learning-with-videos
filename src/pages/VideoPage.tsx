import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useVideo, useVideoNotes } from "../hooks";
import { useMiniPlayer, useVideoPlayer } from "../contexts";
import {
  VideoPlayer,
  VideoSidebar,
  CommentSection,
  VideoPageSkeleton,
} from "../components/video";
import { ErrorMessage } from "../components/ui";

export function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    openMiniPlayer,
    state: miniPlayerState,
    closeMiniPlayer,
  } = useMiniPlayer();
  const { data: video, isLoading, error, refetch } = useVideo(id || "");
  const { notes, addNote, deleteNote } = useVideoNotes(id);
  const { updatePlayback } = useVideoPlayer();

  // Track current playback state for mini player
  const [playbackState, setPlaybackState] = useState({
    currentTime: 0,
    isPlaying: false,
  });

  const handleTimeUpdate = useCallback(
    (currentTime: number, isPlaying: boolean) => {
      setPlaybackState({ currentTime, isPlaying });
      updatePlayback(currentTime, isPlaying);
    },
    [updatePlayback]
  );

  // Track if we should close mini player on mount (user expanded from mini player)
  const expandedFromMiniPlayer =
    miniPlayerState.isActive && miniPlayerState.videoId === id;
  const shouldCloseMiniPlayerOnMount = useRef(expandedFromMiniPlayer);
  // Capture mini player time before it gets cleared
  const miniPlayerTimeRef = useRef(
    expandedFromMiniPlayer ? miniPlayerState.currentTime : undefined
  );

  // Close mini player only on initial mount when expanding from mini player
  useEffect(() => {
    if (shouldCloseMiniPlayerOnMount.current) {
      closeMiniPlayer();
      shouldCloseMiniPlayerOnMount.current = false;
    }
  }, [closeMiniPlayer]);

  // Close mini player when navigating to a different video
  useEffect(() => {
    if (miniPlayerState.isActive && miniPlayerState.videoId !== id) {
      closeMiniPlayer();
    }
  }, [id, miniPlayerState.isActive, miniPlayerState.videoId, closeMiniPlayer]);

  const handleBackToVideos = () => {
    if (video?.video_url && playbackState.isPlaying) {
      openMiniPlayer(
        video.video_url,
        video.title,
        video.id,
        playbackState.currentTime,
        playbackState.isPlaying
      );
    }
    navigate("/");
  };

  if (isLoading) {
    return <VideoPageSkeleton />;
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center py-32">
        <ErrorMessage
          message="Failed to load video. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:h-full lg:overflow-hidden">
      <div className="mx-auto max-w-[2400px] lg:h-full">
        <div className="flex flex-col lg:flex-row lg:h-full">
          <div className="flex-1 lg:min-w-0 lg:overflow-y-auto">
            <div className="p-3 lg:p-4 border-b border-border bg-card">
              <button
                onClick={handleBackToVideos}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground group text-sm"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Videos
              </button>
            </div>
            <div className="bg-black">
              <VideoPlayer
                key={video.id}
                src={video.video_url}
                title={video.title}
                videoId={video.id}
                initialTime={miniPlayerTimeRef.current}
                onTimeUpdate={handleTimeUpdate}
                notes={notes}
              />
            </div>
            {/* Mobile: Notes appear directly under video */}
            <div className="lg:hidden">
              <VideoSidebar
                video={video}
                notes={notes}
                addNote={addNote}
                deleteNote={deleteNote}
              />
            </div>
            <div className="p-4 lg:p-6 bg-card border-t border-border">
              <CommentSection videoId={video.id} />
            </div>
          </div>
          {/* Desktop: Sidebar on the right */}
          <div className="hidden lg:block">
            <VideoSidebar
              video={video}
              notes={notes}
              addNote={addNote}
              deleteNote={deleteNote}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
