import React, { useState } from "react";
import { Plus, X, Scan } from "lucide-react";
import type { Surface } from "../engine/types";
import { classifySurface } from "../engine/classify";

interface Props {
  onAdd: (surface: Surface) => void;
}

let customIdCounter = 1;

const SHAPE_META = {
  WIDE: { label: "WIDE", desc: "Horizontal layout (banner composition)", color: "#f0f1c7" },
  SQUARE: { label: "SQUARE", desc: "Balanced stacked layout", color: "#d0e5d8" },
  TALL: { label: "TALL", desc: "Vertical column layout (story composition)", color: "#6ee7b7" },
};

export const CustomSurface: React.FC<Props> = ({ onAdd }) => {
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(150);
  const [expanded, setExpanded] = useState(false);

  const shape = classifySurface({ id: "tmp", name: "", width, height });
  const meta = SHAPE_META[shape];
  const ar = height > 0 ? (width / height).toFixed(2) : "0.00";

  const isValid = width >= 50 && width <= 3000 && height >= 50 && height <= 3000;

  const handleAdd = () => {
    if (!isValid) return;
    onAdd({
      id: `custom-${customIdCounter++}`,
      name: `Custom ${width}×${height}`,
      width,
      height,
      custom: true,
    });
    setExpanded(false);
  };

  const setExample = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  };

  return (
    <div className="relative inline-block z-40">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm ${
          expanded
            ? "bg-white/15 text-white border-white/30"
            : "bg-white/[0.04] text-muted-foreground hover:text-white hover:bg-white/[0.08] border-white/10"
        }`}
      >
        {expanded ? <X size={13} /> : <Plus size={13} />}
        <span>Custom Surface</span>
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/15 bg-black/90 backdrop-blur-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Scan size={14} className="text-primary/90" />
              <span>Add Custom Ad Surface</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] uppercase font-mono text-muted-foreground">Example:</span>
            <button
              type="button"
              onClick={() => setExample(500, 150)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-primary border border-white/10 transition-colors cursor-pointer"
            >
              500 × 150 (Spec)
            </button>
            <button
              type="button"
              onClick={() => setExample(600, 314)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              600 × 314
            </button>
          </div>

          {/* Dimensions Inputs */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Width (px)</label>
              <input
                type="number"
                min={50}
                max={3000}
                value={width}
                onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Height (px)</label>
              <input
                type="number"
                min={50}
                max={3000}
                value={height}
                onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 font-mono"
              />
            </div>
          </div>

          {/* Live AR & Classification Preview */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 mb-3 text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-muted-foreground text-[11px]">
                Aspect Ratio: <span className="text-white font-semibold">{ar}</span>
              </span>
              <span
                className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: meta.color,
                  borderColor: `${meta.color}40`,
                  backgroundColor: `${meta.color}15`,
                }}
              >
                {meta.label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
          </div>

          {/* Add Button */}
          {!isValid && (
            <p className="text-[10px] text-red-400 mb-2">
              Width and height must be between 50px and 3000px.
            </p>
          )}
          <button
            onClick={handleAdd}
            disabled={!isValid}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-[#f2f0ea] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
          >
            <Plus size={14} />
            <span>Add to Preview Grid</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomSurface;
