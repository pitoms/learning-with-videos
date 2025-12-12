import type { Video } from "../../types";
import { VideoCard } from "./VideoCard";
import { Film } from "lucide-react";
import { Link } from "react-router-dom";

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No videos yet
        </h3>
        <p className="text-muted-foreground mb-6">
          Be the first to upload an educational video!
        </p>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow"
        >
          Upload Your First Video
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map(
        (video) => video.video_url && <VideoCard key={video.id} video={video} />
      )}
    </div>
  );
}
