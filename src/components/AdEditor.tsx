import React, { useState } from "react";
import { FileUploadField } from "./FileUploadField";
import * as Tabs from "@radix-ui/react-tabs";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Image,
  Tag,
  Type,
  AlignLeft,
  MousePointerClick,
  Info,
  Cpu,
  ShieldCheck,
  Layers2,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import type { AdElement } from "../engine/types";
import { CAMPAIGN_PRESETS } from "../data/presets";

interface Props {
  elements: AdElement[];
  onChange: (elements: AdElement[]) => void;
}

const PRIORITY_META = {
  1: { label: "P1", sublabel: "Core Anchor (Invariable)", color: "priority-1" },
  2: { label: "P2", sublabel: "Contextual Asset (Adaptive)", color: "priority-2" },
  3: { label: "P3", sublabel: "Ancillary Detail (Pruned on Compact Formats)", color: "priority-3" },
};

const AdEditor: React.FC<Props> = ({ elements, onChange }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("luxury-watch");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed || aiLoading) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || data.error) {
        const errorMsg =
          data?.error === "malformed_response"
            ? "Malformed response from model."
            : data?.error === "invalid_schema"
            ? "Invalid schema in model output."
            : data?.error === "llm_unavailable"
            ? "LLM service unavailable."
            : data?.message || "Failed to generate content.";
        setAiError(errorMsg);
        return;
      }

      if (Array.isArray(data.elements)) {
        onChange(
          elements.map((el) => {
            const match = data.elements.find(
              (g: { type: string; content: string }) => g.type === el.type
            );
            return match && typeof match.content === "string"
              ? { ...el, content: match.content }
              : el;
          })
        );
      }
    } catch {
      setAiError("Network error. Could not reach server.");
    } finally {
      setAiLoading(false);
    }
  };

  const update = (id: string, content: string) => {
    onChange(elements.map((el) => (el.id === id ? { ...el, content } : el)));
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = CAMPAIGN_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      onChange(preset.elements);
    }
  };

  const byId = (id: string) => elements.find((e) => e.id === id);

  const headlineEl = byId("headline");
  const headlineLen = headlineEl?.content.length ?? 0;

  return (
    <Tooltip.Provider delayDuration={250}>
      <aside className="editor-panel">
        {/* ── Brand / Header ──────────────────────────────────── */}
        <div className="editor-header">
          <div className="editor-brand">
            <div className="editor-brand-icon">
              <Layers2 size={15} strokeWidth={2.5} />
            </div>
            <div>
              <p className="editor-brand-name">Creative Source</p>
              <p className="editor-brand-sub">Deterministic Multi-Surface Resolver</p>
            </div>
          </div>

          {/* ── Campaign Preset Bar ────────────────────────────── */}
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/90 flex items-center gap-1">
                <Sparkles size={11} className="text-primary/80" />
                Campaign Template
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CAMPAIGN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all
                    border cursor-pointer truncate
                    ${
                      selectedPresetId === preset.id
                        ? "bg-white/10 text-white border-white/20 shadow-sm"
                        : "bg-white/[0.02] text-muted-foreground border-white/[0.04] hover:bg-white/[0.06] hover:text-white"
                    }
                  `}
                >
                  <span className="truncate block">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <Tabs.Root defaultValue="content" className="editor-tabs-root">
          <Tabs.List className="editor-tabs-list">
            <Tabs.Trigger value="content" className="editor-tab-trigger">
              <Type size={13} />
              Creative Assets
            </Tabs.Trigger>
            <Tabs.Trigger value="engine" className="editor-tab-trigger">
              <Cpu size={13} />
              Layout Heuristics
            </Tabs.Trigger>
          </Tabs.List>

          {/* ── Content Tab ──────────────────────────────────── */}
          <Tabs.Content value="content" className="editor-tab-content">
            {/* Visual Asset */}
            <FieldGroup
              icon={<Image size={13} />}
              label="Primary Visual (Asset)"
              priority={2}
            >
              <FileUploadField
                value={byId("image")?.content ?? ""}
                onChange={(val) => update("image", val)}
              />
            </FieldGroup>

            {/* Logo */}
            <FieldGroup
              icon={<Tag size={13} />}
              label="Brand Identifier (Logo)"
              priority={2}
              hint="High-contrast SVG or transparent PNG recommended"
            >
              <input
                className="field-input"
                type="url"
                value={byId("logo")?.content ?? ""}
                onChange={(e) => update("logo", e.target.value)}
                placeholder="https://..."
              />
            </FieldGroup>

            {/* Direct prompt generation */}
            <div className="mb-3">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  className="field-input"
                  placeholder="Prompt copy generation..."
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiPrompt(e.target.value);
                    if (aiError) setAiError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !aiLoading && aiPrompt.trim()) {
                      handleGenerate();
                    }
                  }}
                  disabled={aiLoading}
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center gap-1.5 transition-all"
                >
                  {aiLoading ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating</span>
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
              {aiError && (
                <div className="text-[11px] text-red-400 mt-1.5 flex items-center justify-between">
                  <span>{aiError}</span>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="text-[11px] text-red-300 underline hover:text-white ml-2 cursor-pointer shrink-0"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Headline */}
            <FieldGroup
              icon={<Type size={13} />}
              label="Primary Headline"
              priority={1}
              hint="Adaptive font-scaling & layout restructuring occur dynamically"
            >
              <div className="textarea-wrap">
                <textarea
                  className="field-input field-textarea"
                  value={byId("headline")?.content ?? ""}
                  onChange={(e) => update("headline", e.target.value)}
                  rows={2}
                  placeholder="Primary proposition copy..."
                  maxLength={140}
                />
                <div className={`char-count ${headlineLen > 100 ? "char-warn" : ""}`}>
                  {headlineLen}/140
                </div>
              </div>
            </FieldGroup>

            {/* Subtext */}
            <FieldGroup
              icon={<AlignLeft size={13} />}
              label="Secondary Description"
              priority={2}
            >
              <textarea
                className="field-input field-textarea"
                value={byId("subtext")?.content ?? ""}
                onChange={(e) => update("subtext", e.target.value)}
                rows={2}
                placeholder="Offer details, specification, supporting context..."
              />
            </FieldGroup>

            {/* CTA */}
            <FieldGroup
              icon={<MousePointerClick size={13} />}
              label="Action Directive (CTA Button)"
              priority={1}
            >
              <input
                className="field-input"
                type="text"
                value={byId("cta")?.content ?? ""}
                onChange={(e) => update("cta", e.target.value)}
                placeholder="Action label (e.g., Explore Collection)"
                maxLength={28}
              />
            </FieldGroup>

            {/* Priority legend */}
            <div className="priority-legend">
              <p className="legend-title">
                <ShieldCheck size={12} className="text-primary/80" />
                Asset Priority Architecture
              </p>
              {([1, 2, 3] as const).map((p) => (
                <div key={p} className="legend-row">
                  <span className={`priority-badge ${PRIORITY_META[p].color}`}>
                    {PRIORITY_META[p].label}
                  </span>
                  <span className="legend-text">{PRIORITY_META[p].sublabel}</span>
                </div>
              ))}
            </div>
          </Tabs.Content>

          {/* ── Heuristics Tab ────────────────────────────────── */}
          <Tabs.Content value="engine" className="editor-tab-content">
            <div className="engine-steps">
              {ENGINE_STEPS.map((step, i) => (
                <div key={i} className="engine-step">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-body">
                    <p className="step-title">{step.title}</p>
                    <p className="step-desc">{step.desc}</p>
                    {step.code && (
                      <code className="step-code">{step.code}</code>
                    )}
                  </div>
                </div>
              ))}

              <div className="engine-tradeoff">
                <Lightbulb size={14} className="tradeoff-icon" />
                <div>
                  <p className="tradeoff-title">Engineering Architecture: Deterministic Heuristics</p>
                  <p className="tradeoff-body">
                    Pure functional constraint resolution delivers predictable, sub-millisecond execution (&lt; 0.8ms). It guarantees deterministic rendering across all 13 targets without runtime layout thrashing or layout convergence failures.
                  </p>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </aside>
    </Tooltip.Provider>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

interface FieldGroupProps {
  icon: React.ReactNode;
  label: string;
  priority: 1 | 2 | 3;
  hint?: string;
  children: React.ReactNode;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ icon, label, priority, hint, children }) => (
  <div className="field-group">
    <div className="field-label-row">
      <label className="field-label">
        <span className="field-icon">{icon}</span>
        {label}
      </label>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className={`priority-badge ${PRIORITY_META[priority].color}`}>
            {PRIORITY_META[priority].label}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip-content" sideOffset={5}>
            {PRIORITY_META[priority].sublabel}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
    {children}
    {hint && (
      <p className="field-hint">
        <Info size={10} />
        {hint}
      </p>
    )}
  </div>
);

// ── Engine steps data ──────────────────────────────────────────────────────

const ENGINE_STEPS = [
  {
    title: "Aspect Ratio Topology Analysis",
    desc: "Evaluates surface width-to-height ratio into WIDE, SQUARE, or TALL bounding classifications.",
    code: "AR > 2.2 → WIDE · AR < 0.65 → TALL · else SQUARE",
  },
  {
    title: "Deterministic Layout Strategy Selection",
    desc: "Directs topology to optimal geometric layout pipeline.",
    code: "WIDE → HORIZONTAL · SQUARE → CENTERED_STACK · TALL → VERTICAL_STACK",
  },
  {
    title: "Priority-Ranked Asset Pruning",
    desc: "Prunes low-priority assets gracefully to prevent visual clipping on compact displays.",
    code: "Area < 50k px² → prune P3 · Area < 10k px² → prune P2",
  },
  {
    title: "Harmonic Typography & Spatial Bounding",
    desc: "Calculates font clamp and component scale relative to bounding container height.",
    code: "clamp(height × 0.09, 10, 80)",
  },
];

export default AdEditor;
