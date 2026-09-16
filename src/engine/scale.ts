import type { Surface } from "./types";

const PAD = 8; // universal inner padding (px)

/**
 * Font size calculators — all return pixel values for the real surface size.
 * AdPreview will scale the rendered output to a thumbnail if needed.
 */

export function headlineFontSize(s: Surface): number {
  // Clamp between 10px (tiny banner) and 80px (full-page story)
  return clamp(s.height * 0.09, 10, 80);
}

export function subtextFontSize(s: Surface): number {
  return clamp(headlineFontSize(s) * 0.58, 8, 48);
}

export function ctaFontSize(s: Surface): number {
  return clamp(headlineFontSize(s) * 0.7, 8, 52);
}

export function logoFontSize(s: Surface): number {
  return clamp(s.height * 0.06, 7, 36);
}

/**
 * Available inner width / height after stripping padding.
 */
export function innerWidth(s: Surface): number {
  return s.width - PAD * 2;
}

export function innerHeight(s: Surface): number {
  return s.height - PAD * 2;
}

export { PAD };

// ─── helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
