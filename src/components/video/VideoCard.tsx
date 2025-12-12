import { Link } from "react-router-dom";
import { Play, CheckCircle } from "lucide-react";
import type { Video } from "../../types";
import { useAllVideoProgress } from "../../hooks";

interface VideoCardProps {
  video: Video;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export function VideoCard({ video }: VideoCardProps) {
  const { getProgress } = useAllVideoProgress();
  const progress = getProgress(video.id);
  const watchedPercent = progress
    ? Math.min(100, (progress.currentTime / progress.duration) * 100)
    : 0;
  const isCompleted = progress?.completed ?? false;

  const isYouTube = isYouTubeUrl(video.video_url);
  const youtubeThumbnail = isYouTube
    ? getYouTubeThumbnail(video.video_url)
    : null;

  return (
    <Link
      to={`/video/${video.id}`}
      className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/20 hover:scale-[1.02] hover:-translate-y-1"
    >
      <div className="relative aspect-video bg-muted overflow-hidden">
        {isYouTube && youtubeThumbnail ? (
          <div className="relative w-full h-full">
            <img
              src={youtubeThumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300" />
          </div>
        ) : (
          <video
            src={video.video_url}
            className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
            muted
            preload="metadata"
            onMouseEnter={(e) => {
              const target = e.target as HTMLVideoElement;
              target.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLVideoElement;
              target.pause();
              target.currentTime = 0;
            }}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow-xl">
            <Play
              className="w-6 h-6 text-foreground ml-1"
              fill="currentColor"
            />
          </div>
        </div>

        {isCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-600 text-white text-xs px-2.5 py-1.5 rounded-full font-medium shadow-sm">
            <CheckCircle className="w-3 h-3" />
            <span>Completed</span>
          </div>
        )}

        {watchedPercent > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
            <div
              className="h-full bg-linear-to-r from-primary to-primary/80 shadow-sm"
              style={{ width: `${watchedPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-card-foreground line-clamp-2 text-base group-hover:text-primary transition-colors duration-300 mb-2">
          {video.title}
        </h3>

        {watchedPercent > 0 && !isCompleted && (
          <div className="text-xs text-primary font-medium mt-2">
            {Math.round(watchedPercent)}% watched
          </div>
        )}
      </div>
    </Link>
  );
}
