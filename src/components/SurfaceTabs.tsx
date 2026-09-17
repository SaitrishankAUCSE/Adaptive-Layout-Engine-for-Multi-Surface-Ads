import React from "react";
import { LayoutTemplate, Monitor, Smartphone, Square } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import type { Surface } from "../engine/types";
import { classifySurface } from "../engine/classify";

export type FilterShape = "ALL" | "WIDE" | "SQUARE" | "TALL";

interface Props {
  filter: FilterShape;
  onChange: (filter: FilterShape) => void;
  surfaces: Surface[];
}

export const SurfaceTabs: React.FC<Props> = ({ filter, onChange, surfaces }) => {
  const counts = {
    ALL: surfaces.length,
    WIDE: surfaces.filter((s) => classifySurface(s) === "WIDE").length,
    SQUARE: surfaces.filter((s) => classifySurface(s) === "SQUARE").length,
    TALL: surfaces.filter((s) => classifySurface(s) === "TALL").length,
  };

  return (
    <Tabs value={filter} onValueChange={(v) => onChange(v as FilterShape)} className="w-auto max-w-full">
      <TabsList className="bg-transparent border-none p-0 h-auto flex flex-nowrap items-center justify-start rounded-none gap-0.5 shadow-none whitespace-nowrap overflow-x-auto no-scrollbar">
        <TabsTrigger 
          value="ALL" 
          className="gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-white transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm cursor-pointer"
        >
          <LayoutTemplate size={13} />
          <span>All</span>
          <span className="px-1.5 py-0 text-[10px] font-mono rounded bg-white/5 text-muted-foreground ml-1">
            {counts.ALL}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="WIDE" 
          className="gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-white transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          <Monitor size={13} />
          <span>Wide</span>
          <span className="px-1.5 py-0 text-[10px] font-mono rounded bg-white/5 text-muted-foreground ml-1">
            {counts.WIDE}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="SQUARE" 
          className="gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-white transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          <Square size={13} />
          <span>Square</span>
          <span className="px-1.5 py-0 text-[10px] font-mono rounded bg-white/5 text-muted-foreground ml-1">
            {counts.SQUARE}
          </span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="TALL" 
          className="gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-white transition-all data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm"
        >
          <Smartphone size={13} />
          <span>Tall</span>
          <span className="px-1.5 py-0 text-[10px] font-mono rounded bg-white/5 text-muted-foreground ml-1">
            {counts.TALL}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
