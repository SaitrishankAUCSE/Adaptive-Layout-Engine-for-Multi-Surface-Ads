import React from "react";
import { motion } from "framer-motion";
import { Check, Settings2, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import type { Surface } from "../engine/types";

interface Props {
  surfaces: Surface[];
  activeIds: string[];
  onChange: (ids: string[]) => void;
}

// Surfaces that belong to the social media group
const SOCIAL_IDS = new Set([
  "instagram-reel",
  "instagram-feed",
  "instagram-landscape",
  "twitter-post",
  "linkedin-banner",
  "og-image",
  "youtube-thumbnail",
]);

export const SurfaceTogglePanel: React.FC<Props> = ({ surfaces, activeIds, onChange }) => {
  const isAllActive = surfaces.length === activeIds.length;

  const toggle = (id: string) => {
    if (activeIds.includes(id)) {
      onChange(activeIds.filter((x) => x !== id));
    } else {
      onChange([...activeIds, id]);
    }
  };

  const reset = () => {
    if (isAllActive) return;
    onChange(surfaces.map((s) => s.id));
  };

  const iabSurfaces = surfaces.filter((s) => !SOCIAL_IDS.has(s.id));
  const socialSurfaces = surfaces.filter((s) => SOCIAL_IDS.has(s.id));

  const renderSurface = (surface: Surface) => {
    const isActive = activeIds.includes(surface.id);
    return (
      <div
        key={surface.id}
        onClick={() => toggle(surface.id)}
        className={`
          flex items-center justify-between p-2.5 rounded-lg text-sm transition-all
          cursor-pointer hover:bg-white/5 active:scale-[0.99]
          ${isActive ? "bg-white/[0.02]" : ""}
        `}
      >
        <div className="flex flex-col">
          <span className="font-medium text-[#ebebeb] text-xs sm:text-sm">
            {surface.name}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {surface.width} × {surface.height}
          </span>
        </div>

        <div
          className={`
            flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors
            ${
              isActive
                ? "bg-primary border-primary text-primary-foreground"
                : "border-white/20 bg-white/5"
            }
          `}
        >
          <motion.div
            initial={false}
            animate={{ scale: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check size={12} strokeWidth={3} />
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-black/40 backdrop-blur-3xl text-card-foreground shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Settings2 size={15} className="text-muted-foreground" />
          <h3 className="font-semibold text-sm text-[#f2f0ea]">Visible Surfaces</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={isAllActive}
          className="h-8 text-xs px-2.5 rounded-lg gap-1.5 transition-all text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <RotateCcw size={12} />
          Reset
        </Button>
      </div>

      <div className="p-2 space-y-4 overflow-y-auto max-h-[520px]">
        {/* IAB Display group */}
        {iabSurfaces.length > 0 && (
          <div>
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              IAB Display
            </p>
            <div className="space-y-0.5">
              {iabSurfaces.map(renderSurface)}
            </div>
          </div>
        )}

        {/* Social Media group */}
        {socialSurfaces.length > 0 && (
          <div>
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Social Media
            </p>
            <div className="space-y-0.5">
              {socialSurfaces.map(renderSurface)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
