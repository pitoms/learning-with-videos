import { Skeleton } from "../ui";

export function VideoPageSkeleton() {
  return (
    <div className="min-h-screen bg-background lg:h-full lg:overflow-hidden">
      <div className="mx-auto max-w-[2400px] lg:h-full">
        <div className="flex flex-col lg:flex-row lg:h-full">
          <div className="flex-1 lg:min-w-0 lg:overflow-y-auto">
            {/* Header skeleton */}
            <div className="p-3 lg:p-4 border-b border-border bg-card">
              <Skeleton className="h-6 w-32" variant="text" />
            </div>

            {/* Video player skeleton */}
            <div className="bg-black">
              <Skeleton className="aspect-video w-full" variant="rectangular" />
            </div>

            {/* Mobile sidebar skeleton */}
            <div className="lg:hidden p-4 space-y-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" variant="text" />
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-2/3" variant="text" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" variant="default" />
                <Skeleton className="h-20 w-full" variant="default" />
              </div>
            </div>

            {/* Comment section skeleton */}
            <div className="p-4 lg:p-6 bg-card border-t border-border space-y-4">
              <Skeleton className="h-6 w-1/4" variant="text" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton
                      className="w-8 h-8 rounded-full"
                      variant="circular"
                    />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" variant="text" />
                      <Skeleton className="h-4 w-full" variant="text" />
                      <Skeleton className="h-4 w-3/4" variant="text" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop sidebar skeleton */}
          <div className="hidden lg:block w-80 border-l border-border bg-card p-4">
            <div className="space-y-6">
              {/* Video info skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" variant="text" />
                <Skeleton className="h-4 w-full" variant="text" />
                <Skeleton className="h-4 w-2/3" variant="text" />
              </div>

              {/* Notes section skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/3" variant="text" />
                <Skeleton className="h-10 w-full" variant="default" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-muted rounded-md">
                      <Skeleton className="h-4 w-full mb-2" variant="text" />
                      <Skeleton className="h-3 w-2/3" variant="text" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
