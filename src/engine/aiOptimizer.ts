import type { AdElement, Surface, LayoutResult } from "./types";
import { layoutEngine } from "./layoutEngine";

export interface OptimizationMetrics {
  totalSurfaces: number;
  perfectFits: number;
  hiddenPriority1: number;
  totalHidden: number;
}

export interface OptimizeCandidateResult {
  success: boolean;
  message: string;
  elements?: AdElement[];
  beforeMetrics?: OptimizationMetrics;
  afterMetrics?: OptimizationMetrics;
}

export function evaluateElements(elements: AdElement[], surfaces: Surface[]): {
  metrics: OptimizationMetrics;
  results: Map<string, LayoutResult>;
} {
  let perfectFits = 0;
  let hiddenPriority1 = 0;
  let totalHidden = 0;

  
  const results = new Map<string, LayoutResult>();

  for (const surface of surfaces) {
    const result = layoutEngine(elements, surface);
    results.set(surface.id, result);

    if (result.hiddenCount === 0) {
      perfectFits++;
    }

    totalHidden += result.hiddenCount;

    // Check if any priority 1 elements are hidden
    for (const positionedEl of result.elements) {
      if (!positionedEl.visible) {
        const el = elements.find(e => e.id === positionedEl.id);
        if (el?.priority === 1) {
          hiddenPriority1++;
        }
      }
    }
  }

  return {
    metrics: {
      totalSurfaces: surfaces.length,
      perfectFits,
      hiddenPriority1,
      totalHidden,
    },
    results
  };
}

export function validateCandidate(
  currentElements: AdElement[],
  candidateElements: AdElement[],
  surfaces: Surface[]
): { success: boolean; reason: string; beforeMetrics: OptimizationMetrics; afterMetrics: OptimizationMetrics } {
  
  const before = evaluateElements(currentElements, surfaces);
  const after = evaluateElements(candidateElements, surfaces);

  // 1. Did we lose any perfect fits? (A surface that used to fit 5/5 now hides something)
  for (const surface of surfaces) {
    const beforeRes = before.results.get(surface.id);
    const afterRes = after.results.get(surface.id);
    if (beforeRes?.hiddenCount === 0 && (afterRes?.hiddenCount ?? 0) > 0) {
      return { 
        success: false, 
        reason: `Candidate broke layout for ${surface.name} which previously fit perfectly.`,
        beforeMetrics: before.metrics,
        afterMetrics: after.metrics
      };
    }
  }

  // 2. Are more Priority-1 elements hidden now?
  if (after.metrics.hiddenPriority1 > before.metrics.hiddenPriority1) {
    return {
      success: false,
      reason: "Candidate hides more critical (Priority 1) elements than the original.",
      beforeMetrics: before.metrics,
      afterMetrics: after.metrics
    };
  }

  // 3. Did we actually improve?
  // Improvement means either we have MORE perfect fits, OR we have FEWER total hidden elements across all surfaces
  const improvedPerfectFits = after.metrics.perfectFits > before.metrics.perfectFits;
  const improvedHiddenCount = after.metrics.totalHidden < before.metrics.totalHidden;

  if (!improvedPerfectFits && !improvedHiddenCount) {
    return {
      success: false,
      reason: "Candidate did not improve the overall layout score.",
      beforeMetrics: before.metrics,
      afterMetrics: after.metrics
    };
  }

  return {
    success: true,
    reason: "Candidate successfully improved layouts.",
    beforeMetrics: before.metrics,
    afterMetrics: after.metrics
  };
}

export async function generateAndValidateOptimization(
  currentElements: AdElement[],
  surfaces: Surface[]
): Promise<OptimizeCandidateResult> {
  const headline = currentElements.find(e => e.type === "headline")?.content || "";
  const subtext = currentElements.find(e => e.type === "subtext")?.content || "";
  const cta = currentElements.find(e => e.type === "cta")?.content || "";

  const prompt = `Rewrite the following ad copy to be concise while strictly preserving the original meaning, brand intent, and CTA intent. Keep important keywords. As a guideline, target under 35 characters for the headline and under 60 characters for the description. 
Headline: "${headline}"
Description: "${subtext}"
CTA: "${cta}"`;

  try {
    const res = await fetch("/api/generate-ad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.error) {
      return { success: false, message: "AI optimization failed. Please try again." };
    }

    if (!Array.isArray(data.elements)) {
      return { success: false, message: "AI returned malformed data." };
    }

    let valid = true;
    const candidateElements = currentElements.map(el => {
      const match = data.elements.find((g: any) => g.type === el.type);
      if (match && typeof match.content === "string" && match.content.trim().length > 0) {
        return { ...el, content: match.content.trim() };
      }
      if (["headline", "subtext", "cta"].includes(el.type)) {
        if (!match || typeof match.content !== "string" || match.content.trim().length === 0) {
          valid = false;
        }
      }
      return el;
    });

    if (!valid) {
      return { success: false, message: "AI returned incomplete or invalid copy." };
    }

    const validation = validateCandidate(currentElements, candidateElements, surfaces);

    if (validation.success) {
      return {
        success: true,
        message: validation.afterMetrics.perfectFits === surfaces.length
          ? `${validation.afterMetrics.perfectFits}/${surfaces.length} surfaces now fit.`
          : `Copy improved. ${validation.afterMetrics.perfectFits}/${surfaces.length} surfaces now fit.`,
        elements: candidateElements,
        beforeMetrics: validation.beforeMetrics,
        afterMetrics: validation.afterMetrics,
      };
    } else {
      return {
        success: false,
        message: validation.reason,
      };
    }
  } catch (err) {
    console.error("AI Optimizer Error:", err);
    return { success: false, message: "Network error while contacting AI service." };
  }
}
