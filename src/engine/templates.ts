import type {
  AdElement,
  Surface,
  LayoutTemplate,
  PositionedElement,
} from "./types";
import {
  PAD,
  headlineFontSize,
  subtextFontSize,
  ctaFontSize,
  logoFontSize,
  innerWidth,
  innerHeight,
} from "./scale";

/**
 * HORIZONTAL template — for WIDE surfaces (banners).
 *
 * Layout:
 * ┌───────┬────────────────────────────┬────────┐
 * │ image │  logo  headline  subtext   │  CTA  │
 * └───────┴────────────────────────────┴────────┘
 */
export function horizontalTemplate(
  elements: AdElement[],
  surface: Surface
): { template: LayoutTemplate; positioned: PositionedElement[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];

  // Slot proportions
  const imageW = Math.round(ih * 1.0); // square-ish image on left
  const ctaW = Math.round(Math.max(iw * 0.18, 60));
  const textW = iw - imageW - ctaW - PAD * 2;

  const byType = byTypeMap(elements);

  // ── Image (left slot) ──────────────────────────────────────────────
  const imageEl = byType.get("image");
  positioned.push(
    place(imageEl, {
      x: PAD,
      y: PAD,
      w: imageEl ? imageW : 0,
      h: ih,
      surface,
      imageFit: "cover",
    })
  );

  const textX = PAD + (imageEl ? imageW + PAD : 0);

  // ── Logo ────────────────────────────────────────────────────────────
  const logoEl = byType.get("logo");
  const logoH = logoEl ? Math.round(ih * 0.35) : 0;
  positioned.push(
    place(logoEl, {
      x: textX,
      y: PAD,
      w: logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0,
      h: logoH,
      surface,
      imageFit: "contain",
    })
  );

  // ── Headline ────────────────────────────────────────────────────────
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const hlH = Math.round(hlFontSize * 1.3);
  positioned.push(
    place(hlEl, {
      x: textX,
      y: PAD + logoH,
      w: textW,
      h: hlH,
      fontSize: hlFontSize,
      surface,
    })
  );

  // ── Subtext ─────────────────────────────────────────────────────────
  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stH = Math.round(stFontSize * 1.3);
  const stY = PAD + logoH + hlH + 2;
  // Only show if it fits vertically
  const stFits = stY + stH <= surface.height - PAD;
  positioned.push(
    place(stEl, {
      x: textX,
      y: stY,
      w: textW,
      h: stH,
      fontSize: stFontSize,
      surface,
      forceHide: !stFits,
    })
  );

  // ── CTA (right slot) ────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaH = Math.min(Math.round(ih * 0.65), 48);
  positioned.push(
    place(ctaEl, {
      x: surface.width - PAD - ctaW,
      y: PAD + Math.round((ih - ctaH) / 2),
      w: ctaW,
      h: ctaH,
      fontSize: ctaFontSize(surface),
      borderRadius: 6,
      surface,
    })
  );

  return { template: "HORIZONTAL", positioned };
}

/**
 * CENTERED_STACK template — for SQUARE surfaces (MREC, Square).
 *
 * Layout (top to bottom):
 *   [image — top ~50%]
 *   [logo row]
 *   [headline]
 *   [subtext]
 *   [CTA button — centered]
 */
export function centeredStackTemplate(
  elements: AdElement[],
  surface: Surface
): { template: LayoutTemplate; positioned: PositionedElement[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];
  const byType = byTypeMap(elements);

  let cursor = PAD;

  // ── Image ────────────────────────────────────────────────────────────
  const imageEl = byType.get("image");
  const imageH = Math.round(ih * 0.42);
  positioned.push(
    place(imageEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: imageH,
      surface,
      imageFit: "cover",
      borderRadius: 6,
    })
  );
  if (imageEl) cursor += imageH + PAD;

  // ── Logo ─────────────────────────────────────────────────────────────
  const logoEl = byType.get("logo");
  const logoH = Math.round(logoFontSize(surface) * 1.8);
  const logoW = logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0;
  positioned.push(
    place(logoEl, {
      x: PAD,
      y: cursor,
      w: logoW,
      h: logoH,
      surface,
      imageFit: "contain",
    })
  );
  if (logoEl) cursor += logoH + 4;

  // ── Headline ──────────────────────────────────────────────────────────
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const hlH = Math.round(hlFontSize * 1.35 * 2); // allow 2 lines
  positioned.push(
    place(hlEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: hlH,
      fontSize: hlFontSize,
      surface,
    })
  );
  if (hlEl) cursor += hlH + 4;

  // ── Subtext ───────────────────────────────────────────────────────────
  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stH = Math.round(stFontSize * 1.35);
  const stFits = cursor + stH + 40 <= surface.height - PAD; // 40 = CTA
  positioned.push(
    place(stEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: stH,
      fontSize: stFontSize,
      surface,
      forceHide: !stFits,
    })
  );
  if (stEl && stFits) cursor += stH + 6;

  // ── CTA ───────────────────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaFSize = ctaFontSize(surface);
  const ctaH = Math.round(ctaFSize * 2.2);
  const ctaW = Math.min(iw, Math.round(iw * 0.75));
  const ctaX = PAD + Math.round((iw - ctaW) / 2);
  const remaining = surface.height - PAD - cursor;
  const ctaY =
    remaining >= ctaH + 4
      ? cursor + Math.round((remaining - ctaH) / 2)
      : cursor;
  positioned.push(
    place(ctaEl, {
      x: ctaX,
      y: ctaY,
      w: ctaW,
      h: ctaH,
      fontSize: ctaFSize,
      borderRadius: Math.round(ctaH / 2),
      surface,
    })
  );

  return { template: "CENTERED_STACK", positioned };
}

/**
 * VERTICAL_STACK template — for TALL surfaces (Story, Interstitial).
 *
 * Layout (top to bottom):
 *   [large image — top ~50%]
 *   [logo + headline side by side or stacked]
 *   [subtext]
 *   [big CTA button]
 */
export function verticalStackTemplate(
  elements: AdElement[],
  surface: Surface
): { template: LayoutTemplate; positioned: PositionedElement[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];
  const byType = byTypeMap(elements);

  let cursor = PAD;

  // ── Image ─────────────────────────────────────────────────────────────
  const imageEl = byType.get("image");
  const imageH = Math.round(ih * 0.48);
  positioned.push(
    place(imageEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: imageH,
      surface,
      imageFit: "cover",
      borderRadius: 12,
    })
  );
  if (imageEl) cursor += imageH + PAD;

  // ── Logo ──────────────────────────────────────────────────────────────
  const logoEl = byType.get("logo");
  const logoH = Math.round(logoFontSize(surface) * 2);
  const logoW = logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0;
  positioned.push(
    place(logoEl, {
      x: PAD,
      y: cursor,
      w: logoW,
      h: logoH,
      surface,
      imageFit: "contain",
    })
  );
  if (logoEl) cursor += logoH + PAD * 0.5;

  // ── Headline ──────────────────────────────────────────────────────────
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const hlH = Math.round(hlFontSize * 1.3 * 3); // allow 3 lines on tall surfaces
  positioned.push(
    place(hlEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: hlH,
      fontSize: hlFontSize,
      surface,
    })
  );
  if (hlEl) cursor += hlH + PAD * 0.5;

  // ── Subtext ───────────────────────────────────────────────────────────
  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stH = Math.round(stFontSize * 1.4 * 2); // 2 lines
  const ctaH = Math.round(ctaFontSize(surface) * 2.5);
  const stFits = cursor + stH + ctaH + PAD * 2 <= surface.height - PAD;
  positioned.push(
    place(stEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: stH,
      fontSize: stFontSize,
      surface,
      forceHide: !stFits,
    })
  );
  if (stEl && stFits) cursor += stH + PAD;

  // ── CTA ───────────────────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaFSize = ctaFontSize(surface);
  const ctaW = iw;
  const remaining = surface.height - PAD - cursor;
  const ctaY = remaining >= ctaH ? cursor + Math.round((remaining - ctaH) / 2) : cursor;
  positioned.push(
    place(ctaEl, {
      x: PAD,
      y: ctaY,
      w: ctaW,
      h: ctaH,
      fontSize: ctaFSize,
      borderRadius: Math.round(ctaH / 2),
      surface,
    })
  );

  return { template: "VERTICAL_STACK", positioned };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Map<type, AdElement> for O(1) lookups. */
function byTypeMap(elements: AdElement[]): Map<string, AdElement> {
  const m = new Map<string, AdElement>();
  for (const el of elements) {
    if (!el.content || el.content.trim() === "") continue;
    if (!m.has(el.type)) m.set(el.type, el);
  }
  return m;
}

interface PlaceOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  surface: Surface;
  fontSize?: number;
  imageFit?: "cover" | "contain";
  borderRadius?: number;
  forceHide?: boolean;
}

/** Build a PositionedElement. If `el` is undefined, produces a hidden placeholder. */
function place(
  el: AdElement | undefined,
  opts: PlaceOpts
): PositionedElement {
  return {
    id: el?.id ?? `__placeholder_${opts.x}_${opts.y}`,
    type: el?.type ?? "headline",
    content: el?.content ?? "",
    visible: !!el && !opts.forceHide,
    x: opts.x,
    y: opts.y,
    width: opts.w,
    height: opts.h,
    fontSize: opts.fontSize,
    imageFit: opts.imageFit,
    borderRadius: opts.borderRadius,
  };
}
