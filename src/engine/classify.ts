import type { Surface, SurfaceShape } from "./types";

/**
 * Classify a surface into a broad shape category based on its aspect ratio.
 *
 * Thresholds chosen to match real IAB ad behaviour:
 *   WIDE   → AR > 2.2  (Leaderboard 728×90 → AR≈8.1, Wide Skyscraper 160×600 → AR≈0.27 — see TALL)
 *   SQUARE → 0.65 ≤ AR ≤ 2.2  (MREC 300×250 → AR=1.2, Square 300×300 → AR=1)
 *   TALL   → AR < 0.65  (Story 1080×1920 → AR≈0.56, Interstitial 320×480 → AR≈0.67 — borderline SQUARE)
 */
export function classifySurface(surface: Surface): SurfaceShape {
  const ar = surface.width / surface.height;
  if (ar > 2.2) return "WIDE";
  if (ar < 0.65) return "TALL";
  return "SQUARE";
}
