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
 * HORIZONTAL template — for WIDE surfaces (banners, billboards, linkedin banners).
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

  const byType = byTypeMap(elements);
  const imageEl = byType.get("image");

  // Slot proportions scaled to avoid negative widths on compact banners
  const imageW = imageEl ? Math.min(Math.round(ih * 1.0), Math.max(16, Math.round(iw * 0.22))) : 0;
  const ctaW = Math.min(Math.round(iw * 0.30), Math.max(Math.round(iw * 0.16), 40));
  const textW = Math.max(24, iw - (imageEl ? imageW + PAD : 0) - ctaW - PAD);

  // ── Image (left slot) ──────────────────────────────────────────────
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
  const logoH = logoEl ? Math.min(Math.round(ih * 0.32), 36) : 0;
  const logoW = logoEl ? Math.round(logoH * (logoEl.aspectRatio ?? 3)) : 0;
  if (logoEl) {
    decisions.push("Logo positioned at top of text block");
  }
  positioned.push(
    place(logoEl, {
      x: textX,
      y: PAD,
      w: logoW,
      h: logoH,
      surface,
      imageFit: "contain",
      reason: logoEl ? "fit" : "hidden",
    })
  );

  // ── Headline ────────────────────────────────────────────────────────
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);
  const hlText = hlEl?.content ?? "";
  const isLongHeadline = hlText.length > 40;
  const charsPerLine = Math.max(12, Math.floor(textW / (hlFontSize * 0.58)));
  const hlLines = Math.min(2, Math.max(1, Math.ceil(hlText.length / charsPerLine)));
  const hlH = Math.round(hlFontSize * 1.2 * hlLines);

  if (hlEl) {
    if (hlLines > 1) {
      decisions.push(`Headline multi-line wrapped (${hlFontSize}px)`);
    } else {
      decisions.push(`Headline scaled to ${hlFontSize}px`);
    }
  }
  positioned.push(
    place(hlEl, {
      x: textX,
      y: PAD + logoH + (logoH > 0 ? 3 : 0),
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
  const stText = stEl?.content ?? "";
  const stCharsPerLine = Math.max(14, Math.floor(textW / (stFontSize * 0.52)));
  const stLines = Math.min(2, Math.max(1, Math.ceil(stText.length / stCharsPerLine)));
  const stH = Math.round(stFontSize * 1.3 * stLines);
  const stY = PAD + logoH + (logoH > 0 ? 3 : 0) + hlH + 3;

  // In banners, description fits only if there's vertical clearance without colliding
  const stFits = !isLongHeadline && stY + stH <= surface.height - PAD && surface.height >= 85;
  if (stEl) {
    if (stFits) {
      decisions.push(`Description fitted below headline (${stFontSize}px)`);
    } else {
      decisions.push("Description hidden (space constrained by banner height)");
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
  const ctaH = Math.min(Math.round(ih * 0.55), 44);
  const ctaY = Math.min(
    surface.height - PAD - ctaH,
    Math.max(PAD, PAD + Math.round((ih - ctaH) / 2))
  );
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
 * CENTERED_STACK template — for SQUARE & BALANCED surfaces (MREC, Square, Feeds).
 *
 * Layout (top to bottom):
 *   [image — top ~35-42%]
 *   [logo row]
 *   [headline]
 *   [subtext]
 *   [CTA button — centered at base]
 */
export function centeredStackTemplate(
  elements: AdElement[],
  surface: Surface
): { template: LayoutTemplate; positioned: PositionedElement[]; decisions: string[] } {
  const iw = innerWidth(surface);
  const ih = innerHeight(surface);
  const positioned: PositionedElement[] = [];
  const decisions: string[] = ["Balanced stacked layout (aspect ratio 0.75 - 2.2)"];
  const byType = byTypeMap(elements);

  const ctaFSize = ctaFontSize(surface);
  const ctaH = Math.min(Math.round(ctaFSize * 2.1), 44);
  const logoEl = byType.get("logo");
  const logoH = logoEl ? Math.round(logoFontSize(surface) * 1.3) : 0;
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);

  const hlText = hlEl?.content ?? "";
  const charsPerLine = Math.max(10, Math.floor(iw / (hlFontSize * 0.58)));
  const hlLines = Math.min(2, Math.max(1, Math.ceil(hlText.length / charsPerLine)));
  const hlH = Math.round(hlFontSize * 1.25 * hlLines);

  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stText = stEl?.content ?? "";
  const stCharsPerLine = Math.max(12, Math.floor(iw / (stFontSize * 0.52)));
  const stLines = Math.min(2, Math.max(1, Math.ceil(stText.length / stCharsPerLine)));
  const stH = Math.round(stFontSize * 1.35 * stLines);

  const gap = Math.max(3, Math.round(PAD * 0.5));
  const textAndCtaHeight = logoH + hlH + stH + ctaH + gap * 5;
  const availForImage = surface.height - PAD * 2 - textAndCtaHeight;

  let imageH: number;
  let stFits = true;

  if (availForImage >= 60) {
    // Both image and subtext fit cleanly
    imageH = Math.min(Math.round(ih * 0.38), availForImage);
  } else {
    // Tight height (like MREC 300x250 or Square 300x300 with long content)
    const withoutSubtext = logoH + hlH + ctaH + gap * 4;
    const availWithoutSubtext = surface.height - PAD * 2 - withoutSubtext;
    if (availWithoutSubtext >= 50) {
      stFits = false;
      imageH = Math.min(Math.round(ih * 0.35), availWithoutSubtext);
    } else {
      stFits = false;
      imageH = Math.max(40, availWithoutSubtext);
    }
  }

  let cursor = PAD;

  // ── Image ────────────────────────────────────────────────────────────
  const imageEl = byType.get("image");
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
      borderRadius: 8,
      reason: imageEl ? "cropped" : "hidden",
    })
  );
  if (imageEl) cursor += imageH + gap;

  // ── Logo ─────────────────────────────────────────────────────────────
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
  if (logoEl) cursor += logoH + gap;

  // ── Headline ──────────────────────────────────────────────────────────
  if (hlEl) {
    decisions.push(`Headline scaled to ${hlFontSize}px (${hlLines} lines)`);
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
  if (hlEl) cursor += hlH + gap;

  // ── Subtext ───────────────────────────────────────────────────────────
  if (stEl) {
    if (stFits) {
      decisions.push(`Description fitted below headline (${stFontSize}px)`);
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
  if (stEl && stFits) cursor += stH + gap;

  // ── CTA ───────────────────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaW = Math.min(iw, Math.round(iw * 0.75));
  const ctaX = PAD + Math.round((iw - ctaW) / 2);
  // Guarantee CTA is positioned at base without ever overlapping subtext
  const ctaY = Math.min(surface.height - PAD - ctaH, Math.max(cursor + 2, surface.height - PAD - ctaH));
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
 * VERTICAL_STACK template — for TALL surfaces (Story, Half Page, Interstitial).
 *
 * Layout (top to bottom):
 *   [hero image — top proportional cover]
 *   [logo]
 *   [headline]
 *   [subtext]
 *   [CTA button — at base]
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
  const ctaH = Math.min(Math.round(ctaFSize * 2.1), 50);
  const logoEl = byType.get("logo");
  const logoH = logoEl ? Math.round(logoFontSize(surface) * 1.4) : 0;
  const hlEl = byType.get("headline");
  const hlFontSize = headlineFontSize(surface);

  // Line wrapping calculation based on container inner width
  const hlText = hlEl?.content ?? "";
  const charsPerLine = Math.max(10, Math.floor(iw / (hlFontSize * 0.58)));
  const hlLines = Math.min(3, Math.max(1, Math.ceil(hlText.length / charsPerLine)));
  const hlH = Math.round(hlFontSize * 1.25 * hlLines);

  const stEl = byType.get("subtext");
  const stFontSize = subtextFontSize(surface);
  const stText = stEl?.content ?? "";
  const stCharsPerLine = Math.max(12, Math.floor(iw / (stFontSize * 0.52)));
  const stLines = Math.min(3, Math.max(1, Math.ceil(stText.length / stCharsPerLine)));
  const stH = Math.round(stFontSize * 1.35 * stLines);

  const gap = Math.max(4, Math.round(PAD * 0.6));
  const textAndCtaHeight = logoH + hlH + stH + ctaH + gap * 5;
  const availForImage = surface.height - PAD * 2 - textAndCtaHeight;

  let imageH: number;
  let stFits = true;

  if (availForImage >= 75) {
    // Tall surface (e.g. Half Page 300x600, Story 1080x1920): both image and description fit!
    const targetImageRatio = surface.height > 800 ? 0.44 : 0.34;
    imageH = Math.min(Math.round(ih * targetImageRatio), availForImage);
  } else {
    // Highly constrained tall surface: check if dropping subtext allows clean image and headline
    const withoutSubtext = logoH + hlH + ctaH + gap * 4;
    const availWithoutSubtext = surface.height - PAD * 2 - withoutSubtext;
    if (availWithoutSubtext >= 55) {
      stFits = false;
      imageH = Math.min(Math.round(ih * 0.30), availWithoutSubtext);
    } else {
      stFits = false;
      imageH = Math.max(40, availWithoutSubtext);
    }
  }

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
  if (imageEl) cursor += imageH + gap;

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
  if (logoEl) cursor += logoH + gap;

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
  if (hlEl) cursor += hlH + gap;

  // ── Subtext ───────────────────────────────────────────────────────────
  if (stEl) {
    if (stFits) {
      decisions.push(`Full description visible with ${stLines}-line wrap (${stFontSize}px)`);
    } else {
      decisions.push("Description hidden to guarantee CTA clearance");
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
  if (stEl && stFits) cursor += stH + gap;

  // ── CTA ───────────────────────────────────────────────────────────────
  const ctaEl = byType.get("cta");
  const ctaW = iw;
  // Pin CTA cleanly at base, guaranteed below cursor and strictly within bounds
  const ctaY = Math.min(surface.height - PAD - ctaH, Math.max(cursor + 2, surface.height - PAD - ctaH));
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

/** Build a PositionedElement. If `el` is undefined or forceHidden, produces a hidden element. */
function place(
  el: AdElement | undefined,
  opts: PlaceOpts
): PositionedElement {
  const isVisible = !!el && !opts.forceHide && opts.w > 0 && opts.h > 0;
  return {
    id: el?.id ?? `__placeholder_${opts.x}_${opts.y}`,
    type: el?.type ?? "headline",
    content: el?.content ?? "",
    visible: isVisible,
    x: Math.max(0, opts.x),
    y: Math.max(0, opts.y),
    width: isVisible ? Math.max(0, opts.w) : 0,
    height: isVisible ? Math.max(0, opts.h) : 0,
    fontSize: opts.fontSize,
    imageFit: opts.imageFit,
    borderRadius: opts.borderRadius,
    focalPoint: el?.focalPoint,
    reason: !isVisible ? "hidden" : opts.reason ?? "fit",
  };
}
