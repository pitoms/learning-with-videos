/**
 * Application constants
 */

/** Default user ID for creating videos (use snake_case first_last format) */
export const DEFAULT_USER_ID = "pitom_saha1";

/** Available playback speed options */
export const PLAYBACK_SPEEDS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
] as const;

/** Volume step for keyboard controls */
export const VOLUME_STEP = 0.1;

/** Seek step in seconds for keyboard controls */
export const SEEK_STEP = 10;

/** Color palette */
export const COLORS = {
  onyx: "#000f08",
  jetBlack: "#1c3738",
  coolSky: "#65afff",
  mintCream: "#f4fff8",
  cloudySky: "#5899e2",
} as const;
