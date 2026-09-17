import React, { useState } from "react";
import {
  Download,
  X,
  Check,
  Package,
  Layers,
  FileCode,
  FileImage,
  FileJson,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { AdElement, Surface } from "../engine/types";
import { exportCampaignLayouts, type ExportFormat } from "../lib/exportUtils";

interface Props {
  elements: AdElement[];
  surfaces: Surface[];
  activeSurfaces: string[];
}

export const DownloadModal: React.FC<Props> = ({
  elements,
  surfaces,
  activeSurfaces,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSurfaceIds, setSelectedSurfaceIds] = useState<string[]>(() =>
    surfaces.map((s) => s.id)
  );
  const [format, setFormat] = useState<ExportFormat>("bundle");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const activeFilteredSurfaces = surfaces.filter((s) => activeSurfaces.includes(s.id));

  const toggleSurface = (id: string) => {
    setSelectedSurfaceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedSurfaceIds(surfaces.map((s) => s.id));
  const selectNone = () => setSelectedSurfaceIds([]);
  const selectActiveOnly = () =>
    setSelectedSurfaceIds(activeFilteredSurfaces.map((s) => s.id));

  const handleExport = async (surfacesToExport: Surface[]) => {
    if (surfacesToExport.length === 0) return;
    setIsExporting(true);
    setProgress({ current: 0, total: surfacesToExport.length, status: "Starting export…" });
    try {
      await exportCampaignLayouts({
        elements,
        surfaces: surfacesToExport,
        format,
        onProgress: (current, total, status) => {
          setProgress({ current, total, status });
        },
      });
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsOpen(false);
      }, 1800);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export encountered an issue. Please try again.");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="relative inline-block">
      {/* ── Main Trigger Button in Top Right Corner ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold
          bg-gradient-to-r from-amber-200/20 via-primary/25 to-emerald-300/20
          hover:from-amber-200/30 hover:via-primary/35 hover:to-emerald-300/30
          border border-primary/40 hover:border-primary/70 text-[#f2f0ea]
          shadow-[0_0_18px_rgba(240,241,199,0.12)] hover:shadow-[0_0_24px_rgba(240,241,199,0.22)]
          active:scale-[0.97] transition-all duration-200 cursor-pointer
        "
        title="Download layouts package"
      >
        <Download size={13} className="text-primary animate-pulse shrink-0" />
        <span className="hidden sm:inline">Download Layouts</span>
        <span className="sm:hidden text-xs">Export</span>
      </button>

      {/* ── Export Modal Dialog ── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
          }}
          className="flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => !isExporting && setIsOpen(false)}
        >
          <div
            style={{
              maxHeight: "90vh",
            }}
            className="
              relative w-full max-w-xl rounded-2xl border border-white/15
              bg-[#0e0e11] text-foreground shadow-2xl overflow-hidden
              animate-in zoom-in-95 duration-150 flex flex-col my-auto
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
                  <Package size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f2f0ea]">
                    Export Campaign Creatives
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Download production-ready ad packages across all or selected surfaces
                  </p>
                </div>
              </div>
              <button
                disabled={isExporting}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto">
              {/* Quick Actions Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Option 1: Download All 13 */}
                <button
                  onClick={() => handleExport(surfaces)}
                  disabled={isExporting}
                  className="
                    group flex flex-col items-start p-3 sm:p-3.5 rounded-xl border border-primary/30
                    bg-primary/[0.06] hover:bg-primary/[0.12] hover:border-primary/60
                    transition-all text-left cursor-pointer disabled:opacity-40
                  "
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-semibold text-[#f2f0ea] flex items-center gap-1.5">
                      <Layers size={13} className="text-primary" />
                      Download All 13 Layouts
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                      13 Surfaces
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Complete cross-surface package: all IAB display & social formats in a unified bundle.
                  </p>
                </button>

                {/* Option 2: Download Active / Selected */}
                <button
                  onClick={() =>
                    handleExport(
                      surfaces.filter((s) => selectedSurfaceIds.includes(s.id))
                    )
                  }
                  disabled={isExporting || selectedSurfaceIds.length === 0}
                  className="
                    group flex flex-col items-start p-3 sm:p-3.5 rounded-xl border border-white/10
                    bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20
                    transition-all text-left cursor-pointer disabled:opacity-40
                  "
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-semibold text-[#f2f0ea] flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      Download Selected Layouts
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#d0e5d8] font-bold">
                      {selectedSurfaceIds.length} Selected
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Custom selection: only the surfaces checked below ({selectedSurfaceIds.length} of {surfaces.length}).
                  </p>
                </button>
              </div>

              {/* Format Selection */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Package Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "bundle", label: "Full Bundle", desc: "PNG + HTML + JSON", icon: Package },
                    { id: "png", label: "Images (PNG)", desc: "1:1 pixel renders", icon: FileImage },
                    { id: "html", label: "HTML5 Banners", desc: "Interactive units", icon: FileCode },
                    { id: "json", label: "AST Manifest", desc: "Engine JSON data", icon: FileJson },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    const active = format === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormat(fmt.id as ExportFormat)}
                        className={`
                          p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1
                          ${
                            active
                              ? "bg-primary/15 border-primary text-[#f2f0ea] shadow-sm"
                              : "bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/[0.05] hover:text-white"
                          }
                        `}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} className={active ? "text-primary" : "text-muted-foreground"} />
                          <span className="text-xs font-medium">{fmt.label}</span>
                        </div>
                        <span className="text-[9.5px] opacity-70">{fmt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Surface Selection Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Individual Surfaces ({selectedSurfaceIds.length}/{surfaces.length})
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-primary cursor-pointer transition-colors"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={selectActiveOnly}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white cursor-pointer transition-colors"
                    >
                      Active Filter ({activeFilteredSurfaces.length})
                    </button>
                    <button
                      type="button"
                      onClick={selectNone}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white cursor-pointer transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl border border-white/10 bg-black/40">
                  {surfaces.map((s) => {
                    const checked = selectedSurfaceIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSurface(s.id)}
                        className={`
                          flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none transition-all
                          ${checked ? "bg-white/[0.08] text-white" : "text-muted-foreground hover:bg-white/[0.03]"}
                        `}
                      >
                        <div className="truncate pr-1">
                          <div className="font-medium truncate">{s.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground/80">
                            {s.width}×{s.height}
                          </div>
                        </div>
                        <div
                          className={`
                            h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors
                            ${
                              checked
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-white/20 bg-white/5"
                            }
                          `}
                        >
                          {checked && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress & Status */}
              {isExporting && progress && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#f2f0ea] font-medium">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      {progress.status}
                    </span>
                    <span className="font-mono text-primary font-semibold">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{
                        width: `${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {successNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 size={15} />
                  <span>Download started! Layout package saved to your downloads.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.02]">
              <span className="text-[11px] text-muted-foreground">
                Format: <span className="text-white font-medium uppercase">{format}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isExporting || selectedSurfaceIds.length === 0}
                  onClick={() =>
                    handleExport(
                      surfaces.filter((s) => selectedSurfaceIds.includes(s.id))
                    )
                  }
                  className="
                    flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                    bg-white text-black hover:bg-[#f2f0ea] disabled:opacity-40
                    disabled:cursor-not-allowed transition-all cursor-pointer shadow-md
                  "
                >
                  {isExporting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>Download ({selectedSurfaceIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
