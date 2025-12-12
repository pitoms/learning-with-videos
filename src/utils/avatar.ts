/**
 * Avatar utility functions for generating random user avatars
 */

const AVATAR_STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "identicon",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "notionists-neutral",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
] as const;

type AvatarStyle = (typeof AVATAR_STYLES)[number];

/**
 * Generate a consistent random avatar URL for a given user ID
 * Uses DiceBear API for avatar generation
 */
export function generateAvatarUrl(
  userId: string,
  style: AvatarStyle = "avataaars"
): string {
  // Use user ID as seed for consistent avatars
  const seed = `${userId}-${userId.length}`;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

/**
 * Get a random avatar style for variety
 */
export function getRandomAvatarStyle(): AvatarStyle {
  const randomIndex = Math.floor(Math.random() * AVATAR_STYLES.length);
  return AVATAR_STYLES[randomIndex];
}

/**
 * Generate avatar URL with random style for a user
 */
export function generateRandomAvatarUrl(userId: string): string {
  const style = getRandomAvatarStyle();
  return generateAvatarUrl(userId, style);
}

/**
 * Get user initials from user ID or name
 */
export function getUserInitials(userId: string, maxLength: number = 2): string {
  if (!userId) return "?";

  // Split by common separators and take first letters
  const parts = userId.split(/[\s_-]/);
  const initials = parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .substring(0, maxLength);

  return initials || userId.substring(0, maxLength).toUpperCase();
}
