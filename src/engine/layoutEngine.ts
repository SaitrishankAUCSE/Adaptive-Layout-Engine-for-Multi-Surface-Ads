/**
 * layoutEngine.ts
 *
 * The core of this project. A PURE function:
 *   (elements: AdElement[], surface: Surface) → LayoutResult
 *
 * No React, no DOM, no side effects. This means:
 *  - It can be unit-tested with plain Vitest (no browser needed)
 *  - React components are "dumb" — they only render what the engine returns
 *  - The algorithm is easy to reason about and swap out (e.g., replace
 *    rule-based heuristics with a Cassowary constraint solver later)
 *
 * Algorithm in 4 steps:
 *  1. Prune elements by priority for small surfaces
 *  2. Classify surface shape (WIDE / SQUARE / TALL)
 *  3. Select the matching layout template
 *  4. Let the template compute pixel positions + font sizes
 */

import type { AdElement, Surface, LayoutResult } from "./types";
import { classifySurface } from "./classify";
import {
  horizontalTemplate,
  centeredStackTemplate,
  verticalStackTemplate,
} from "./templates";

// ─── Priority pruning thresholds ─────────────────────────────────────────────

/**
 * Below this area (px²), priority-3 elements are dropped entirely.
 * 728×90 = 65,520 — sits just above; 300×50 = 15,000 — well below.
 */
const DROP_P3_AREA = 50_000;

/**
 * Below this area, priority-2 elements are also dropped.
 * Keeps only priority-1 (headline + CTA) for micro surfaces.
 */
const DROP_P2_AREA = 10_000;

// ─── Main export ──────────────────────────────────────────────────────────────

export function layoutEngine(
  elements: AdElement[],
  surface: Surface
): LayoutResult {
  const area = surface.width * surface.height;

  // Step 1 — Priority pruning
  const visibleElements = pruneByPriority(elements, area);

  // Step 2 — Classify
  const shape = classifySurface(surface);

  // Step 3 + 4 — Template selection + positioning
  let result: ReturnType<typeof horizontalTemplate>;

  switch (shape) {
    case "WIDE":
      result = horizontalTemplate(visibleElements, surface);
      break;
    case "TALL":
      result = verticalStackTemplate(visibleElements, surface);
      break;
    case "SQUARE":
    default:
      result = centeredStackTemplate(visibleElements, surface);
  }

  const hiddenCount = result.positioned.filter((p) => !p.visible).length;

  return {
    surface,
    template: result.template,
    elements: result.positioned,
    hiddenCount,
  };
}

// ─── Priority pruning ─────────────────────────────────────────────────────────

function pruneByPriority(elements: AdElement[], area: number): AdElement[] {
  if (area >= DROP_P3_AREA) return elements; // all elements survive
  if (area >= DROP_P2_AREA) {
    // Drop priority-3
    return elements.filter((el) => el.priority <= 2);
  }
  // Micro surface — only priority-1
  return elements.filter((el) => el.priority === 1);
}
