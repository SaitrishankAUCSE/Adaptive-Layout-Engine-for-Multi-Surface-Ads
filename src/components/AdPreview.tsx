import React, { useMemo } from "react";
import type { AdElement as AdElementType, Surface, LayoutResult } from "../engine/types";
import { layoutEngine } from "../engine/layoutEngine";
import AdElementRenderer from "./AdElement";

interface Props {
  elements: AdElementType[];
  surface: Surface;
  /** Pre-computed result from the parent. If provided, the engine is NOT called again. */
  precomputedResult?: LayoutResult;
  /** Max width of the rendered thumbnail in the grid (px). Default 320. */
  maxDisplayWidth?: number;
}

/** Maximum display height (px) for any preview thumbnail */
const MAX_DISPLAY_HEIGHT = 280;

/**
 * Renders the full ad layout for one surface at a scaled-down thumbnail size.
 *
 * The engine works entirely in real surface pixels (e.g. 1080×1920 for Story).
 * We scale the container down via CSS transform so it fits in the grid —
 * crucially, the internal pixel math stays correct; only the visual size changes.
 *
 * If `precomputedResult` is provided (e.g., from LivePreviewGrid which already
 * computed it), the engine is skipped entirely for this render.
 */
const AdPreview: React.FC<Props> = ({
  elements,
  surface,
  precomputedResult,
  maxDisplayWidth = 320,
}) => {
  const computed = useMemo(
    () => precomputedResult ?? layoutEngine(elements, surface),
    // Only re-run if precomputedResult changes or (when not provided) elements/surface change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [precomputedResult, elements, surface]
  );

  // Compute the scale factor so the preview fits within maxDisplayWidth × MAX_DISPLAY_HEIGHT
  const scaleX = maxDisplayWidth / surface.width;
  const scaleY = MAX_DISPLAY_HEIGHT / surface.height;
  const scale = Math.min(scaleX, scaleY, 1); // never upscale

  const displayW = Math.round(surface.width * scale);
  const displayH = Math.round(surface.height * scale);

  return (
    <div className="flex flex-col group relative">
      {/* Outer div establishes the display footprint in the DOM */}
      <div
        style={{
          width: displayW,
          height: displayH,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Inner div is the real surface size, then scaled down */}
        <div
          style={{
            width: surface.width,
            height: surface.height,
            position: "absolute",
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: "var(--background)",
            backgroundColor: "hsl(var(--card))",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--primary)/0.05) 1px, transparent 0)",
            backgroundSize: "16px 16px",
            overflow: "hidden",
          }}
        >
          {computed.elements.map((el) => (
            <AdElementRenderer key={el.id} el={el} scale={scale} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdPreview;
