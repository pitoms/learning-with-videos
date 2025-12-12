import { Skeleton } from "../ui";

export function VideoCardSkeleton() {
  return (
    <div className="bg-card rounded-md overflow-hidden shadow-sm border border-border">
      <Skeleton className="aspect-video w-full" variant="rectangular" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-2/3" variant="text" />
        <Skeleton className="h-3 w-1/4 mt-2" variant="text" />
      </div>
    </div>
  );
}
