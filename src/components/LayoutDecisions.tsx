import React from "react";
import { Cpu } from "lucide-react";

interface Props {
  surfaceName: string;
  dimensions: { width: number; height: number };
  decisions: string[];
  visibleCount: number;
  totalCount: number;
}

export const LayoutDecisions: React.FC<Props> = ({
  surfaceName,
  dimensions,
  decisions,
  visibleCount,
  totalCount,
}) => {
  return (
    <div className="layout-decisions-panel rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs font-sans">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1">
          <Cpu size={11} className="text-primary/70" />
          {surfaceName} — {dimensions.width}×{dimensions.height}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {visibleCount}/{totalCount} elements visible
        </span>
      </div>
      <ul className="space-y-1 text-[11px] text-white/80">
        {decisions.map((decision, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <span className="text-primary/70 mt-0.5">•</span>
            <span>{decision}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LayoutDecisions;
