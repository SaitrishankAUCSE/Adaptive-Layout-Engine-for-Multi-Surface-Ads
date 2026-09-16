// ─── Ad Content Model ────────────────────────────────────────────────────────

export type AdElementType = "image" | "headline" | "subtext" | "cta" | "logo";

/**
 * A single element that makes up an ad.
 * Priority controls which elements survive when space is tight:
 *   1 = always visible (headline, CTA)
 *   2 = visible unless space is very tight (subtext, logo)
 *   3 = dropped first on small surfaces (decorative image overlays, taglines)
 */
export interface AdElement {
  id: string;
  type: AdElementType;
  content: string;       // text content OR image URL
  priority: 1 | 2 | 3;
  aspectRatio?: number;  // width / height — for image and logo elements
}

// ─── Surface Model ────────────────────────────────────────────────────────────

export interface Surface {
  id: string;
  name: string;          // e.g. "Leaderboard", "Story"
  width: number;         // pixels (real IAB spec values)
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
}

/** The complete result of running the engine for one surface. */
export interface LayoutResult {
  surface: Surface;
  template: LayoutTemplate;
  elements: PositionedElement[];
  /** Number of elements hidden due to space constraints */
  hiddenCount: number;
}
