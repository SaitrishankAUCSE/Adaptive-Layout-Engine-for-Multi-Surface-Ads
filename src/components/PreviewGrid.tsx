import React, { useState } from "react";
import { LayoutTemplate, Monitor, Smartphone, Square } from "lucide-react";
import type { AdElement as AdElementType, Surface } from "../engine/types";
import { classifySurface } from "../engine/classify";
import AdPreview from "./AdPreview";

interface Props {
  elements: AdElementType[];
  surfaces: Surface[];
}

type FilterShape = "ALL" | "WIDE" | "SQUARE" | "TALL";

const FILTER_TABS: { shape: FilterShape; label: string; icon: React.ReactNode }[] = [
  { shape: "ALL", label: "All", icon: <LayoutTemplate size={12} /> },
  { shape: "WIDE", label: "Wide", icon: <Monitor size={12} /> },
  { shape: "SQUARE", label: "Square", icon: <Square size={12} /> },
  { shape: "TALL", label: "Tall", icon: <Smartphone size={12} /> },
];

const PreviewGrid: React.FC<Props> = ({ elements, surfaces }) => {
  const [filter, setFilter] = useState<FilterShape>("ALL");

  const filtered = filter === "ALL"
    ? surfaces
    : surfaces.filter((s) => classifySurface(s) === filter);

  return (
    <div className="preview-grid-container">
      {/* Filter tabs */}
      <div className="grid-filter-bar">
        {FILTER_TABS.map(({ shape, label, icon }) => {
          const count = shape === "ALL"
            ? surfaces.length
            : surfaces.filter((s) => classifySurface(s) === shape).length;
          return (
            <button
              key={shape}
              className={`filter-tab ${filter === shape ? "active" : ""}`}
              onClick={() => setFilter(shape)}
            >
              {icon}
              {label}
              <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="preview-grid">
        {filtered.map((surface) => (
          <div key={surface.id} className="preview-card">
            <AdPreview elements={elements} surface={surface} maxDisplayWidth={300} />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="grid-empty">
            <p>No surfaces match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewGrid;
