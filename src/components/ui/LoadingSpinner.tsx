import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={label || "Loading"}
    >
      <Loader2 className={`animate-spin text-primary ${sizeMap[size]}`} />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
}
