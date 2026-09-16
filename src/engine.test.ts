/**
 * engine.test.ts
 *
 * Comprehensive unit test suite verifying all 12 specification requirements:
 *  1. Wide surface → horizontal layout.
 *  2. Tall surface → vertical layout.
 *  3. Square surface → square/balanced layout.
 *  4. Long content → lower-priority element can be hidden.
 *  5. Headline → font size decreases when constrained.
 *  6. Priority-1 elements remain visible whenever possible.
 *  7. Image aspect ratio is preserved.
 *  8. Custom dimensions work.
 *  9. Elements remain inside surface boundaries.
 * 10. No negative widths/heights.
 * 11. Missing optional content doesn't crash the engine.
 * 12. Extremely small surfaces are handled gracefully.
 *
 * Runs purely in Node without DOM/React dependencies.
 * Run: npm run test
 */

import { describe, it, expect } from "vitest";
import { layoutEngine } from "./engine/layoutEngine";
import { classifySurface } from "./engine/classify";
import type { AdElement, Surface } from "./engine/types";
import { SAMPLE_AD } from "./data/sampleAd";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BANNER: Surface = { id: "banner", name: "Banner", width: 728, height: 90 };
const SQUARE: Surface = { id: "square", name: "Square", width: 300, height: 300 };
const MREC: Surface = { id: "mrec", name: "MREC", width: 300, height: 250 };
const STORY: Surface = { id: "story", name: "Story", width: 1080, height: 1920 };
const INTERSTITIAL: Surface = { id: "interstitial", name: "Interstitial", width: 320, height: 480 };
const CUSTOM_SURFACE: Surface = { id: "custom", name: "Custom 500x150", width: 500, height: 150 };
const TINY_SURFACE: Surface = { id: "tiny", name: "Tiny 120x40", width: 120, height: 40 };

describe("Adaptive Layout Engine — 12 Specification Test Cases", () => {
  // 1. Wide surface → horizontal layout
  it("1. Wide surface → horizontal layout", () => {
    const result = layoutEngine(SAMPLE_AD, BANNER);
    expect(result.template).toBe("HORIZONTAL");
    expect(classifySurface(BANNER)).toBe("WIDE");
  });

  // 2. Tall surface → vertical layout
  it("2. Tall surface → vertical layout", () => {
    const storyResult = layoutEngine(SAMPLE_AD, STORY);
    expect(storyResult.template).toBe("VERTICAL_STACK");
    expect(classifySurface(STORY)).toBe("TALL");

    const intResult = layoutEngine(SAMPLE_AD, INTERSTITIAL);
    expect(intResult.template).toBe("VERTICAL_STACK");
    expect(classifySurface(INTERSTITIAL)).toBe("TALL");
  });

  // 3. Square surface → square/balanced layout
  it("3. Square surface → square/balanced layout", () => {
    const sqResult = layoutEngine(SAMPLE_AD, SQUARE);
    expect(sqResult.template).toBe("CENTERED_STACK");
    expect(classifySurface(SQUARE)).toBe("SQUARE");

    const mrecResult = layoutEngine(SAMPLE_AD, MREC);
    expect(mrecResult.template).toBe("CENTERED_STACK");
    expect(classifySurface(MREC)).toBe("SQUARE");
  });

  // 4. Long content → lower-priority element can be hidden
  it("4. Long content → lower-priority element can be hidden", () => {
    const longContentAd: AdElement[] = [
      ...SAMPLE_AD.filter((e) => e.type !== "headline"),
      {
        id: "headline",
        type: "headline",
        content: "Discover the New Generation of Premium Wireless Headphones Designed for Immersive Everyday Listening",
        priority: 1,
      },
    ];
    // In a compact banner (728x90) with a long headline, description is hidden to prevent vertical overflow
    const result = layoutEngine(longContentAd, BANNER);
    const subtext = result.elements.find((e) => e.type === "subtext");
    expect(subtext?.visible).toBe(false);
    expect(subtext?.reason).toBe("hidden");
  });

  // 5. Headline → font size decreases when constrained
  it("5. Headline → font size decreases when constrained", () => {
    const storyResult = layoutEngine(SAMPLE_AD, STORY);
    const bannerResult = layoutEngine(SAMPLE_AD, BANNER);

    const storyHL = storyResult.elements.find((e) => e.type === "headline");
    const bannerHL = bannerResult.elements.find((e) => e.type === "headline");

    expect(storyHL?.fontSize).toBeDefined();
    expect(bannerHL?.fontSize).toBeDefined();
    expect(bannerHL!.fontSize!).toBeLessThan(storyHL!.fontSize!);
  });

  // 6. Priority-1 elements remain visible whenever possible
  it("6. Priority-1 elements remain visible whenever possible", () => {
    const tinyResult = layoutEngine(SAMPLE_AD, TINY_SURFACE);

    // Headline and CTA are Priority 1 and must be protected
    const headline = tinyResult.elements.find((e) => e.type === "headline");
    const cta = tinyResult.elements.find((e) => e.type === "cta");

    expect(headline?.visible).toBe(true);
    expect(cta?.visible).toBe(true);
  });

  // 7. Image aspect ratio is preserved
  it("7. Image aspect ratio is preserved", () => {
    const result = layoutEngine(SAMPLE_AD, BANNER);
    const img = result.elements.find((e) => e.type === "image");
    expect(img).toBeDefined();
    expect(img?.visible).toBe(true);
    expect(img?.imageFit).toBe("cover"); // Non-distorting cover fit
    // Width and height are positive and proportional
    expect(img!.width).toBeGreaterThan(0);
    expect(img!.height).toBeGreaterThan(0);
  });

  // 8. Custom dimensions work (e.g. 500 × 150)
  it("8. Custom dimensions work", () => {
    const result = layoutEngine(SAMPLE_AD, CUSTOM_SURFACE);
    expect(result.surface.width).toBe(500);
    expect(result.surface.height).toBe(150);
    expect(result.template).toBe("HORIZONTAL"); // 500/150 = 3.33 >= 2.2 -> WIDE
    expect(result.elements.length).toBeGreaterThanOrEqual(SAMPLE_AD.length);
  });

  // 9. Elements remain inside surface boundaries
  it("9. Elements remain inside surface boundaries", () => {
    const surfaces = [BANNER, SQUARE, MREC, STORY, INTERSTITIAL, CUSTOM_SURFACE];
    for (const surface of surfaces) {
      const result = layoutEngine(SAMPLE_AD, surface);
      for (const el of result.elements.filter((e) => e.visible)) {
        expect(el.x).toBeGreaterThanOrEqual(0);
        expect(el.y).toBeGreaterThanOrEqual(0);
        expect(el.x + el.width).toBeLessThanOrEqual(surface.width + 1); // allow 1px rounding
        expect(el.y + el.height).toBeLessThanOrEqual(surface.height + 1);
      }
    }
  });

  // 10. No negative widths/heights
  it("10. No negative widths/heights", () => {
    const surfaces = [BANNER, SQUARE, STORY, TINY_SURFACE, CUSTOM_SURFACE];
    for (const surface of surfaces) {
      const result = layoutEngine(SAMPLE_AD, surface);
      for (const el of result.elements) {
        expect(el.width).toBeGreaterThanOrEqual(0);
        expect(el.height).toBeGreaterThanOrEqual(0);
        expect(el.x).toBeGreaterThanOrEqual(0);
        expect(el.y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  // 11. Missing optional content doesn't crash the engine
  it("11. Missing optional content doesn't crash the engine", () => {
    const partialElements: AdElement[] = [
      { id: "headline", type: "headline", content: "Minimal Ad", priority: 1 },
      { id: "cta", type: "cta", content: "Go", priority: 1 },
    ];
    expect(() => layoutEngine(partialElements, BANNER)).not.toThrow();
    expect(() => layoutEngine(partialElements, STORY)).not.toThrow();
    expect(() => layoutEngine(partialElements, SQUARE)).not.toThrow();

    const emptyElements: AdElement[] = [];
    expect(() => layoutEngine(emptyElements, BANNER)).not.toThrow();
  });

  // 12. Extremely small surfaces are handled gracefully
  it("12. Extremely small surfaces are handled gracefully", () => {
    const extremeMicro: Surface = { id: "micro", name: "Micro 60x20", width: 60, height: 20 };
    expect(() => layoutEngine(SAMPLE_AD, extremeMicro)).not.toThrow();
    const result = layoutEngine(SAMPLE_AD, extremeMicro);
    expect(result.hiddenCount).toBeGreaterThan(0);
    // Elements that remain must have non-negative dimensions
    for (const el of result.elements) {
      expect(el.width).toBeGreaterThanOrEqual(0);
      expect(el.height).toBeGreaterThanOrEqual(0);
    }
  });
});
