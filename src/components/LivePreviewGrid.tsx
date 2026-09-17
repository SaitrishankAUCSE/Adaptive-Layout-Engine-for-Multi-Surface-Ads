import React, { useState, useCallback, useMemo } from "react";
import type { AdElement as AdElementType, Surface, LayoutResult } from "../engine/types";
import { layoutEngine } from "../engine/layoutEngine";
import { classifySurface } from "../engine/classify";
import { isElementFullyFitted } from "../engine/textFit";
import AdPreview from "./AdPreview";
import {
  Check,
  Copy,
  LayoutTemplate,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Cpu,
} from "lucide-react";

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
  if (id === "banner") return "IAB Standard Display";
  if (id === "instagram-reel" || id === "story") return "Social Vertical (9:16)";
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
  const [expandedDecisions, setExpandedDecisions] = useState<Record<string, boolean>>({});
  const [modalSurface, setModalSurface] = useState<Surface | null>(null);

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

  const toggleDecisions = (surfaceId: string) => {
    setExpandedDecisions((prev) => ({
      ...prev,
      [surfaceId]: !prev[surfaceId],
    }));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
        {surfaces.map((surface) => {
          const shape = classifySurface(surface);
          const result: LayoutResult | undefined = results[surface.id];
          const isCopied = copiedId === surface.id;
          const isDecisionsOpen = !!expandedDecisions[surface.id];
          const category = getCategoryLabel(surface.id);
          const templateLabel = getTemplateLabel(result?.template);
          
          const activeElements = elements.filter((el) => el.content && el.content.trim() !== "");
          const totalElements = activeElements.length;
          const visibleCount = result
            ? result.elements.filter((p) => isElementFullyFitted(p)).length
            : 0;
          const isFullyVisible = visibleCount === totalElements;
          const truncatedTypes = result
            ? result.elements
                .filter((p) => p.visible && p.content && !isElementFullyFitted(p))
                .map((p) => p.type)
            : [];
          const decisions = [
            ...(result?.decisions ?? []),
            ...truncatedTypes.map(
              (type) => `${type.charAt(0).toUpperCase() + type.slice(1)} text clipped by container bounds (-1 visible)`
            ),
          ];

          return (
            <div
              key={surface.id}
              className="relative flex flex-col rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] group/surface"
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

                {/* Dimensions & Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground font-mono text-[10.5px] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-md">
                    {surface.width}×{surface.height}
                  </span>

                  <button
                    onClick={() => setModalSurface(surface)}
                    title="Open full-screen preview"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Maximize2 size={12} />
                  </button>

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

              {/* Preview Viewport (Click to expand fullscreen) */}
              <div
                onClick={() => setModalSurface(surface)}
                className="relative rounded-xl overflow-hidden border border-white/[0.06] bg-black/60 flex items-center justify-center p-3 mb-3 min-h-[160px] cursor-pointer group/preview"
                title="Click to view full preview"
              >
                <AdPreview
                  elements={elements}
                  surface={surface}
                  precomputedResult={result}
                  maxDisplayWidth={280}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none rounded-xl" />
                <div className="absolute top-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity bg-black/70 backdrop-blur-sm p-1 rounded-md text-white/80">
                  <Maximize2 size={11} />
                </div>
              </div>

              {/* Surface Footer Status */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground font-mono">
                  <LayoutTemplate size={11} className="text-muted-foreground/60" />
                  {templateLabel}
                </span>

                <button
                  type="button"
                  onClick={() => toggleDecisions(surface.id)}
                  className="flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer hover:underline"
                >
                  {isFullyVisible ? (
                    <span className="flex items-center gap-1 text-emerald-400/90 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck size={11} />
                      {visibleCount}/{totalElements} visible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400/90 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                      <span className="relative flex h-1.5 w-1.5 mr-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                      {visibleCount}/{totalElements} visible
                    </span>
                  )}
                  {isDecisionsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {/* ── MAKE THE ALGORITHM VISIBLE: Layout Decisions Section ── */}
              {isDecisionsOpen && (
                <div className="mt-3 pt-3 border-t border-white/[0.07] bg-white/[0.02] -mx-4 -mb-4 p-3.5 rounded-b-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1">
                      <Cpu size={11} className="text-primary/70" />
                      Layout Decisions ({surface.name} — {surface.width}×{surface.height})
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {visibleCount}/{totalElements} elements
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-white/80 font-sans">
                    {decisions.map((decision, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary/70 mt-0.5">•</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

      {/* ── Fullscreen Preview Modal ─────────────────────────────── */}
      {modalSurface && (() => {
        const modalResult = results[modalSurface.id];
        const modalActive = elements.filter((el) => el.content && el.content.trim() !== "");
        const modalTotal = modalActive.length;
        const modalVisCount = modalResult
          ? modalResult.elements.filter((p) => isElementFullyFitted(p)).length
          : 0;
        const modalFullyVis = modalVisCount === modalTotal;
        const modalTruncatedTypes = modalResult
          ? modalResult.elements
              .filter((p) => p.visible && p.content && !isElementFullyFitted(p))
              .map((p) => p.type)
          : [];
        const modalDecisions = [
          ...(modalResult?.decisions ?? []),
          ...modalTruncatedTypes.map(
            (type) => `${type.charAt(0).toUpperCase() + type.slice(1)} text clipped by container bounds (-1 visible)`
          ),
        ];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-6">
            <div className="relative max-w-5xl w-full max-h-[90vh] bg-[#0c0d0e] border border-white/15 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-white">
                    {modalSurface.name}
                  </h2>
                  <span className="text-xs font-mono text-muted-foreground bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                    {modalSurface.width} × {modalSurface.height} px
                  </span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    {classifySurface(modalSurface)}
                  </span>
                  <span
                    className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                      modalFullyVis
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}
                  >
                    {modalVisCount}/{modalTotal} visible
                  </span>
                </div>
                <button
                  onClick={() => setModalSurface(null)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Canvas */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-black/40 rounded-2xl my-4 min-h-[300px]">
                <AdPreview
                  elements={elements}
                  surface={modalSurface}
                  precomputedResult={modalResult}
                  maxDisplayWidth={Math.min(modalSurface.width, 700)}
                />
              </div>

              {/* Modal Footer Decisions */}
              <div className="shrink-0 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Autonomous Engine Decisions
                </div>
                <div className="flex flex-wrap gap-2">
                  {modalDecisions.map((d, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-white/80"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
