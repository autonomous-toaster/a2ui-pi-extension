/**
 * Image Fetching and Base64 Conversion for A2UI
 * 
 * Handles fetching images from URLs and converting to base64
 * for pi-tui Image component rendering
 */

import https from "https";
import http from "http";

/**
 * Fetch image from URL and convert to base64
 * @param url Image URL (HTTP/HTTPS)
 * @param timeoutMs Timeout in milliseconds (default 5000)
 * @returns Base64 encoded image data
 */
export function fetchImageAsBase64(url: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      reject(new Error(`Image fetch timeout after ${timeoutMs}ms: ${url}`));
    }, timeoutMs);

    protocol
      .get(url, { timeout: timeoutMs }, (res) => {
        let data = Buffer.alloc(0);

        // Check content type
        const contentType = res.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
          clearTimeout(timeout);
          reject(new Error(`Invalid content type: ${contentType}`));
          return;
        }

        res.on("data", (chunk) => {
          if (timedOut) return;
          data = Buffer.concat([data, chunk]);
        });

        res.on("end", () => {
          clearTimeout(timeout);
          if (timedOut) return;
          const base64 = data.toString("base64");
          resolve(base64);
        });
      })
      .on("error", (err) => {
        clearTimeout(timeout);
        if (!timedOut) {
          reject(new Error(`Failed to fetch image: ${err.message}`));
        }
      });
  });
}

/**
 * Get MIME type from URL extension
 * @param url Image URL
 * @returns MIME type (e.g., "image/png")
 */
export function getMimeTypeFromUrl(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
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
 * Cache for fetched images (URL -> base64)
 * Persists within a form session to avoid refetching
 */
const imageCache = new Map<string, Promise<string>>();

/**
 * Fetch image with automatic caching
 * @param url Image URL
 * @returns Promise<base64>
 */
export async function getCachedImage(url: string): Promise<string> {
  if (!imageCache.has(url)) {
    imageCache.set(url, fetchImageAsBase64(url));
  }
  return imageCache.get(url)!;
}

/**
 * Clear image cache (e.g., when form closes)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Convert image URL to base64 with proper error handling
 * @param url Image URL
 * @returns {base64: string, error?: string}
 */
export async function convertImageUrlToBase64(
  url: string
): Promise<{ base64?: string; error?: string }> {
  try {
    const base64 = await getCachedImage(url);
    return { base64 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
