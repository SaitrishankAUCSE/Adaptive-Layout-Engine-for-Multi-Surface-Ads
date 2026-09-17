import type { Surface } from "./types";

const PAD = 8; // universal inner padding (px)

/**
 * Font size calculators — all return pixel values for the real surface size.
 * AdPreview will scale the rendered output to a thumbnail if needed.
 */

export function headlineFontSize(s: Surface): number {
  const ar = s.width / s.height;
  if (ar >= 2.2) {
    // WIDE banner: height is the constraining dimension
    return clamp(Math.round(s.height * 0.22), 11, 38);
  }
  if (ar <= 0.75) {
    // TALL display/story: width is the typographic constraint
    return clamp(Math.round(s.width * 0.085), 18, 64);
  }
  // SQUARE / Standard: balance both width and height
  return clamp(Math.round(Math.min(s.width * 0.08, s.height * 0.10)), 15, 54);
}

export function subtextFontSize(s: Surface): number {
  const base = headlineFontSize(s);
  return clamp(Math.round(base * 0.54), 11, 28);
}

export function ctaFontSize(s: Surface): number {
  const base = headlineFontSize(s);
  return clamp(Math.round(base * 0.64), 11, 30);
}

export function logoFontSize(s: Surface): number {
  const ar = s.width / s.height;
  if (ar >= 2.2) {
    return clamp(Math.round(s.height * 0.32), 14, 42);
  }
  return clamp(Math.round(Math.min(s.width * 0.10, s.height * 0.06)), 16, 48);
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
