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
import {
  shortenHeadline,
  shortenDescription,
  shortenCta,
} from "../engine/mockOptimizer";

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

  const [shorteningField, setShorteningField] = useState<string | null>(null);

  const handleEnhanceField = async (fieldId: "headline" | "subtext" | "cta") => {
    const current = byId(fieldId)?.content ?? "";
    if (!current.trim()) return;

    setShorteningField(fieldId);
    try {
      // 1. Try fast LLM serverless rewrite with 3.5s timeout
      const headline = fieldId === "headline" ? current : byId("headline")?.content ?? "";
      const subtext = fieldId === "subtext" ? current : byId("subtext")?.content ?? "";
      const cta = fieldId === "cta" ? current : byId("cta")?.content ?? "";

      const prompt = `Rewrite the following ad copy to be concise while strictly preserving original meaning and brand intent.
Headline: "${headline}"
Description: "${subtext}"
CTA: "${cta}"`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.elements && Array.isArray(data.elements)) {
          const match = data.elements.find(
            (e: any) => e.type === fieldId || e.id === fieldId
          );
          if (match?.content && typeof match.content === "string" && match.content.trim()) {
            update(fieldId, match.content.trim());
            return;
          }
        }
      }

      // 2. Instant deterministic semantic optimizer fallback
      let shortened = current;
      if (fieldId === "headline") {
        shortened = shortenHeadline(current, 35);
      } else if (fieldId === "subtext") {
        shortened = shortenDescription(current, 60);
      } else if (fieldId === "cta") {
        shortened = shortenCta(current, 18);
      }
      update(fieldId, shortened);
    } catch (err) {
      console.error("AI Enhancer fallback invoked:", err);
      if (fieldId === "headline") update(fieldId, shortenHeadline(current, 35));
      if (fieldId === "subtext") update(fieldId, shortenDescription(current, 60));
      if (fieldId === "cta") update(fieldId, shortenCta(current, 18));
    } finally {
      setShorteningField(null);
    }
  };

  const handleEnhanceAll = () => {
    setShorteningField("all");
    try {
      const hl = byId("headline")?.content ?? "";
      const desc = byId("subtext")?.content ?? "";
      const cta = byId("cta")?.content ?? "";

      const newHl = hl.trim() ? shortenHeadline(hl, 35) : hl;
      const newDesc = desc.trim() ? shortenDescription(desc, 60) : desc;
      const newCta = cta.trim() ? shortenCta(cta, 18) : cta;

      onChange(
        elements.map((el) => {
          if (el.id === "headline") return { ...el, content: newHl };
          if (el.id === "subtext") return { ...el, content: newDesc };
          if (el.id === "cta") return { ...el, content: newCta };
          return el;
        })
      );
    } finally {
      setShorteningField(null);
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
            className={`relative overflow-hidden px-3.5 py-1.5 rounded-lg text-xs font-medium border disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center gap-1.5 transition-all group ${
              aiLoading
                ? "bg-primary/10 border-primary/30 text-primary-foreground disabled:opacity-90"
                : "bg-white/[0.06] border-white/[0.09] text-white hover:bg-white/[0.1] active:scale-[0.98] disabled:opacity-40"
            }`}
          >
            {aiLoading && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            )}
            {aiLoading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin relative z-10" />
                <span className="relative z-10 text-primary font-semibold">Generating</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-primary/70 group-hover:text-primary transition-colors" />
                <span>Generate</span>
              </>
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

      {/* ── Copy Elements Section Header with Global Shortener ─── */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Copy Content
        </span>
        <button
          type="button"
          onClick={handleEnhanceAll}
          disabled={shorteningField === "all"}
          title="Condense all 3 copy fields (Headline, Subtext, CTA) to their shortest form"
          className="px-2 py-1 rounded text-[10px] font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          {shorteningField === "all" ? (
            <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={11} className="text-amber-400" />
          )}
          <span>Shorten All Copy</span>
        </button>
      </div>

      {/* ── Primary Headline (Title) ─────────────────────────── */}
      <FieldGroup
        icon={<Type size={13} />}
        label="Headline"
        priority={1}
        action={
          <button
            type="button"
            onClick={() => handleEnhanceField("headline")}
            disabled={shorteningField === "headline" || !byId("headline")?.content.trim()}
            title="Condense headline to shortest form while keeping brand meaning"
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {shorteningField === "headline" ? (
              <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={10} className="text-amber-400 shrink-0" />
            )}
            <span>AI Shorten</span>
          </button>
        }
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

      {/* ── Subtext Description (Banner) ─────────────────────── */}
      <FieldGroup
        icon={<AlignLeft size={13} />}
        label="Description / Subtext"
        priority={3}
        action={
          <button
            type="button"
            onClick={() => handleEnhanceField("subtext")}
            disabled={shorteningField === "subtext" || !byId("subtext")?.content.trim()}
            title="Condense description to shortest form while keeping key details"
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {shorteningField === "subtext" ? (
              <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={10} className="text-amber-400 shrink-0" />
            )}
            <span>AI Shorten</span>
          </button>
        }
      >
        <textarea
          className="field-input field-textarea text-xs"
          value={byId("subtext")?.content ?? ""}
          onChange={(e) => update("subtext", e.target.value)}
          rows={2}
          placeholder="Offer details, specification, supporting context..."
        />
      </FieldGroup>

      {/* ── Call To Action (Alert / Action Button) ─────────────── */}
      <FieldGroup
        icon={<MousePointerClick size={13} />}
        label="Call to Action"
        priority={1}
        action={
          <button
            type="button"
            onClick={() => handleEnhanceField("cta")}
            disabled={shorteningField === "cta" || !byId("cta")?.content.trim()}
            title="Condense CTA to punchiest shortest action phrase"
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {shorteningField === "cta" ? (
              <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={10} className="text-amber-400 shrink-0" />
            )}
            <span>AI Shorten</span>
          </button>
        }
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

      {/* ── Visual Asset (Hero Image - Visual, not text) ──────── */}
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

      {/* ── Brand Logo (Visual, not text) ────────────────────── */}
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
  action?: React.ReactNode;
  children: React.ReactNode;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ icon, label, priority, action, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-1.5 text-xs font-medium text-white/90">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        {action}
        <span className={`priority-badge ${PRIORITY_META[priority].color}`}>
          {PRIORITY_META[priority].label}
        </span>
      </div>
    </div>
    {children}
  </div>
);

export default AdEditor;
