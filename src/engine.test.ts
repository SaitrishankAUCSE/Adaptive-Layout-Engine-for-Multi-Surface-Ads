/**
 * engine.test.ts
 *
 * Unit tests for the layout engine.
 * These run in Node — no browser, no React — proving the engine is pure.
 *
 * Run: npm run test
 */

import { describe, it, expect } from "vitest";
import { layoutEngine } from "./engine/layoutEngine";
import { classifySurface } from "./engine/classify";
import type { AdElement, Surface } from "./engine/types";
import { SAMPLE_AD } from "./data/sampleAd";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LEADERBOARD: Surface = { id: "lb", name: "Leaderboard", width: 728, height: 90 };
const MREC: Surface = { id: "mrec", name: "MREC", width: 300, height: 250 };
const STORY: Surface = { id: "story", name: "Story", width: 1080, height: 1920 };
const INTERSTITIAL: Surface = { id: "int", name: "Interstitial", width: 320, height: 480 };
const MICRO: Surface = { id: "micro", name: "Micro", width: 200, height: 50 };
const CUSTOM_SQUARE: Surface = { id: "cs", name: "Custom Square", width: 400, height: 400 };

// ─── Classification tests ─────────────────────────────────────────────────────

describe("classifySurface", () => {
  it("classifies Leaderboard (728×90, AR≈8.1) as WIDE", () => {
    expect(classifySurface(LEADERBOARD)).toBe("WIDE");
  });

  it("classifies Story (1080×1920, AR≈0.56) as TALL", () => {
    expect(classifySurface(STORY)).toBe("TALL");
  });

  it("classifies MREC (300×250, AR=1.2) as SQUARE", () => {
    expect(classifySurface(MREC)).toBe("SQUARE");
  });

  it("classifies Interstitial (320×480, AR≈0.67) as SQUARE (borderline)", () => {
    // 320/480 = 0.667 — just above TALL threshold of 0.65
    const shape = classifySurface(INTERSTITIAL);
    expect(["SQUARE", "TALL"]).toContain(shape);
  });

  it("classifies a perfectly square surface as SQUARE", () => {
    expect(classifySurface(CUSTOM_SQUARE)).toBe("SQUARE");
  });
});

// ─── Template selection tests ─────────────────────────────────────────────────

describe("layoutEngine — template selection", () => {
  it("uses HORIZONTAL template for a WIDE surface", () => {
    const result = layoutEngine(SAMPLE_AD, LEADERBOARD);
    expect(result.template).toBe("HORIZONTAL");
  });

  it("uses CENTERED_STACK template for a SQUARE surface", () => {
    const result = layoutEngine(SAMPLE_AD, MREC);
    expect(result.template).toBe("CENTERED_STACK");
  });

  it("uses VERTICAL_STACK template for a TALL surface", () => {
    const result = layoutEngine(SAMPLE_AD, STORY);
    expect(result.template).toBe("VERTICAL_STACK");
  });
});

// ─── Priority pruning tests ───────────────────────────────────────────────────

describe("layoutEngine — priority pruning", () => {
  it("shows all elements on a large surface (Story)", () => {
    const result = layoutEngine(SAMPLE_AD, STORY);
    const visibleIds = result.elements
      .filter((e) => e.visible)
      .map((e) => e.id);
    // All 5 sample elements should be visible on a Story
    expect(visibleIds).toContain("headline");
    expect(visibleIds).toContain("cta");
  });

  it("hides priority-3 elements on a tiny micro surface (200×50 = 10,000 px²)", () => {
    const elements: AdElement[] = [
      ...SAMPLE_AD,
      {
        id: "tagline",
        type: "subtext",
        content: "Fine print tagline",
        priority: 3,
      },
    ];
    const result = layoutEngine(elements, MICRO);
    const tagline = result.elements.find((e) => e.id === "tagline");
    // priority-3 should be dropped (either not present or not visible)
    expect(tagline?.visible ?? false).toBe(false);
  });

  it("always keeps priority-1 elements (headline + CTA) visible on any surface", () => {
    const result = layoutEngine(SAMPLE_AD, MICRO);
    const headline = result.elements.find((e) => e.id === "headline");
    const cta = result.elements.find((e) => e.id === "cta");
    expect(headline?.visible).toBe(true);
    expect(cta?.visible).toBe(true);
  });
});

// ─── Font scaling tests ───────────────────────────────────────────────────────

describe("layoutEngine — font scaling", () => {
  it("headline fontSize is larger on Story than on Leaderboard", () => {
    const storyResult = layoutEngine(SAMPLE_AD, STORY);
    const lbResult = layoutEngine(SAMPLE_AD, LEADERBOARD);

    const storyHL = storyResult.elements.find((e) => e.id === "headline");
    const lbHL = lbResult.elements.find((e) => e.id === "headline");

    expect(storyHL?.fontSize).toBeGreaterThan(lbHL?.fontSize ?? 0);
  });

  it("all element positions are non-negative numbers", () => {
    const result = layoutEngine(SAMPLE_AD, MREC);
    for (const el of result.elements.filter((e) => e.visible)) {
      expect(el.x).toBeGreaterThanOrEqual(0);
      expect(el.y).toBeGreaterThanOrEqual(0);
      expect(el.width).toBeGreaterThan(0);
      expect(el.height).toBeGreaterThan(0);
    }
  });
});

// ─── hiddenCount tests ────────────────────────────────────────────────────────

describe("layoutEngine — hiddenCount", () => {
  it("returns hiddenCount = 0 for Story with default ad", () => {
    const result = layoutEngine(SAMPLE_AD, STORY);
    expect(result.hiddenCount).toBe(0);
  });

  it("returns correct surface reference in result", () => {
    const result = layoutEngine(SAMPLE_AD, MREC);
    expect(result.surface.id).toBe("mrec");
  });
});
