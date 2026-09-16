import React, { useState, useCallback, useMemo } from "react";
import type { AdElement as AdElementType, Surface } from "../engine/types";
import { layoutEngine } from "../engine/layoutEngine";
import { classifySurface } from "../engine/classify";
import AdPreview from "./AdPreview";
import { Check, Copy, LayoutTemplate, ShieldCheck } from "lucide-react";

interface Props {
  elements: AdElementType[];
  surfaces: Surface[];
}

const SOCIAL_IDS = new Set([
  "instagram-reel",
  "instagram-feed",
  "instagram-landscape",
  "twitter-post",
  "linkedin-banner",
  "og-image",
  "youtube-thumbnail",
]);

const getCategoryLabel = (id: string): string => {
  if (id === "instagram-reel") return "Social Vertical (9:16)";
  if (id === "youtube-thumbnail") return "Video Stream (16:9)";
  if (id === "linkedin-banner") return "Professional Header";
  if (SOCIAL_IDS.has(id)) return "Social Feed";
  return "IAB Standard Display";
};

const getTemplateLabel = (templateName?: string): string => {
  switch (templateName) {
    case "HORIZONTAL":
      return "Horizontal Strip";
    case "CENTERED_STACK":
      return "Centered Hierarchy";
    case "VERTICAL_STACK":
      return "Vertical Column";
    default:
      return templateName || "Adaptive";
  }
};

export const LivePreviewGrid: React.FC<Props> = ({ elements, surfaces }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute all layout results once
  const results = useMemo(
    () => Object.fromEntries(surfaces.map((s) => [s.id, layoutEngine(elements, s)])),
    [elements, surfaces]
  );

  const handleCopySpec = useCallback(
    (surfaceId: string) => {
      const result = results[surfaceId];
      if (!result) return;
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedId(surfaceId);
      setTimeout(() => setCopiedId(null), 1500);
    },
    [results]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
      {surfaces.map((surface) => {
        const shape = classifySurface(surface);
        const result = results[surface.id];
        const isCopied = copiedId === surface.id;
        const category = getCategoryLabel(surface.id);
        const templateLabel = getTemplateLabel(result?.template);
        const hiddenCount = result?.hiddenCount ?? 0;
        const totalElements = elements.length;
        const retainedCount = Math.max(0, totalElements - hiddenCount);

        return (
          <div
            key={surface.id}
            className="flex flex-col rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-4 transition-all duration-300 hover:border-white/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.7)] group/surface"
          >
            {/* Surface Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-[#f2f0ea] tracking-tight truncate">
                    {surface.name}
                  </h3>
                  <span
                    className={`text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      shape === "WIDE"
                        ? "text-[#f0f1c7] border-[#f0f1c7]/20 bg-[#f0f1c7]/5"
                        : shape === "TALL"
                        ? "text-[#d0e5d8] border-[#d0e5d8]/20 bg-[#d0e5d8]/5"
                        : "text-white/80 border-white/10 bg-white/5"
                    }`}
                  >
                    {shape}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/80 tracking-normal truncate">
                  {category}
                </p>
              </div>

              {/* Dimensions & Copy Action */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-muted-foreground font-mono text-[10.5px] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
                  {surface.width}×{surface.height}
                </span>

                <button
                  onClick={() => handleCopySpec(surface.id)}
                  title={isCopied ? "Copied to clipboard!" : "Copy layout JSON specification"}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>

            {/* Preview Viewport */}
            <div className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/60 flex items-center justify-center p-3 mb-3 min-h-[160px]">
              <AdPreview
                elements={elements}
                surface={surface}
                precomputedResult={result}
                maxDisplayWidth={280}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-xl" />
            </div>

            {/* Surface Footer Status */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                <LayoutTemplate size={11} className="text-muted-foreground/60" />
                {templateLabel}
              </span>

              {hiddenCount === 0 ? (
                <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                  <ShieldCheck size={11} />
                  Optimal Fit ({retainedCount}/{totalElements})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {hiddenCount} Pruned ({retainedCount}/{totalElements})
                </span>
              )}
            </div>
          </div>
        );
      })}

      {surfaces.length === 0 && (
        <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
          <p className="text-sm font-medium text-[#f2f0ea] mb-1">No Active Surfaces Selected</p>
          <p className="text-xs text-muted-foreground">
            Activate target surface formats in the Surfaces tab to view layout adaptation.
          </p>
        </div>
      )}
    </div>
  );
};
