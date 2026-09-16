import type { AdElement } from "../engine/types";
import { SAMPLE_AD } from "./sampleAd";

export interface CampaignPreset {
  id: string;
  name: string;
  category: string;
  elements: AdElement[];
}

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: "luxury-watch",
    name: "Luxury Timepieces",
    category: "E-Commerce",
    elements: SAMPLE_AD,
  },
  {
    id: "flash-sale",
    name: "Midnight Flash Sale",
    category: "Retail",
    elements: [
      {
        id: "image",
        type: "image",
        content: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
        priority: 2,
        aspectRatio: 1.5,
      },
      {
        id: "logo",
        type: "logo",
        content: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200&q=80",
        priority: 3,
        aspectRatio: 3.2,
      },
      {
        id: "headline",
        type: "headline",
        content: "50% Off Premium Audio Gear",
        priority: 1,
      },
      {
        id: "subtext",
        type: "subtext",
        content: "48-hour exclusive drop. Studio-grade noise canceling headphones with lossless wireless streaming.",
        priority: 2,
      },
      {
        id: "cta",
        type: "cta",
        content: "Claim Offer",
        priority: 1,
      },
    ],
  },
  {
    id: "industrial-logistics",
    name: "Global Freight Systems",
    category: "Logistics",
    elements: [
      {
        id: "image",
        type: "image",
        content: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
        priority: 3,
        aspectRatio: 1.6,
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
        content: "Next-Generation Global Supply Chain Logistics",
        priority: 1,
      },
      {
        id: "subtext",
        type: "subtext",
        content: "End-to-end container tracking, automated fleet routing, and high-capacity port operations.",
        priority: 2,
      },
      {
        id: "cta",
        type: "cta",
        content: "View Services",
        priority: 1,
      },
    ],
  },
  {
    id: "stress-test",
    name: "Long Headline Stress Test",
    category: "R&D Benchmark",
    elements: [
      {
        id: "image",
        type: "image",
        content: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
        priority: 3,
        aspectRatio: 1.5,
      },
      {
        id: "logo",
        type: "logo",
        content: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200&q=80",
        priority: 3,
        aspectRatio: 3.2,
      },
      {
        id: "headline",
        type: "headline",
        content: "ULTRA-RESILIENT MULTI-SURFACE ADAPTIVE LAYOUT COMPUTATION AND DETERMINISTIC CONSTRAINT RESOLUTION",
        priority: 1,
      },
      {
        id: "subtext",
        type: "subtext",
        content: "Testing priority dropping, proportional font scaling, and CSS multi-line clamp behavior under extreme character lengths.",
        priority: 2,
      },
      {
        id: "cta",
        type: "cta",
        content: "Verify Engine",
        priority: 1,
      },
    ],
  },
];
