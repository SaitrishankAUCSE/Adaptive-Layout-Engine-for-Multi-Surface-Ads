import React from "react";
import type { AdElement, Surface, LayoutResult } from "../engine/types";
import AdPreview from "./AdPreview";

interface Props {
  elements: AdElement[];
  surface: Surface;
  layoutResult?: LayoutResult;
  maxDisplayWidth?: number;
}

export const SurfacePreview: React.FC<Props> = ({
  elements,
  surface,
  layoutResult,
  maxDisplayWidth,
}) => {
  return (
    <div className="surface-preview-container">
      <AdPreview
        elements={elements}
        surface={surface}
        precomputedResult={layoutResult}
        maxDisplayWidth={maxDisplayWidth}
      />
    </div>
  );
};

export default SurfacePreview;
