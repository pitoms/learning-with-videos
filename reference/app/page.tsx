import { VideoPlayer } from "@/components/video-player"
import { VideoSidebar } from "@/components/video-sidebar"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1920px]">
        <div className="flex flex-col lg:flex-row">
          {/* Video Player Section */}
          <div className="flex-1 lg:sticky lg:top-0 lg:h-screen">
            <VideoPlayer />
          </div>

          {/* Sidebar Section */}
          <VideoSidebar />
        </div>
      </div>
    </main>
  )
}
