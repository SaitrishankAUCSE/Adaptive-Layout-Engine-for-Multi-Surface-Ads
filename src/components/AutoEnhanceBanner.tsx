import React, { useMemo, useState } from "react";
import { Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import type { AdElement, Surface } from "../engine/types";
import { layoutEngine } from "../engine/layoutEngine";
import { useAIOptimizer } from "../engine/useAIOptimizer";

interface Props {
  elements: AdElement[];
  surfaces: Surface[];
  onChange: (elements: AdElement[]) => void;
}

export const AutoEnhanceBanner: React.FC<Props> = ({ elements, surfaces, onChange }) => {
  const { isGenerating, optimizeCopy } = useAIOptimizer();
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if any surface has hidden elements
  const hasHiddenElements = useMemo(() => {
    // Only check active input elements that have content
    const activeElementsCount = elements.filter(el => el.content && el.content.trim() !== "").length;
    if (activeElementsCount === 0) return false;

    return surfaces.some(surface => {
      const result = layoutEngine(elements, surface);
      return result.hiddenCount > 0;
    });
  }, [elements, surfaces]);

  const handleEnhance = async () => {
    setResultMessage(null);
    const result = await optimizeCopy(elements, surfaces);
    
    if (result.success && result.elements) {
      onChange(result.elements);
      setResultMessage({ type: 'success', text: result.message });
    } else {
      setResultMessage({ type: 'error', text: result.message });
    }
  };

  // If there's no layout issue and we don't have a success message to show, render nothing
  if (!hasHiddenElements && !resultMessage) {
    return null;
  }

  return (
    <div className={`mb-6 overflow-hidden rounded-xl border ${resultMessage?.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'} transition-colors duration-300`}>
      <div className="px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {resultMessage?.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          )}
          
          <div>
            <h3 className={`text-sm font-semibold ${resultMessage?.type === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
              {resultMessage?.type === 'success' ? 'Optimization Complete' : 'Layout Optimization Recommended'}
            </h3>
            <p className={`text-xs mt-1 max-w-xl ${resultMessage?.type === 'success' ? 'text-emerald-500/80' : 'text-amber-500/80'}`}>
              {resultMessage 
                ? resultMessage.text 
                : 'Some surfaces need copy optimization to prevent text overflow or hidden content.'}
            </p>
          </div>
        </div>

        {hasHiddenElements && (
          <button
            onClick={handleEnhance}
            disabled={isGenerating}
            className="shrink-0 relative overflow-hidden px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            {isGenerating && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            )}
            {isGenerating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-amber-950/30 border-t-amber-950 rounded-full animate-spin relative z-10" />
                <span className="relative z-10">Enhancing...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                <span>AI Enhance to Fit</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
