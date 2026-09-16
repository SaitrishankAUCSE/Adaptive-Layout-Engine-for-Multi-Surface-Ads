import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdElement } from "./engine/types";
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

const App: React.FC = () => {
  const [view, setView] = useState<View>("editor");
  const [panelOpen, setPanelOpen] = useState(true);
  const [filter, setFilter] = useState<FilterShape>("ALL");
  const [elements, setElements] = useState<AdElement[]>(SAMPLE_AD);
  const [activeSurfaces, setActiveSurfaces] = useState<string[]>(
    SURFACES.map((s) => s.id)
  );
  const [mounted, setMounted] = useState(false);
  // Landing splash screen: shown on first load only
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleEnter = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setShowLanding(false);
  };

  const visibleSurfaces = SURFACES.filter((s) => activeSurfaces.includes(s.id));
  const filteredSurfaces =
    filter === "ALL"
      ? visibleSurfaces
      : visibleSurfaces.filter((s) => classifySurface(s) === filter);

  return (
    <div
      className="flex flex-col min-h-screen w-full bg-background text-foreground overflow-x-hidden selection:bg-primary/20"
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
          FLOATING NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[800px] px-4 pointer-events-none">
        <header
          className={cn(
            "pointer-events-auto flex h-[52px] items-center justify-between rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl px-4",
            "transition-all duration-700 delay-100",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          {/* Left: Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-sm">
              <AnysizeLogo size={14} />
            </div>
            <span className="text-[14px] font-semibold text-[#f2f0ea] tracking-tight">
              Anysize
            </span>
          </div>

          {/* Center nav */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "flex items-center justify-center px-5 h-7 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-[0.97]",
                  view === id
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right: empty — no extraneous buttons */}
        </header>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BODY — MAIN DASHBOARD (PLAYGROUND)
      ══════════════════════════════════════════════════════════ */}
      <div
        id="playground"
        className={cn(
          "relative z-10 flex w-full max-w-full px-4 gap-4 min-h-[calc(100vh-88px)] mt-[88px] pb-24 mx-auto",
          "transition-opacity duration-700 delay-150",
          mounted ? "opacity-100" : "opacity-0"
        )}
      >
        {/* ── LEFT EDITOR PANEL ─────────────────────────────────── */}
        {view === "editor" && (
          <aside
            className={cn(
              "sticky top-[88px] flex flex-col h-[calc(100vh-108px)] shrink-0 border border-white/[0.07] rounded-xl bg-black/50 backdrop-blur-2xl overflow-hidden shadow-2xl z-20",
              "transition-[width] duration-300 ease-in-out"
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

            {/* Toggle button — always visible, anchored to the right edge */}
            <button
              onClick={() => setPanelOpen((p) => !p)}
              title={panelOpen ? "Collapse editor" : "Expand editor"}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -right-3.5 z-20",
                "flex h-7 w-7 items-center justify-center rounded-full",
                "bg-black/80 border border-white/15 text-muted-foreground",
                "hover:text-white hover:border-white/30 hover:bg-black/90",
                "shadow-lg transition-all cursor-pointer active:scale-95"
              )}
            >
              {panelOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </button>
          </aside>
        )}

        {/* ── SURFACES CONFIG PANEL ─────────────────────────────── */}
        {view === "surfaces" && (
          <aside className="sticky top-[88px] flex flex-col h-[calc(100vh-108px)] w-72 shrink-0 border border-white/[0.07] rounded-xl bg-black/50 backdrop-blur-2xl overflow-y-auto p-4 gap-4 shadow-2xl z-20">
            <div>
              <h2 className="text-sm font-semibold text-[#f2f0ea] tracking-tight mb-0.5">
                Surface Configuration
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Toggle which ad surfaces are active in the canvas.
              </p>
            </div>
            <SurfaceTogglePanel
              surfaces={SURFACES}
              activeIds={activeSurfaces}
              onChange={setActiveSurfaces}
            />
          </aside>
        )}

        {/* ── MAIN CANVAS ───────────────────────────────────────── */}
        <main className="flex-1 min-w-0 relative">
          <div className="p-4 md:p-8">

            <AnimatePresence mode="wait">
              {view === "editor" && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-6">
                    <h1 className="text-xl font-semibold tracking-[-0.04em] bg-gradient-to-r from-[#f0f1c7] via-[#d0e5d8] via-[46%] to-[#ffffff] bg-clip-text text-transparent">
                      Live Preview Canvas
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Adapting to {filteredSurfaces.length} formats dynamically
                    </p>
                  </div>
                  <LivePreviewGrid elements={elements} surfaces={filteredSurfaces} />
                </motion.div>
              )}

              {view === "surfaces" && (
                <motion.div
                  key="surfaces"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-6">
                    <h1 className="text-xl font-semibold tracking-tight text-[#f2f0ea]">
                      Surface Preview Validation
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Evaluating {filteredSurfaces.length} of {visibleSurfaces.length} active formats
                    </p>
                  </div>
                  <LivePreviewGrid elements={elements} surfaces={filteredSurfaces} />
                </motion.div>
              )}

              {view === "demo" && (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-10"
                >
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-[#f2f0ea]">
                      Heuristic Resolution Comparison
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Analyze raw content overflow versus engine-resolved layout geometries.
                    </p>
                  </div>
                  <CompareDemo elements={elements} />
                  <EngineInspector elements={elements} />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ── FLOATING FILTER DOCK ──────────────────────────────── */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="pointer-events-auto">
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                <SurfaceTabs
                  filter={filter}
                  onChange={setFilter}
                  surfaces={visibleSurfaces}
                />
              </div>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
};

export default App;

