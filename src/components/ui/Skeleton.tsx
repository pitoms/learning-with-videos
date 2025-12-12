interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

const variantStyles = {
  default: "rounded-md",
  text: "rounded-sm",
  circular: "rounded-full",
  rectangular: "rounded-none",
};

const animationStyles = {
  pulse: "animate-pulse",
  wave: "animate-shimmer",
  none: "",
};

export function Skeleton({
  variant = "default",
  animation = "pulse",
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-muted
        ${variantStyles[variant]}
        ${animationStyles[animation]}
        ${className}
      `}
      {...props}
    />
  );
}
