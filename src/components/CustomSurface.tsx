import React, { useState, useEffect } from "react";
import { Plus, X, Scan, Sparkles, LayoutTemplate } from "lucide-react";
import type { Surface } from "../engine/types";
import { classifySurface } from "../engine/classify";

interface Props {
  onAdd: (surface: Surface) => void;
}

let customIdCounter = 1;

interface Preset {
  name: string;
  width: number;
  height: number;
  category: string;
}

const PRESETS: Preset[] = [
  { name: "In-App Reward", width: 500, height: 150, category: "Mobile Game Spec" },
  { name: "Mobile Interstitial", width: 360, height: 640, category: "Full-Screen App" },
  { name: "Newsletter Banner", width: 600, height: 200, category: "Email Header" },
  { name: "DOOH Billboard", width: 1920, height: 480, category: "Digital Outdoor" },
  { name: "Meta Landscape", width: 1200, height: 628, category: "Sponsored Feed" },
  { name: "Square Carousel", width: 800, height: 800, category: "Product Showcase" },
];

const SHAPE_META = {
  WIDE: {
    label: "WIDE",
    desc: "Horizontal flow: Side-by-side image, headline, and inline CTA button.",
    color: "#f0f1c7",
    bg: "rgba(240, 241, 199, 0.1)",
    border: "rgba(240, 241, 199, 0.3)",
  },
  SQUARE: {
    label: "SQUARE",
    desc: "Balanced stack: Prominent centered hero visual with stacked copy hierarchy.",
    color: "#d0e5d8",
    bg: "rgba(208, 229, 216, 0.1)",
    border: "rgba(208, 229, 216, 0.3)",
  },
  TALL: {
    label: "TALL",
    desc: "Vertical column: Full-bleed background visual, overlay headline, bottom CTA bar.",
    color: "#6ee7b7",
    bg: "rgba(110, 231, 183, 0.1)",
    border: "rgba(110, 231, 183, 0.3)",
  },
};

export const CustomSurface: React.FC<Props> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [surfaceName, setSurfaceName] = useState("");
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(150);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const shape = classifySurface({ id: "tmp", name: "", width, height });
  const meta = SHAPE_META[shape];
  const ar = height > 0 ? (width / height).toFixed(2) : "0.00";
  const isValid = width >= 50 && width <= 3840 && height >= 50 && height <= 3840;

  const handleAdd = () => {
    if (!isValid) return;
    const finalName = surfaceName.trim() || `Custom ${width}×${height}`;
    onAdd({
      id: `custom-${Date.now()}-${customIdCounter++}`,
      name: finalName,
      width,
      height,
      custom: true,
    });
    setIsOpen(false);
    setSurfaceName("");
  };

  const applyPreset = (preset: Preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setSurfaceName(preset.name);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
      >
        <Plus size={13} className="text-primary stroke-[2.5]" />
        <span>Custom Surface</span>
      </button>

      {/* Modal Dialog for both Desktop & Mobile (Centered, no clipping, fully responsive) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          {/* Backdrop Click */}
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog Body */}
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e0e0e]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl shadow-black/80 text-foreground z-10 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary shrink-0 shadow-sm">
                  <Scan size={16} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                    Create Custom Surface
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                      Adaptive
                    </span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Synthesize layouts dynamically for non-standard ad formats
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-2">
                <Sparkles size={11} className="text-primary" />
                <span>Industry Presets</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PRESETS.map((p) => {
                  const isSelected = width === p.width && height === p.height;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`flex flex-col text-left p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary/50 bg-primary/15 text-white shadow-sm"
                          : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      <span className="font-semibold text-[11px] truncate">{p.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {p.width}×{p.height}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3 mb-4">
              {/* Optional Name */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Surface Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g., Reward Banner ${width}×${height}`}
                  value={surfaceName}
                  onChange={(e) => setSurfaceName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>

              {/* Width & Height */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={3840}
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/60 font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={3840}
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/60 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Real-time Classification & Engine Rules Preview */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <LayoutTemplate size={13} className="text-muted-foreground" />
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Aspect Ratio: <strong className="text-white font-semibold">{ar} : 1</strong>
                  </span>
                </div>
                <span
                  className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: meta.color,
                    borderColor: meta.border,
                    backgroundColor: meta.bg,
                  }}
                >
                  {meta.label} Format
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {meta.desc}
              </p>
            </div>

            {/* Validation Message */}
            {!isValid && (
              <p className="text-[11px] text-red-400 mb-3 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                Dimensions must be between 50px and 3840px.
              </p>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-1/3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!isValid}
                className="w-2/3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-[#f2f0ea] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-white/10"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add to Preview Canvas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomSurface;
