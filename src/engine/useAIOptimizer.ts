import { useState } from "react";
import type { AdElement, Surface } from "./types";
import { generateAndValidateOptimization, type OptimizeCandidateResult } from "./aiOptimizer";

export function useAIOptimizer() {
  const [isGenerating, setIsGenerating] = useState(false);

  const optimizeCopy = async (
    currentElements: AdElement[],
    surfaces: Surface[]
  ): Promise<OptimizeCandidateResult> => {
    if (isGenerating) return { success: false, message: "Already generating." };
    
    setIsGenerating(true);
    try {
      return await generateAndValidateOptimization(currentElements, surfaces);
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, optimizeCopy };
}
