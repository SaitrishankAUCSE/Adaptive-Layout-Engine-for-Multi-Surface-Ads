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
  if (surface.width <= 0 || surface.height <= 0) {
    throw new Error(`Invalid surface dimensions: ${surface.width}x${surface.height}. Width and height must be strictly positive.`);
  }

  const area = surface.width * surface.height;

  // Step 1 — Priority pruning
  const { visible: visibleElements, dropped: droppedElements, pruningDecisions } = pruneByPriorityWithAudit(elements, area);

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

  // Incorporate dropped elements so the caller has a complete audit of all elements
  const allPositioned = [...result.positioned];
  for (const dropped of droppedElements) {
    // Only add if not already in result
    if (!allPositioned.some((p) => p.id === dropped.id)) {
      allPositioned.push({
        id: dropped.id,
        type: dropped.type,
        content: dropped.content,
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        reason: "hidden",
      });
    }
  }

  const activeInputElements = elements.filter((el) => el.content && el.content.trim() !== "");
  const activeIds = new Set(activeInputElements.map((el) => el.id));
  const trulyVisibleCount = allPositioned.filter(
    (p) => activeIds.has(p.id) && p.visible && p.width > 0 && p.height > 0
  ).length;
  const hiddenCount = Math.max(0, activeInputElements.length - trulyVisibleCount);
  const decisions = [...pruningDecisions, ...result.decisions];

  return {
    surface,
    template: result.template,
    elements: allPositioned,
    hiddenCount,
    decisions,
  };
}

// ─── Priority pruning with audit ──────────────────────────────────────────────

function pruneByPriorityWithAudit(
  elements: AdElement[],
  area: number
): { visible: AdElement[]; dropped: AdElement[]; pruningDecisions: string[] } {
  if (area >= DROP_P3_AREA) {
    return { visible: elements, dropped: [], pruningDecisions: [] };
  }

  if (area >= DROP_P2_AREA) {
    const visible = elements.filter((el) => el.priority <= 2);
    const dropped = elements.filter((el) => el.priority > 2);
    const decisions = dropped.length > 0
      ? [`Area constraint (${area.toLocaleString()} px²): Priority-3 elements hidden first`]
      : [];
    return { visible, dropped, pruningDecisions: decisions };
  }

  // Micro surface — only priority-1
  const visible = elements.filter((el) => el.priority === 1);
  const dropped = elements.filter((el) => el.priority > 1);
  const decisions = [
    `Micro surface constraint (${area.toLocaleString()} px²): Preserving only critical Priority-1 elements`,
  ];
  return { visible, dropped, pruningDecisions: decisions };
}
