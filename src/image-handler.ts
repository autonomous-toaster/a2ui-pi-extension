/**
 * Image Handling Implementation Guide
 * 
 * This module handles fetching and processing images for A2UI forms
 */

import https from "https";
import http from "http";

/**
 * Fetch image from URL and convert to base64
 * @param url Image URL (HTTP/HTTPS)
 * @returns Base64 encoded image data
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, { timeout: 5000 }, (res) => {
        let data = Buffer.alloc(0);

        // Check content type
        const contentType = res.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          reject(new Error(`Invalid content type: ${contentType}`));
          return;
        }

        res.on("data", (chunk) => {
          data = Buffer.concat([data, chunk]);
        });

        res.on("end", () => {
          const base64 = data.toString("base64");
          resolve(base64);
        });
      })
      .on("error", (err) => {
        reject(new Error(`Failed to fetch image: ${err.message}`));
      });
  });
}

/**
 * Get MIME type from URL extension
 * @param url Image URL
 * @returns MIME type (e.g., "image/png")
 */
export function getMimeTypeFromUrl(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext] || "image/png";
}

/**
 * Check if base64 string is valid image data
 * @param base64 Base64 encoded data
 * @param mimeType MIME type
 * @returns true if valid image data
 */
export function isValidBase64Image(base64: string, mimeType: string): boolean {
  if (!base64 || base64.length === 0) return false;

  // Check if it looks like base64
  if (!/^[A-Za-z0-9+/=]*$/.test(base64)) return false;

  // Check magic bytes for common formats
  const buffer = Buffer.from(base64, "base64");
  const magicBytes = buffer.slice(0, 8);

  if (mimeType === "image/png") {
    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    return (
      magicBytes[0] === 0x89 &&
      magicBytes[1] === 0x50 &&
      magicBytes[2] === 0x4e &&
      magicBytes[3] === 0x47
    );
  }

  if (mimeType === "image/jpeg") {
    // JPEG magic: FF D8 FF
    return magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff;
  }

  if (mimeType === "image/gif") {
    // GIF magic: 47 49 46
    return (
      magicBytes[0] === 0x47 &&
      magicBytes[1] === 0x49 &&
      magicBytes[2] === 0x46
    );
  }

  // WebP magic: 52 49 46 46 ... 57 45 42 50
  if (mimeType === "image/webp") {
    return (
      magicBytes[0] === 0x52 &&
      magicBytes[1] === 0x49 &&
      magicBytes[2] === 0x46 &&
      magicBytes[3] === 0x46
    );
  }

  return true; // Unknown format, assume valid
}

/**
 * Process image source (URL or base64)
 * @param source Image source object
 * @returns Promise<{base64: string, mimeType: string}>
 */
export async function processImageSource(source: {
  type: "url" | "base64";
  url?: string;
  data?: string;
}): Promise<{ base64: string; mimeType: string }> {
  if (source.type === "base64" && source.data) {
    const mimeType = "image/png"; // Assume PNG if not specified
    return { base64: source.data, mimeType };
  }

  if (source.type === "url" && source.url) {
    const mimeType = getMimeTypeFromUrl(source.url);
    const base64 = await fetchImageAsBase64(source.url);
    return { base64, mimeType };
  }

  throw new Error("Invalid image source");
}

/**
 * Example usage in A2UI adapter:
 * 
 * async function renderImageComponent(comp: ImageComponent, ctx: any) {
 *   try {
 *     const { base64, mimeType } = await processImageSource(comp.source);
 *     
 *     // Create pi-tui Image component
 *     const imageComp = new Image(base64, mimeType, ctx.ui.theme, {
 *       maxWidthCells: 40,
 *       maxHeightCells: 20,
 *     });
 *     
 *     return imageComp;
 *   } catch (err) {
 *     // Fallback: show placeholder
 *     return new Text(`[Image: ${comp.alt || 'image'}]`, { color: 'dim' });
 *   }
 * }
 */
