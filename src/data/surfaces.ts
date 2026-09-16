import type { Surface } from "../engine/types";

/**
 * Ad surfaces — IAB standard sizes + modern social media formats.
 * IAB source: https://www.iab.com/newadportfolio/
 */
export const SURFACES: Surface[] = [
  // ── IAB Display Ad Sizes ────────────────────────────────────────────
  {
    id: "leaderboard",
    name: "Leaderboard",
    width: 728,
    height: 90,
  },
  {
    id: "mrec",
    name: "MREC",
    width: 300,
    height: 250,
  },
  {
    id: "square",
    name: "Square",
    width: 300,
    height: 300,
  },
  {
    id: "interstitial",
    name: "Interstitial",
    width: 320,
    height: 480,
  },
  {
    id: "billboard",
    name: "Billboard",
    width: 970,
    height: 250,
  },
  {
    id: "half-page",
    name: "Half Page",
    width: 300,
    height: 600,
  },

  // ── Social Media Formats ────────────────────────────────────────────
  {
    id: "instagram-reel",
    name: "Instagram Reel",
    width: 1080,
    height: 1920,
  },
  {
    id: "instagram-feed",
    name: "Instagram Feed",
    width: 1080,
    height: 1080,
  },
  {
    id: "instagram-landscape",
    name: "Instagram Landscape",
    width: 1080,
    height: 566,
  },
  {
    id: "twitter-post",
    name: "X / Twitter Post",
    width: 1200,
    height: 675,
  },
  {
    id: "linkedin-banner",
    name: "LinkedIn Banner",
    width: 1128,
    height: 191,
  },
  {
    id: "og-image",
    name: "Open Graph",
    width: 1200,
    height: 630,
  },
  {
    id: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    width: 1280,
    height: 720,
  },
];
