import { useState } from "react";
import { Search } from "lucide-react";
import { useVideos } from "../hooks";
import { VideoGrid } from "../components/video";
import { VideoCardSkeleton } from "../components/video";
import { ErrorMessage } from "../components/ui";
import { Hero } from "../components/hero";
import { DEFAULT_USER_ID } from "../constants";
import { isValidVideoUrl } from "../utils";

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: videos = [],
    isLoading,
    error,
    refetch,
  } = useVideos(DEFAULT_USER_ID);

  // Filter out invalid URLs and apply search query
  const filteredVideos = videos
    .filter((video) => isValidVideoUrl(video.video_url))
    .filter(
      (video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="animate-in">
      <Hero />
      <div className="py-12 bg-linear-to-b from-background via-background to-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 text-lg rounded-xl border border-input bg-background/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {filteredVideos.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Video{filteredVideos.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <VideoCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage
            message="Failed to load videos. Please try again."
            onRetry={() => refetch()}
          />
        ) : (
          <VideoGrid videos={filteredVideos} />
        )}
      </div>
    </div>
  );
}
