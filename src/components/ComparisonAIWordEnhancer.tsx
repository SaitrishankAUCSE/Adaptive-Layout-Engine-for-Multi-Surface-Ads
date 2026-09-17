import React, { useState } from "react";
import { Sparkles, Type, AlignLeft, MousePointerClick, Check, RotateCcw, ArrowRight, Zap } from "lucide-react";
import type { AdElement } from "../engine/types";
import {
  shortenHeadline,
  shortenDescription,
  shortenCta,
} from "../engine/mockOptimizer";

interface Props {
  elements: AdElement[];
  onChange: (elements: AdElement[]) => void;
}

export const ComparisonAIWordEnhancer: React.FC<Props> = ({ elements, onChange }) => {
  const [shorteningField, setShorteningField] = useState<string | null>(null);
  const [history, setHistory] = useState<{ [id: string]: string }>({});
  const [lastCondensed, setLastCondensed] = useState<{ [id: string]: { before: number; after: number } }>({});

  const byId = (id: string) => elements.find((e) => e.id === id);

  const headline = byId("headline")?.content ?? "";
  const subtext = byId("subtext")?.content ?? "";
  const cta = byId("cta")?.content ?? "";

  const update = (id: string, content: string) => {
    onChange(elements.map((el) => (el.id === id ? { ...el, content } : el)));
  };

  const handleEnhanceField = async (fieldId: "headline" | "subtext" | "cta") => {
    const current = byId(fieldId)?.content ?? "";
    if (!current.trim()) return;

    // Save previous in history for undo
    if (!history[fieldId]) {
      setHistory((prev) => ({ ...prev, [fieldId]: current }));
    }

    setShorteningField(fieldId);
    try {
      const hl = fieldId === "headline" ? current : headline;
      const desc = fieldId === "subtext" ? current : subtext;
      const act = fieldId === "cta" ? current : cta;

      const prompt = `Rewrite the following ad copy to be concise while strictly preserving original meaning and brand intent.
Headline: "${hl}"
Description: "${desc}"
CTA: "${act}"`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      let shortened = current;
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.elements && Array.isArray(data.elements)) {
          const match = data.elements.find(
            (e: any) => e.type === fieldId || e.id === fieldId
          );
          if (match?.content && typeof match.content === "string" && match.content.trim()) {
            shortened = match.content.trim();
          }
        }
      }

      // If network did not shorten or LLM unavailable, use pure deterministic optimizer
      if (shortened === current) {
        if (fieldId === "headline") shortened = shortenHeadline(current, 35);
        if (fieldId === "subtext") shortened = shortenDescription(current, 60);
        if (fieldId === "cta") shortened = shortenCta(current, 18);
      }

      setLastCondensed((prev) => ({
        ...prev,
        [fieldId]: { before: current.length, after: shortened.length },
      }));

      update(fieldId, shortened);
    } catch (err) {
      let shortened = current;
      if (fieldId === "headline") shortened = shortenHeadline(current, 35);
      if (fieldId === "subtext") shortened = shortenDescription(current, 60);
      if (fieldId === "cta") shortened = shortenCta(current, 18);
      update(fieldId, shortened);
    } finally {
      setShorteningField(null);
    }
  };

  const handleEnhanceAll = () => {
    setShorteningField("all");
    try {
      const origHl = headline;
      const origSub = subtext;
      const origCta = cta;

      setHistory((prev) => ({
        headline: prev.headline || origHl,
        subtext: prev.subtext || origSub,
        cta: prev.cta || origCta,
      }));

      const newHl = origHl.trim() ? shortenHeadline(origHl, 35) : origHl;
      const newSub = origSub.trim() ? shortenDescription(origSub, 60) : origSub;
      const newCta = origCta.trim() ? shortenCta(origCta, 18) : origCta;

      setLastCondensed({
        headline: { before: origHl.length, after: newHl.length },
        subtext: { before: origSub.length, after: newSub.length },
        cta: { before: origCta.length, after: newCta.length },
      });

      onChange(
        elements.map((el) => {
          if (el.id === "headline") return { ...el, content: newHl };
          if (el.id === "subtext") return { ...el, content: newSub };
          if (el.id === "cta") return { ...el, content: newCta };
          return el;
        })
      );
    } finally {
      setShorteningField(null);
    }
  };

  const handleRestore = (fieldId: "headline" | "subtext" | "cta") => {
    if (history[fieldId]) {
      update(fieldId, history[fieldId]);
      setLastCondensed((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.04] via-black/40 to-black/60 backdrop-blur-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary">
              <Sparkles size={16} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              AI Word Enhancer & Sentence Condenser
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary font-mono font-medium uppercase tracking-wider">
                Extra Tool
              </span>
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Type or paste long sentences into Title, Banner, or Action Button. Clicking the enhancer transforms each into its shortest, punchiest advertising form while preserving core product meaning.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnhanceAll}
          disabled={shorteningField === "all"}
          className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-black hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(240,241,199,0.25)] cursor-pointer disabled:opacity-50"
        >
          {shorteningField === "all" ? (
            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap size={14} className="fill-current" />
          )}
          <span>Condense All 3 Fields</span>
        </button>
      </div>

      {/* 3 Copy Component Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Title / Headline */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col justify-between hover:border-white/[0.15] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <Type size={14} className="text-primary" />
                Title (Headline)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {headline.length} chars
              </span>
            </div>

            <textarea
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 resize-none font-sans leading-relaxed"
              rows={3}
              value={headline}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="Enter long title sentence..."
            />

            {lastCondensed.headline && (
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check size={11} />
                <span>{lastCondensed.headline.before} chars</span>
                <ArrowRight size={10} />
                <span className="font-bold">{lastCondensed.headline.after} chars</span>
                <span className="text-muted-foreground">
                  (-{Math.round((1 - lastCondensed.headline.after / lastCondensed.headline.before) * 100)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            {history.headline && history.headline !== headline ? (
              <button
                type="button"
                onClick={() => handleRestore("headline")}
                className="text-[11px] text-muted-foreground hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Restore original text"
              >
                <RotateCcw size={11} />
                <span>Undo</span>
              </button>
            ) : <span />}

            <button
              type="button"
              onClick={() => handleEnhanceField("headline")}
              disabled={shorteningField === "headline" || !headline.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {shorteningField === "headline" ? (
                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>Shorten Title</span>
            </button>
          </div>
        </div>

        {/* 2. Banner / Description */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col justify-between hover:border-white/[0.15] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <AlignLeft size={14} className="text-primary" />
                Banner (Description)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {subtext.length} chars
              </span>
            </div>

            <textarea
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 resize-none font-sans leading-relaxed"
              rows={3}
              value={subtext}
              onChange={(e) => update("subtext", e.target.value)}
              placeholder="Enter long banner subtext..."
            />

            {lastCondensed.subtext && (
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check size={11} />
                <span>{lastCondensed.subtext.before} chars</span>
                <ArrowRight size={10} />
                <span className="font-bold">{lastCondensed.subtext.after} chars</span>
                <span className="text-muted-foreground">
                  (-{Math.round((1 - lastCondensed.subtext.after / lastCondensed.subtext.before) * 100)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            {history.subtext && history.subtext !== subtext ? (
              <button
                type="button"
                onClick={() => handleRestore("subtext")}
                className="text-[11px] text-muted-foreground hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Restore original text"
              >
                <RotateCcw size={11} />
                <span>Undo</span>
              </button>
            ) : <span />}

            <button
              type="button"
              onClick={() => handleEnhanceField("subtext")}
              disabled={shorteningField === "subtext" || !subtext.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {shorteningField === "subtext" ? (
                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>Shorten Banner</span>
            </button>
          </div>
        </div>

        {/* 3. Alert Button / CTA */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col justify-between hover:border-white/[0.15] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <MousePointerClick size={14} className="text-primary" />
                Alert Button (CTA)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {cta.length} chars
              </span>
            </div>

            <input
              type="text"
              className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50 font-sans"
              value={cta}
              onChange={(e) => update("cta", e.target.value)}
              placeholder="Enter long call to action..."
            />

            {lastCondensed.cta && (
              <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check size={11} />
                <span>{lastCondensed.cta.before} chars</span>
                <ArrowRight size={10} />
                <span className="font-bold">{lastCondensed.cta.after} chars</span>
                <span className="text-muted-foreground">
                  (-{Math.round((1 - lastCondensed.cta.after / lastCondensed.cta.before) * 100)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/[0.06]">
            {history.cta && history.cta !== cta ? (
              <button
                type="button"
                onClick={() => handleRestore("cta")}
                className="text-[11px] text-muted-foreground hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Restore original text"
              >
                <RotateCcw size={11} />
                <span>Undo</span>
              </button>
            ) : <span />}

            <button
              type="button"
              onClick={() => handleEnhanceField("cta")}
              disabled={shorteningField === "cta" || !cta.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {shorteningField === "cta" ? (
                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>Shorten Button</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
