import type { Surface, SurfaceShape } from "./types";

/**
 * Classify a surface into a broad shape category based on its aspect ratio.
 *
 * AR = width / height
 *   WIDE   → AR >= 2.2  (Banner 728×90 → AR≈8.09, Custom 500×150 → AR≈3.33)
 *   TALL   → AR <= 0.75 (Story 1080×1920 → AR≈0.56, Interstitial 320×480 → AR≈0.67)
 *   SQUARE → 0.75 < AR < 2.2 (Square 300×300 → AR=1.0, MREC 300×250 → AR=1.2)
 */
export function classifySurface(surface: Surface): SurfaceShape {
  const ar = surface.width / surface.height;
  if (ar >= 2.2) return "WIDE";
  if (ar <= 0.75) return "TALL";
  return "SQUARE";
}
