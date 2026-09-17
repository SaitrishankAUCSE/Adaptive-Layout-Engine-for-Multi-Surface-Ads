import type { PositionedElement } from "./types";

let canvasCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document !== "undefined") {
    if (!canvasCtx) {
      const canvas = document.createElement("canvas");
      canvasCtx = canvas.getContext("2d");
    }
    return canvasCtx;
  }
  return null;
}

function measureTextWidth(text: string, fontSize: number, fontWeight: number = 400): number {
  const ctx = getMeasureContext();
  if (ctx) {
    ctx.font = `${fontWeight} ${fontSize}px 'Inter', sans-serif`;
    return ctx.measureText(text).width;
  }
  // Geometric font ratio fallback (tuned for Inter)
  const ratio = fontWeight >= 700 ? 0.58 : 0.50;
  return text.length * fontSize * ratio;
}

/**
 * Accurately determines if an element's text is fully visible without
 * any word, letter, or line being cut off, truncated, or clamped.
 *
 * If even a single word is cut off, returns false so the visibility count
 * decreases truthfully (e.g. from 5/5 to 4/5 or 3/5).
 */
export function isElementFullyFitted(el: PositionedElement): boolean {
  if (!el.visible || !el.content || !el.content.trim()) return false;
  if (el.width <= 0 || el.height <= 0) return false;

  // Visual assets (images & logos) don't have typography truncation
  if (el.type === "image" || el.type === "logo") {
    return true;
  }

  const text = el.content.trim();
  const fontSize = el.fontSize ?? (el.type === "headline" ? 20 : el.type === "cta" ? 14 : 12);

  // ── Call to Action Button ──────────────────────────────────────────────
  if (el.type === "cta") {
    // Button has horizontal padding of 12px on each side (24px total)
    const availWidth = el.width - 24;
    if (availWidth <= 0) return false;

    const textWidth = measureTextWidth(text, fontSize, 700);
    // If text exceeds button's inner width, it is clipped with ellipsis
    return textWidth <= availWidth + 2;
  }

  // ── Headline ───────────────────────────────────────────────────────────
  if (el.type === "headline") {
    // Headline: font weight 800, line-height 1.15, max clamp 3 lines
    const lineHeight = fontSize * 1.15;
    const maxLinesByHeight = Math.floor((el.height + 2) / lineHeight);
    const maxAllowedLines = Math.min(3, maxLinesByHeight);
    if (maxAllowedLines < 1) return false;

    const words = text.split(/\s+/).filter(Boolean);
    const spaceWidth = measureTextWidth(" ", fontSize, 800);
    let linesCount = 1;
    let currentLineWidth = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWidth = measureTextWidth(word, fontSize, 800);

      // If a single word is wider than the container, it gets cut off
      if (wordWidth > el.width + 2) {
        return false;
      }

      if (currentLineWidth === 0) {
        currentLineWidth = wordWidth;
      } else if (currentLineWidth + spaceWidth + wordWidth <= el.width + 2) {
        currentLineWidth += spaceWidth + wordWidth;
      } else {
        linesCount++;
        currentLineWidth = wordWidth;
        if (linesCount > maxAllowedLines) {
          // Additional words overflow the allocated box and are cut off!
          return false;
        }
      }
    }

    return linesCount <= maxAllowedLines;
  }

  // ── Subtext / Description ──────────────────────────────────────────────
  if (el.type === "subtext") {
    // Subtext: font weight 400, line-height 1.35, max clamp 3 lines
    const lineHeight = fontSize * 1.35;
    const maxLinesByHeight = Math.floor((el.height + 2) / lineHeight);
    const maxAllowedLines = Math.min(3, maxLinesByHeight);
    if (maxAllowedLines < 1) return false;

    const words = text.split(/\s+/).filter(Boolean);
    const spaceWidth = measureTextWidth(" ", fontSize, 400);
    let linesCount = 1;
    let currentLineWidth = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWidth = measureTextWidth(word, fontSize, 400);

      if (wordWidth > el.width + 2) {
        return false;
      }

      if (currentLineWidth === 0) {
        currentLineWidth = wordWidth;
      } else if (currentLineWidth + spaceWidth + wordWidth <= el.width + 2) {
        currentLineWidth += spaceWidth + wordWidth;
      } else {
        linesCount++;
        currentLineWidth = wordWidth;
        if (linesCount > maxAllowedLines) {
          return false;
        }
      }
    }

    return linesCount <= maxAllowedLines;
  }

  return true;
}
