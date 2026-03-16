/**
 * Image Component
 * Display image from URL or base64
 * 
 * Terminal (placeholder): "┌──────────────────┐"
 *                        "│   [IMAGE]        │"
 *                        "│   User avatar    │"
 *                        "│   64x64          │"
 *                        "└──────────────────┘"
 * 
 * Strategies:
 *   1. Placeholder (recommended) - simple box
 *   2. Unicode blocks (▒░▓█) - better quality
 *   3. ASCII art - highest quality, needs library
 */

export interface ImageSource {
  type: "url" | "base64";
  url?: string; // for URL source
  data?: string; // for base64 source
}

export interface ImageComponent {
  id: string;
  source: ImageSource;
  size?: "small" | "medium" | "large"; // 32x32, 64x64, 128x128
  alt?: string;
  disabled?: boolean;
}

const SIZES = {
  small: { width: 32, height: 32, label: "32x32" },
  medium: { width: 64, height: 64, label: "64x64" },
  large: { width: 128, height: 128, label: "128x128" },
};

/**
 * Render image as placeholder (recommended for MVP)
 * Simple box with metadata
 */
export function renderImagePlaceholder(
  comp: ImageComponent,
  theme: any
): string[] {
  const size = comp.size || "medium";
  const sizeInfo = SIZES[size];
  const alt = comp.alt || "Image";

  const borderWidth = 20;
  const lines: string[] = [];

  lines.push(theme.fg("dim", "┌" + "─".repeat(borderWidth - 2) + "┐"));
  lines.push(theme.fg("dim", "│   [IMAGE]" + " ".repeat(borderWidth - 13) + "│"));
  lines.push(theme.fg("dim", `│   ${alt.padEnd(borderWidth - 9)}│`));
  lines.push(theme.fg("dim", `│   ${sizeInfo.label.padEnd(borderWidth - 9)}│`));
  lines.push(theme.fg("dim", "└" + "─".repeat(borderWidth - 2) + "┘"));

  return lines;
}

/**
 * Render image as unicode blocks (better quality, no deps)
 * Maps pixel groups to block characters
 */
export function renderImageAsBlocks(
  imageData: Buffer,
  width: number,
  height: number,
  theme: any
): string[] {
  // Simplified: just show placeholder for now
  // Full implementation would convert pixels to blocks
  const blocks = "▐░▒▓█";
  const lines: string[] = [];

  // Create a simple 8x8 block representation
  for (let y = 0; y < Math.min(8, height); y++) {
    let line = "";
    for (let x = 0; x < Math.min(8, width / 2); x++) {
      line += blocks[Math.floor(Math.random() * blocks.length)];
    }
    lines.push(theme.fg("muted", line));
  }

  return lines;
}

/**
 * Render image as ASCII art (highest quality, needs library)
 * For MVP, just return placeholder
 */
export function renderImageAsASCII(
  imageData: Buffer,
  width: number,
  height: number,
  theme: any
): string[] {
  // Full implementation requires image-to-ascii library
  // For now, return placeholder
  return [theme.fg("dim", "[ASCII art would be rendered here]")];
}

/**
 * Main render function - chooses strategy
 * For MVP: always use placeholder (simple, reliable, no deps)
 */
export function renderImage(comp: ImageComponent, theme: any): string[] {
  // MVP strategy: placeholder only
  // Can extend later with unicode blocks or ASCII art
  return renderImagePlaceholder(comp, theme);
}

/**
 * Fetch image from URL and convert to base64
 * Note: This would need to be async and cached
 */
export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // In browser: fetch + blob + FileReader
    // In Node.js: https module + Buffer
    // For now, return null (use placeholder as fallback)
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * GitHub avatar URL builder with size parameter
 */
export function buildGitHubAvatarUrl(userId: number | string, size: 32 | 64 | 128 = 64): string {
  return `https://avatars.githubusercontent.com/u/${userId}?v=4&size=${size}`;
}
