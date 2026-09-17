import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdElement, Surface } from "./engine/types";
import { SAMPLE_AD } from "./data/sampleAd";
import { SURFACES } from "./data/surfaces";
import { LivePreviewGrid } from "./components/LivePreviewGrid";
import { SurfaceTabs, type FilterShape } from "./components/SurfaceTabs";
import { SurfaceTogglePanel } from "./components/SurfaceTogglePanel";
import { CompareDemo } from "./components/CompareDemo";
import { EngineInspector } from "./components/EngineInspector";
import { classifySurface } from "./engine/classify";
import AdEditor from "./components/AdEditor";
import { LandingScreen } from "./components/LandingScreen";

import {
  LayoutTemplate,
  Edit3,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "./lib/utils";

type View = "editor" | "surfaces" | "demo";

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "editor", label: "Editor", icon: <Edit3 size={14} /> },
  { id: "surfaces", label: "Surfaces", icon: <LayoutTemplate size={14} /> },
  { id: "demo", label: "Demo", icon: <Play size={14} /> },
];

const AnysizeLogo = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 8V4H8M16 4H20V8M20 16V20H16M8 20H4V16"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
  </svg>
);

import { CustomSurface } from "./components/CustomSurface";

const App: React.FC = () => {
  const [view, setView] = useState<View>("editor");
  const [panelOpen, setPanelOpen] = useState(true);
  const [filter, setFilter] = useState<FilterShape>("ALL");
  const [elements, setElements] = useState<AdElement[]>(SAMPLE_AD);
  const [debouncedElements, setDebouncedElements] = useState<AdElement[]>(SAMPLE_AD);
  const [surfacesList, setSurfacesList] = useState<Surface[]>(SURFACES);
  const [activeSurfaces, setActiveSurfaces] = useState<string[]>(
    SURFACES.map((s) => s.id)
  );
  const [showLanding, setShowLanding] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedElements(elements);
    }, 120);
    return () => clearTimeout(timer);
  }, [elements]);

  const handleEnter = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setShowLanding(false);
  };

  const handleAddCustomSurface = (newSurface: Surface) => {
    setSurfacesList((prev) => [newSurface, ...prev]);
    setActiveSurfaces((prev) => [newSurface.id, ...prev]);
  };

  const visibleSurfaces = surfacesList.filter((s) => activeSurfaces.includes(s.id));
  const filteredSurfaces =
    filter === "ALL"
      ? visibleSurfaces
      : visibleSurfaces.filter((s) => classifySurface(s) === filter);

  return (
    <div
      style={{ width: "calc(100vw / 0.75)", height: "calc(100vh / 0.75)" }}
      className="flex flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20"
    >

      {/* ── Landing splash screen — overlays everything until dismissed ── */}
      {showLanding && (
        <LandingScreen onEnter={handleEnter} />
      )}

      {/* ── Ambient background gradient ──────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,241,199,0.055),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          TOP NAVIGATION HEADER (STRICTLY FIXED)
      ══════════════════════════════════════════════════════════ */}
      <header className="flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl px-5 shrink-0 z-30">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-sm">
            <AnysizeLogo size={14} />
          </div>
          <span className="text-[14px] font-semibold text-[#f2f0ea] tracking-tight">
            Anysize
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-muted-foreground ml-1">
            Multi-Surface Engine
          </span>
        </div>

        {/* Center: View Switcher */}
        <nav className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.06]">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 h-7 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-[0.97]",
                view === id
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Active status count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
            {filteredSurfaces.length} Formats Active
          </span>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          MAIN WORKSPACE BODY (LEFT FIXED, RIGHT SCROLLABLE)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative z-10">
        {/* ── LEFT EDITOR PANEL (STRICTLY FIXED, NEVER MOVES) ───── */}
        {view === "editor" && (
          <aside
            className={cn(
              "h-full shrink-0 border-r border-white/[0.08] bg-black/40 backdrop-blur-2xl overflow-hidden relative z-20 transition-[width] duration-300 ease-in-out flex flex-col"
            )}
            style={{ width: panelOpen ? 340 : 48 }}
          >
            {/* Collapsed icon rail */}
            {!panelOpen && (
              <div className="flex flex-col items-center pt-4 gap-3">
                <button
                  onClick={() => setPanelOpen(true)}
                  title="Open editor"
                  className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}

            {/* Expanded editor content */}
            {panelOpen && (
              <div className="flex flex-col h-full overflow-hidden">
                <AdEditor elements={elements} onChange={setElements} />
              </div>
            )}

            {/* Toggle button — anchored to the right border of the sidebar */}
            <button
              onClick={() => setPanelOpen((p) => !p)}
              title={panelOpen ? "Collapse editor" : "Expand editor"}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -right-3 z-30",
                "flex h-6 w-6 items-center justify-center rounded-full",
                "bg-black/90 border border-white/20 text-muted-foreground",
                "hover:text-white hover:border-white/40 hover:bg-black",
                "shadow-lg transition-all cursor-pointer active:scale-95"
              )}
            >
              {panelOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </button>
          </aside>
        )}

        {/* ── SURFACES CONFIG PANEL (STRICTLY FIXED) ─────────────── */}
        {view === "surfaces" && (
          <aside className="h-full w-72 shrink-0 border-r border-white/[0.08] bg-black/40 backdrop-blur-2xl overflow-y-auto p-4 gap-4 flex flex-col z-20">
            <div>
              <h2 className="text-sm font-semibold text-[#f2f0ea] tracking-tight mb-0.5">
                Surface Configuration
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Toggle which ad surfaces are active in the canvas.
              </p>
            </div>
            <SurfaceTogglePanel
              surfaces={surfacesList}
              activeIds={activeSurfaces}
              onChange={setActiveSurfaces}
            />
          </aside>
        )}

        {/* ── MAIN CANVAS (ONLY THIS RIGHT SIDE SCROLLS) ─────────── */}
        <main className="flex-1 h-full overflow-y-auto relative p-6 md:p-8">
          <AnimatePresence mode="wait">
            {view === "editor" && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="pb-20"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-semibold tracking-[-0.04em] bg-gradient-to-r from-[#f0f1c7] via-[#d0e5d8] via-[46%] to-[#ffffff] bg-clip-text text-transparent">
                      Live Preview Canvas
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Adapting to {filteredSurfaces.length} formats dynamically
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center p-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
                      <SurfaceTabs
                        filter={filter}
                        onChange={setFilter}
                        surfaces={visibleSurfaces}
                      />
                    </div>
                    <CustomSurface onAdd={handleAddCustomSurface} />
                  </div>
                </div>
                <LivePreviewGrid elements={debouncedElements} surfaces={filteredSurfaces} />
              </motion.div>
            )}

            {view === "surfaces" && (
              <motion.div
                key="surfaces"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="pb-20"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[#f2f0ea]">
                      Surface Preview Validation
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Evaluating {filteredSurfaces.length} of {visibleSurfaces.length} active formats
                    </p>
                  </div>
                  <div className="flex items-center p-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl">
                    <SurfaceTabs
                      filter={filter}
                      onChange={setFilter}
                      surfaces={visibleSurfaces}
                    />
                  </div>
                </div>
                <LivePreviewGrid elements={debouncedElements} surfaces={filteredSurfaces} />
              </motion.div>
            )}

            {view === "demo" && (
              <motion.div
                key="demo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10 pb-20"
              >
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-[#f2f0ea]">
                    Heuristic Resolution Comparison
                  </h1>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Analyze raw content overflow versus engine-resolved layout geometries.
                  </p>
                </div>
                <CompareDemo elements={debouncedElements} />
                <EngineInspector elements={debouncedElements} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
};

export default App;

