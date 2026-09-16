import type {
  AdElement,
  Surface,
  LayoutTemplate,
  PositionedElement,
  AdaptationReason,
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
): { template: LayoutTemplate; positioned: PositionedElement[]; decisions: string[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];
  const decisions: string[] = ["Horizontal layout (aspect ratio >= 2.2)"];

  // Slot proportions
  const imageW = Math.round(ih * 1.0); // square-ish image on left
  const ctaW = Math.round(Math.max(iw * 0.18, 60));
  const textW = iw - imageW - ctaW - PAD * 2;

  const byType = byTypeMap(elements);

  // ── Image (left slot) ──────────────────────────────────────────────
  const imageEl = byType.get("image");
  if (imageEl) {
    decisions.push("Image cropped with cover fit in left slot");
  }
  positioned.push(
    place(imageEl, {
      x: PAD,
      y: PAD,
      w: imageEl ? imageW : 0,
      h: ih,
      surface,
      imageFit: "cover",
      reason: imageEl ? "cropped" : "hidden",
    })
  );

  const textX = PAD + (imageEl ? imageW + PAD : 0);

  // ── Logo ────────────────────────────────────────────────────────────
  const logoEl = byType.get("logo");
  const logoH = logoEl ? Math.round(ih * 0.35) : 0;
  if (logoEl) {
    decisions.push("Logo positioned at top of text block");
  }
  positioned.push(
    place(logoEl, {
      x: textX,
      y: PAD,
      w: logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0,
      h: logoH,
      surface,
      imageFit: "contain",
      reason: logoEl ? "fit" : "hidden",
    })
  );

  // ── Headline ────────────────────────────────────────────────────────
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const isLongHeadline = (hlEl?.content.length ?? 0) > 40;
  const hlLines = isLongHeadline ? 2 : 1;
  const hlH = Math.round(hlFontSize * 1.25 * hlLines);
  if (hlEl) {
    if (isLongHeadline) {
      decisions.push(`Headline multi-line wrapped (scaled to ${hlFontSize}px)`);
    } else {
      decisions.push(`Headline reduced to ${hlFontSize}px`);
    }
  }
  positioned.push(
    place(hlEl, {
      x: textX,
      y: PAD + logoH,
      w: textW,
      h: hlH,
      fontSize: hlFontSize,
      surface,
      reason: hlFontSize < 24 ? "shrunk" : "fit",
    })
  );

  // ── Subtext ─────────────────────────────────────────────────────────
  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stH = Math.round(stFontSize * 1.3);
  const stY = PAD + logoH + hlH + 2;
  // Subtext only fits if it doesn't collide vertically and headline didn't take up space
  const stFits = !isLongHeadline && stY + stH <= surface.height - PAD;
  if (stEl) {
    if (stFits) {
      decisions.push(`Description fitted at ${stFontSize}px`);
    } else {
      decisions.push("Description hidden (space constrained by headline/height)");
    }
  }
  positioned.push(
    place(stEl, {
      x: textX,
      y: stY,
      w: textW,
      h: stH,
      fontSize: stFontSize,
      surface,
      forceHide: !stFits,
      reason: !stFits ? "hidden" : "shrunk",
    })
  );

  // ── CTA (right slot) ────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaH = Math.min(Math.round(ih * 0.65), 48);
  const ctaY = Math.min(surface.height - PAD - ctaH, Math.max(PAD, PAD + Math.round((ih - ctaH) / 2)));
  if (ctaEl) {
    decisions.push("CTA preserved (priority 1)");
  }
  positioned.push(
    place(ctaEl, {
      x: surface.width - PAD - ctaW,
      y: ctaY,
      w: ctaW,
      h: ctaH,
      fontSize: ctaFontSize(surface),
      borderRadius: 6,
      surface,
      reason: "fit",
    })
  );

  return { template: "HORIZONTAL", positioned, decisions };
}

/**
 * CENTERED_STACK template — for SQUARE surfaces (MREC, Square).
 *
 * Layout (top to bottom):
 *   [image — top ~42%]
 *   [logo row]
 *   [headline]
 *   [subtext]
 *   [CTA button — centered]
 */
export function centeredStackTemplate(
  elements: AdElement[],
  surface: Surface
): { template: LayoutTemplate; positioned: PositionedElement[]; decisions: string[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];
  const decisions: string[] = ["Balanced stacked layout (aspect ratio between 0.75 and 2.2)"];
  const byType = byTypeMap(elements);

  let cursor = PAD;

  // ── Image ────────────────────────────────────────────────────────────
  const imageEl = byType.get("image");
  const imageH = Math.min(Math.round(ih * 0.40), Math.max(40, surface.height - 180));
  if (imageEl) {
    decisions.push("Image allocated top section with cover fit");
  }
  positioned.push(
    place(imageEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: imageH,
      surface,
      imageFit: "cover",
      borderRadius: 6,
      reason: imageEl ? "cropped" : "hidden",
    })
  );
  if (imageEl) cursor += imageH + PAD;

  // ── Logo ─────────────────────────────────────────────────────────────
  const logoEl = byType.get("logo");
  const logoH = Math.round(logoFontSize(surface) * 1.6);
  const logoW = logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0;
  if (logoEl) {
    decisions.push("Logo placed above typography");
  }
  positioned.push(
    place(logoEl, {
      x: PAD,
      y: cursor,
      w: logoW,
      h: logoH,
      surface,
      imageFit: "contain",
      reason: logoEl ? "fit" : "hidden",
    })
  );
  if (logoEl) cursor += logoH + 4;

  // ── Headline ──────────────────────────────────────────────────────────
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const hlH = Math.round(hlFontSize * 1.3 * 2); // allow 2 lines
  if (hlEl) {
    decisions.push(`Headline scaled to ${hlFontSize}px (2-line capacity)`);
  }
  positioned.push(
    place(hlEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: hlH,
      fontSize: hlFontSize,
      surface,
      reason: hlFontSize < 28 ? "shrunk" : "fit",
    })
  );
  if (hlEl) cursor += hlH + 4;

  // ── Subtext ───────────────────────────────────────────────────────────
  const ctaFSize = ctaFontSize(surface);
  const ctaH = Math.min(Math.round(ctaFSize * 2.2), 46);
  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stH = Math.round(stFontSize * 1.3);
  const stFits = cursor + stH + ctaH + PAD <= surface.height - PAD;
  if (stEl) {
    if (stFits) {
      decisions.push("Description accommodated below headline");
    } else {
      decisions.push("Description hidden to preserve CTA clearance");
    }
  }
  positioned.push(
    place(stEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: stH,
      fontSize: stFontSize,
      surface,
      forceHide: !stFits,
      reason: !stFits ? "hidden" : "shrunk",
    })
  );
  if (stEl && stFits) cursor += stH + 6;

  // ── CTA ───────────────────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaW = Math.min(iw, Math.round(iw * 0.75));
  const ctaX = PAD + Math.round((iw - ctaW) / 2);
  const ctaY = Math.min(surface.height - PAD - ctaH, Math.max(PAD, cursor));
  if (ctaEl) {
    decisions.push("CTA centered at base with full visibility");
  }
  positioned.push(
    place(ctaEl, {
      x: ctaX,
      y: ctaY,
      w: ctaW,
      h: ctaH,
      fontSize: ctaFSize,
      borderRadius: Math.round(ctaH / 2),
      surface,
      reason: "fit",
    })
  );

  return { template: "CENTERED_STACK", positioned, decisions };
}

/**
 * VERTICAL_STACK template — for TALL surfaces (Story, Interstitial).
 *
 * Layout (top to bottom):
 *   [large image — top ~40-48%]
 *   [logo]
 *   [headline]
 *   [subtext]
 *   [big CTA button]
 */
export function verticalStackTemplate(
  elements: AdElement[],
  surface: Surface
): { template: LayoutTemplate; positioned: PositionedElement[]; decisions: string[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];
  const decisions: string[] = ["Vertical layout (tall aspect ratio <= 0.75)"];
  const byType = byTypeMap(elements);

  const ctaFSize = ctaFontSize(surface);
  const ctaH = Math.min(Math.round(ctaFSize * 2.2), 52);
  const logoEl = byType.get("logo");
  const logoH = logoEl ? Math.round(logoFontSize(surface) * 1.8) : 0;
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const hlLines = surface.height > 600 ? 3 : 2;
  const hlH = Math.round(hlFontSize * 1.3 * hlLines);

  // Dynamically allocate image height so typography and CTA always fit inside surface
  const reservedForContent = logoH + hlH + ctaH + PAD * 4;
  const maxImageH = Math.max(40, surface.height - PAD * 2 - reservedForContent);
  const desiredImageH = Math.round(ih * (surface.height > 600 ? 0.48 : 0.38));
  const imageH = Math.min(desiredImageH, maxImageH);

  let cursor = PAD;

  // ── Image ─────────────────────────────────────────────────────────────
  const imageEl = byType.get("image");
  if (imageEl) {
    decisions.push("Hero visual allocated proportional top cover");
  }
  positioned.push(
    place(imageEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: imageH,
      surface,
      imageFit: "cover",
      borderRadius: 12,
      reason: imageEl ? "cropped" : "hidden",
    })
  );
  if (imageEl) cursor += imageH + PAD;

  // ── Logo ──────────────────────────────────────────────────────────────
  const logoW = logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0;
  if (logoEl) {
    decisions.push("Brand logo displayed with native aspect ratio");
  }
  positioned.push(
    place(logoEl, {
      x: PAD,
      y: cursor,
      w: logoW,
      h: logoH,
      surface,
      imageFit: "contain",
      reason: logoEl ? "fit" : "hidden",
    })
  );
  if (logoEl) cursor += logoH + PAD * 0.5;

  // ── Headline ──────────────────────────────────────────────────────────
  if (hlEl) {
    decisions.push(`Headline scaled to ${hlFontSize}px with ${hlLines}-line wrap`);
  }
  positioned.push(
    place(hlEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: hlH,
      fontSize: hlFontSize,
      surface,
      reason: "fit",
    })
  );
  if (hlEl) cursor += hlH + PAD * 0.5;

  // ── Subtext ───────────────────────────────────────────────────────────
  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stH = Math.round(stFontSize * 1.35 * (surface.height > 600 ? 2 : 1));
  const stFits = cursor + stH + ctaH + PAD * 1.5 <= surface.height - PAD;
  if (stEl) {
    if (stFits) {
      decisions.push("Full description visible with generous vertical line-height");
    } else {
      decisions.push("Description hidden to guarantee CTA visibility");
    }
  }
  positioned.push(
    place(stEl, {
      x: PAD,
      y: cursor,
      w: iw,
      h: stH,
      fontSize: stFontSize,
      surface,
      forceHide: !stFits,
      reason: !stFits ? "hidden" : "fit",
    })
  );
  if (stEl && stFits) cursor += stH + PAD * 0.75;

  // ── CTA ───────────────────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaW = iw;
  // Pin CTA safely within surface boundaries
  const ctaY = Math.min(surface.height - PAD - ctaH, Math.max(PAD, cursor));
  if (ctaEl) {
    decisions.push("Full-width CTA button preserved at base");
  }
  positioned.push(
    place(ctaEl, {
      x: PAD,
      y: ctaY,
      w: ctaW,
      h: ctaH,
      fontSize: ctaFSize,
      borderRadius: Math.round(ctaH / 2),
      surface,
      reason: "fit",
    })
  );

  return { template: "VERTICAL_STACK", positioned, decisions };
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
  reason?: AdaptationReason;
}

/** Build a PositionedElement. If `el` is undefined, produces a hidden placeholder. */
function place(
  el: AdElement | undefined,
  opts: PlaceOpts
): PositionedElement {
  const isVisible = !!el && !opts.forceHide;
  return {
    id: el?.id ?? `__placeholder_${opts.x}_${opts.y}`,
    type: el?.type ?? "headline",
    content: el?.content ?? "",
    visible: isVisible,
    x: Math.max(0, opts.x),
    y: Math.max(0, opts.y),
    width: Math.max(0, opts.w),
    height: Math.max(0, opts.h),
    fontSize: opts.fontSize,
    imageFit: opts.imageFit,
    borderRadius: opts.borderRadius,
    focalPoint: el?.focalPoint,
    reason: !isVisible ? "hidden" : opts.reason ?? "fit",
  };
}
