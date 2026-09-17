import React, { useState } from "react";
import { FileUploadField } from "./FileUploadField";
import {
  Image,
  Tag,
  Type,
  AlignLeft,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import type { AdElement } from "../engine/types";
import { CAMPAIGN_PRESETS } from "../data/presets";
import { cn } from "../lib/utils";

interface Props {
  elements: AdElement[];
  onChange: (elements: AdElement[]) => void;
}

const PRIORITY_META = {
  1: { label: "P1", color: "priority-1" },
  2: { label: "P2", color: "priority-2" },
  3: { label: "P3", color: "priority-3" },
};

const AdEditor: React.FC<Props> = ({ elements, onChange }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("wireless-headphones");
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
        if (data?.error === "invalid_schema") {
          console.error("AI Schema Validation Details:", data.details || data.message);
        }
        const errorMsg =
          data?.error === "malformed_response"
            ? "The AI response couldn't be read. Try rephrasing your prompt."
            : data?.error === "invalid_schema"
            ? "The AI response didn't match the expected ad format. Try rephrasing your prompt."
            : "Unable to generate content. Please try again.";
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
    } catch (err) {
      console.error("AI generation network error:", err);
      setAiError("Unable to generate content. Please try again.");
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
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 text-foreground">
      {/* ── Header: Title & Presets ──────────────────────────── */}
      <div className="pb-3 border-b border-white/[0.07]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={12} className="text-primary/80" />
            Campaign Template
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {CAMPAIGN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium transition-all border cursor-pointer truncate",
                selectedPresetId === preset.id
                  ? "bg-white/10 text-white border-white/20 shadow-sm"
                  : "bg-white/[0.02] text-muted-foreground border-white/[0.04] hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <span className="truncate block">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Unobtrusive AI Prompt Generation ─────────────────── */}
      <div>
        <div className="flex gap-1.5">
          <input
            type="text"
            className="field-input text-xs"
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
          <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-2">
            <span className="text-[11px] text-red-300 leading-tight">{aiError}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-[11px] font-semibold text-red-200 hover:text-white px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Primary Headline ─────────────────────────────────── */}
      <FieldGroup
        icon={<Type size={13} />}
        label="Headline"
        priority={1}
      >
        <div className="textarea-wrap">
          <textarea
            className="field-input field-textarea text-xs"
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

      {/* ── Subtext Description ──────────────────────────────── */}
      <FieldGroup
        icon={<AlignLeft size={13} />}
        label="Description / Subtext"
        priority={3}
      >
        <textarea
          className="field-input field-textarea text-xs"
          value={byId("subtext")?.content ?? ""}
          onChange={(e) => update("subtext", e.target.value)}
          rows={2}
          placeholder="Offer details, specification, supporting context..."
        />
      </FieldGroup>

      {/* ── Call To Action ───────────────────────────────────── */}
      <FieldGroup
        icon={<MousePointerClick size={13} />}
        label="Call to Action"
        priority={1}
      >
        <input
          className="field-input text-xs"
          type="text"
          value={byId("cta")?.content ?? ""}
          onChange={(e) => update("cta", e.target.value)}
          placeholder="Action label (e.g., Shop Now)"
          maxLength={28}
        />
      </FieldGroup>

      {/* ── Visual Asset (Hero Image) ────────────────────────── */}
      <FieldGroup
        icon={<Image size={13} />}
        label="Hero / Product Image"
        priority={1}
      >
        <FileUploadField
          value={byId("image")?.content ?? ""}
          onChange={(val) => update("image", val)}
        />
      </FieldGroup>

      {/* ── Brand Logo (Upload or URL) ───────────────────────── */}
      <FieldGroup
        icon={<Tag size={13} />}
        label="Brand Logo"
        priority={1}
      >
        <FileUploadField
          value={byId("logo")?.content ?? ""}
          onChange={(val) => update("logo", val)}
        />
      </FieldGroup>
    </div>
  );
};

// ── Minimal FieldGroup Component ───────────────────────────────────────────

interface FieldGroupProps {
  icon: React.ReactNode;
  label: string;
  priority: 1 | 2 | 3;
  children: React.ReactNode;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ icon, label, priority, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/90">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </label>
      <span className={`priority-badge ${PRIORITY_META[priority].color}`}>
        {PRIORITY_META[priority].label}
      </span>
    </div>
    {children}
  </div>
);

export default AdEditor;
