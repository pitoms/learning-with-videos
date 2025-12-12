import { type FC, useState, useRef, useCallback, useEffect } from "react";
import { Play, BookOpen, Users } from "lucide-react";

const SUBJECTS = ["anything", "physics", "math", "coding", "cooking"] as const;

export const Hero: FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const hoverRef = useRef<HTMLSpanElement>(null);

  const clearCycling = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setCurrentIndex(0);
    }
  }, []);

  const startCycling = useCallback(() => {
    if (intervalRef.current !== null) return;
    setCurrentIndex(1);
    intervalRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev >= SUBJECTS.length - 1 ? 1 : prev + 1));
    }, 1200);
  }, []);

  useEffect(() => {
    const el = hoverRef.current;
    if (!el) return;
    const handlePointerEnter = () => startCycling();
    const handlePointerLeave = () => clearCycling();
    el.addEventListener("pointerenter", handlePointerEnter);
    el.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", clearCycling);
    window.addEventListener("blur", clearCycling);
    return () => {
      clearCycling();
      el.removeEventListener("pointerenter", handlePointerEnter);
      el.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", clearCycling);
      window.removeEventListener("blur", clearCycling);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 w-screen bg-linear-to-br from-primary/5 via-background to-secondary/5 -left-[50vw]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <div className="relative text-center py-20 md:py-28 lg:py-36">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Play className="w-4 h-4" />
            ............................................................................................................
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
            The best place to
            <span className="block text-primary">
              learn{" "}
              <span
                ref={hoverRef}
                className="inline-block cursor-pointer transition-all duration-300"
              >
                <span
                  key={currentIndex}
                  className="inline-block animate-text-swap"
                >
                  {SUBJECTS[currentIndex]}
                </span>
              </span>
            </span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Expert Content</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Community Learning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
