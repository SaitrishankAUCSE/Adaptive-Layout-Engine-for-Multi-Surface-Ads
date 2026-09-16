// ─── Ad Content Model ────────────────────────────────────────────────────────

export type AdElementType = "image" | "headline" | "subtext" | "cta" | "logo";

export interface FocalPoint {
  x: number; // 0 to 1 (0 = left, 0.5 = center, 1 = right)
  y: number; // 0 to 1 (0 = top, 0.5 = center, 1 = bottom)
}

/**
 * A single element that makes up an ad.
 * Priority controls which elements survive when space is tight:
 *   1 = must remain visible (headline, CTA, hero image)
 *   2 = important but can shrink (logo, subtext)
 *   3 = can be hidden first on constrained surfaces (secondary subtext, details)
 */
export interface AdElement {
  id: string;
  type: AdElementType;
  content: string;       // text content OR image URL
  priority: 1 | 2 | 3;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;  // width / height — for image and logo elements
  flexible?: boolean;    // whether element can shrink/expand dynamically
  focalPoint?: FocalPoint;
}

// ─── Surface Model ────────────────────────────────────────────────────────────

export interface Surface {
  id: string;
  name: string;          // e.g. "Banner", "Square", "MREC", "Interstitial", "Story"
  width: number;         // pixels (real IAB / platform spec values)
  height: number;
  custom?: boolean;      // true if user-added via Custom Surface input
}

// ─── Shape Classification ─────────────────────────────────────────────────────

/** Describes the broad aspect-ratio category of a surface. */
export type SurfaceShape = "WIDE" | "SQUARE" | "TALL";

// ─── Layout Templates ─────────────────────────────────────────────────────────

/** The template variant selected for a surface shape. */
export type LayoutTemplate = "HORIZONTAL" | "CENTERED_STACK" | "VERTICAL_STACK";

// ─── Engine Output ────────────────────────────────────────────────────────────

export type AdaptationReason = "fit" | "shrunk" | "hidden" | "cropped";

/** Where the engine wants a single element placed and how it should look. */
export interface PositionedElement {
  id: string;
  type: AdElementType;
  content: string;
  visible: boolean;       // false = element was dropped due to space constraints
  x: number;             // left offset in pixels (within the surface)
  y: number;             // top offset in pixels
  width: number;
  height: number;
  fontSize?: number;     // only meaningful for text elements
  imageFit?: "cover" | "contain";
  borderRadius?: number;
  focalPoint?: FocalPoint;
  reason?: AdaptationReason;
}

/** The complete result of running the engine for one surface. */
export interface LayoutResult {
  surface: Surface;
  template: LayoutTemplate;
  elements: PositionedElement[];
  /** Number of elements hidden due to space constraints */
  hiddenCount: number;
  /** Human-readable explanation of layout decisions for UI transparency */
  decisions: string[];
}
