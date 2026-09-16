import type { AdElement } from "../engine/types";

/**
 * Default sample ad — matching the official project specification:
 * Headline: "Premium Wireless Headphones"
 * Description: "Immersive sound designed for everyday listening."
 * CTA: "Shop Now"
 * Hero Image: High-res sleek wireless headphones
 * Logo: Clean brand mark
 *
 * Priorities:
 *   Hero Image: Priority 1 (must remain visible)
 *   Logo: Priority 1 (must remain visible)
 *   Headline: Priority 1 (must remain visible)
 *   CTA: Priority 1 (must remain visible)
 *   Description: Priority 3 (can be hidden first when constrained)
 */
export const SAMPLE_AD: AdElement[] = [
  {
    id: "image",
    type: "image",
    content: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
    priority: 1,
    aspectRatio: 1.2,
    flexible: true,
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: "logo",
    type: "logo",
    content: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
    priority: 1,
    aspectRatio: 3.0,
    flexible: false,
  },
  {
    id: "headline",
    type: "headline",
    content: "Premium Wireless Headphones",
    priority: 1,
    flexible: true,
  },
  {
    id: "subtext",
    type: "subtext",
    content: "Immersive sound designed for everyday listening.",
    priority: 3,
    flexible: true,
  },
  {
    id: "cta",
    type: "cta",
    content: "Shop Now",
    priority: 1,
    flexible: false,
  },
];
