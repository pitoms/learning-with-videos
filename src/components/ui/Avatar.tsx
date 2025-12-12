import { type FC } from "react";
import { generateAvatarUrl } from "../../utils/avatar";

interface AvatarProps {
  /** User ID for generating consistent avatar */
  userId: string;
  /** Size of the avatar */
  size?: "sm" | "md" | "lg" | "xl";
  /** Custom className for styling */
  className?: string;
  /** Avatar style from DiceBear */
  avatarStyle?: "avataaars" | "identicon" | "initials" | "bottts" | "pixel-art";
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
} as const;

export const Avatar: FC<AvatarProps> = ({
  userId,
  size = "md",
  className = "",
  avatarStyle = "avataaars",
}) => {
  const avatarUrl = generateAvatarUrl(userId, avatarStyle);

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        rounded-full bg-muted overflow-hidden
        border-2 border-border/50 shadow-sm
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <img
        src={avatarUrl}
        alt={`${userId} avatar`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
