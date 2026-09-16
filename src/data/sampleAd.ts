import type { AdElement } from "../engine/types";

/**
 * Default ad content — intentionally uses a headline that's slightly too long
 * for the Leaderboard banner so the engine's adaptive behaviour is visible
 * the moment the page loads. No auth, no backend: content lives in state.
 */
export const SAMPLE_AD: AdElement[] = [
  {
    id: "image",
    type: "image",
    content: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
    priority: 2,
    aspectRatio: 1.5,
  },
  {
    id: "logo",
    type: "logo",
    content: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200&q=80",
    priority: 2,
    aspectRatio: 3.2,
  },
  {
    id: "headline",
    type: "headline",
    content: "Discover Watches That Define Your Every Moment",
    priority: 1,
  },
  {
    id: "subtext",
    type: "subtext",
    content: "Free shipping on orders over $150. Limited edition drops every Friday.",
    priority: 2,
  },
  {
    id: "cta",
    type: "cta",
    content: "Shop Now",
    priority: 1,
  },
];
