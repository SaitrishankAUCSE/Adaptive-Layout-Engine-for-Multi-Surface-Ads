import React, { useState, useRef, useEffect, useCallback } from "react";
import { MoveHorizontal } from "lucide-react";
import type { AdElement, Surface } from "../engine/types";
import AdPreview from "./AdPreview";

interface Props {
  elements: AdElement[];
  surface: Surface;
}

export const CompareDemo: React.FC<Props> = ({ elements, surface }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false); // ref instead of state — no re-render on drag flag change
  const rafRef = useRef<number>(0);

  const headline = elements.find((e) => e.id === "headline")?.content ?? "";

  const maxDisplayWidth = 720;
  const maxDisplayHeight = 400;

  const scaleX = maxDisplayWidth / surface.width;
  const scaleY = maxDisplayHeight / surface.height;
  const scale = Math.min(scaleX, scaleY, 1);

  const displayW = Math.round(surface.width * scale);
  const displayH = Math.round(surface.height * scale);

  // Throttle via requestAnimationFrame to avoid 60 setState calls per second
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setPosition((x / rect.width) * 100);
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="flex flex-col gap-6 max-w-[800px] mx-auto w-full">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-base font-semibold tracking-tight text-[#f2f0ea]">
          Raw overflow vs. engine-resolved layout
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Drag the divider. Left: raw paste, no constraints. Right: engine output — font scaled,
          elements positioned, priority pruning applied.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl select-none touch-none flex items-center justify-center shadow-2xl cursor-ew-resize transition-[height] duration-300 ease-out"
        style={{ height: Math.max(240, displayH + 80) }}
        onPointerDown={() => { isDraggingRef.current = true; }}
      >
        {/* Left: Raw — no engine */}
        <div
          className="absolute inset-0 bg-background flex flex-col items-center justify-center overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(239,68,68,0.06)_1px,transparent_0)] [background-size:16px_16px] pointer-events-none" />
          
          <div 
            className="relative overflow-visible shrink-0 bg-black/80 border border-destructive/40 rounded-lg shadow-2xl"
            style={{ width: displayW, height: displayH }}
          >
            <div 
              style={{
                width: surface.width, 
                height: surface.height,
                transform: `scale(${scale})`,
                transformOrigin: "top left"
              }}
              className="absolute top-0 left-0 flex items-center px-4"
            >
              <span className="text-4xl font-bold whitespace-nowrap text-foreground">
                {headline || "Your headline here"}
              </span>
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-destructive/80 text-destructive-foreground text-[9px] font-bold rounded-sm uppercase tracking-wider z-50">
              No Engine
            </div>
          </div>
        </div>

        {/* Right: Engine-adapted */}
        <div
          className="absolute inset-0 bg-background flex items-center justify-center"
          style={{ clipPath: `polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(240,241,199,0.05)_1px,transparent_0)] [background-size:16px_16px] pointer-events-none" />
          <div className="relative z-10 shrink-0 shadow-2xl border border-primary/30 rounded-lg overflow-hidden bg-black/80">
            <AdPreview elements={elements} surface={surface} maxDisplayWidth={maxDisplayWidth} maxDisplayHeight={maxDisplayHeight} />
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 text-primary-foreground text-[9px] font-bold rounded-sm uppercase tracking-wider shadow-sm z-50">
              Engine
            </div>
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-background border border-white/20 rounded-full flex items-center justify-center shadow-lg">
            <MoveHorizontal size={13} className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};
