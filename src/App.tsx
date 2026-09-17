import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdElement, Surface } from "./engine/types";
import { SAMPLE_AD } from "./data/sampleAd";
import { SURFACES } from "./data/surfaces";
import { LivePreviewGrid } from "./components/LivePreviewGrid";
import { SurfaceTabs, type FilterShape } from "./components/SurfaceTabs";
import { SurfaceTogglePanel } from "./components/SurfaceTogglePanel";
import AdPreview from "./components/AdPreview";
import { classifySurface } from "./engine/classify";
import AdEditor from "./components/AdEditor";
import { AutoEnhanceBanner } from "./components/AutoEnhanceBanner";
import { ComparisonAIWordEnhancer } from "./components/ComparisonAIWordEnhancer";

const EngineInspector = React.lazy(() => import("./components/EngineInspector").then(module => ({ default: module.EngineInspector })));
import { LandingScreen } from "./components/LandingScreen";
import { CustomSurface } from "./components/CustomSurface";
import { DownloadModal } from "./components/DownloadModal";

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
  { id: "editor", label: "Creative Studio", icon: <Edit3 size={14} /> },
  { id: "surfaces", label: "Placement Matrix", icon: <LayoutTemplate size={14} /> },
  { id: "demo", label: "Comparison Lab", icon: <Play size={14} /> },
];

const AnysizeLogo = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 1. Top Wide Banner Surface */}
    <rect x="3" y="3" width="9.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.8" />
    {/* 2. Bottom Square Surface */}
    <rect x="3" y="9.5" width="9.5" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    {/* 3. Right Tall Story Surface */}
    <rect x="14.5" y="3" width="6.5" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

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
  const [demoSurfaceId, setDemoSurfaceId] = useState<string>(SURFACES[0].id);

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
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,241,199,0.08),transparent_70%)] animate-[ambient-pulse_8s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_42%,rgba(240,147,251,0.06),transparent_70%)] animate-[ambient-pulse_12s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Film-grain noise */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
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

        {/* Right: Active status count & Download button */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex text-[11px] font-semibold tracking-wide text-[#c8dfd0] bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-full shadow-sm">
            {filteredSurfaces.length} Formats Active
          </span>
          <DownloadModal
            elements={debouncedElements}
            surfaces={surfacesList}
            activeSurfaces={activeSurfaces}
          />
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
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10 pb-20"
              >
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                      Adaptive AI Engine Output
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {SURFACES.length} dynamic ad formats auto-generated from a single source of truth.
                    </p>
                  </div>
                </div>
                
                <ComparisonAIWordEnhancer elements={debouncedElements} onChange={setElements} />

                <AutoEnhanceBanner elements={debouncedElements} surfaces={SURFACES} onChange={setElements} />

                <div className="mb-12">
                  <LivePreviewGrid elements={debouncedElements} surfaces={SURFACES} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[#f2f0ea]">
                      Engine Output & Inspector
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Analyze the engine-resolved layout geometries and AST.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">Surface:</span>
                    <select
                      value={demoSurfaceId}
                      onChange={(e) => setDemoSurfaceId(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-[#ebebeb] focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono cursor-pointer"
                    >
                      {SURFACES.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0a0a0a] text-white">
                          {s.name} ({s.width}×{s.height})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-8 border border-white/10 rounded-xl bg-black/40 backdrop-blur-xl shadow-2xl relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(240,241,199,0.05)_1px,transparent_0)] [background-size:16px_16px] pointer-events-none" />
                  <div className="relative z-10 shrink-0 shadow-2xl border border-primary/30 rounded-lg overflow-hidden bg-black/80">
                    <AdPreview 
                      elements={debouncedElements} 
                      surface={SURFACES.find(s => s.id === demoSurfaceId) || SURFACES[0]} 
                      maxDisplayWidth={800} 
                      maxDisplayHeight={400} 
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 text-primary-foreground text-[9px] font-bold rounded-sm uppercase tracking-wider shadow-sm z-50">
                      Engine Output
                    </div>
                  </div>
                </div>

                <Suspense fallback={<div className="h-40 w-full animate-pulse bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground text-xs">Loading Inspector Module...</div>}>
                  <EngineInspector elements={debouncedElements} surface={SURFACES.find(s => s.id === demoSurfaceId) || SURFACES[0]} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
};

export default App;

