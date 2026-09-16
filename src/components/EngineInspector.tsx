import React, { useState } from "react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { AdElement } from "../engine/types";
import { layoutEngine } from "../engine/layoutEngine";
import { SURFACES } from "../data/surfaces";
import { Copy, Check, Terminal, Server, Code2, Play } from "lucide-react";

SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);

interface Props {
  elements: AdElement[];
}

export const EngineInspector: React.FC<Props> = ({ elements }) => {
  const [selectedSurfaceId, setSelectedSurfaceId] = useState<string>(SURFACES[0].id);
  const [activeTab, setActiveTab] = useState<"surface" | "api">("surface");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  // Separate copy state so cURL and JSON copy buttons are independent
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const selectedSurface = SURFACES.find((s) => s.id === selectedSurfaceId) || SURFACES[0];
  const localResult = layoutEngine(elements, selectedSurface);

  const curlCommand = `curl -X POST http://localhost:5173/api/adapt \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ elements: elements.slice(0, 3) }, null, 2)}'`;

  const handleTestApi = async () => {
    setApiLoading(true);
    setApiResponse(null);
    try {
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elements, surfaces: [selectedSurface] }),
      });
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err?.message || "Failed to reach /api/adapt" });
    } finally {
      setApiLoading(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(localResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1500);
  };

  return (
    <div className="w-full max-w-[860px] mx-auto rounded-xl border border-white/10 bg-black/40 backdrop-blur-2xl text-foreground shadow-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="p-3 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3 bg-white/[0.015]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("surface")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "surface"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <Code2 size={13} />
            Layout AST
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === "api"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            <Server size={13} />
            REST API
          </button>
        </div>

        {activeTab === "surface" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-mono">Surface:</span>
            <select
              value={selectedSurfaceId}
              onChange={(e) => setSelectedSurfaceId(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-[#ebebeb] focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono cursor-pointer"
            >
              {SURFACES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0a0a0a] text-white">
                  {s.name} ({s.width}×{s.height})
                </option>
              ))}
            </select>
            <button
              onClick={handleCopyJson}
              title="Copy layout JSON"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-all cursor-pointer"
            >
              {copiedJson ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
              <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>
        )}

        {activeTab === "api" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestApi}
              disabled={apiLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={11} className={apiLoading ? "animate-spin" : ""} />
              <span>{apiLoading ? "Calling…" : "POST /api/adapt"}</span>
            </button>
            <button
              onClick={handleCopyCurl}
              title="Copy cURL command"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-all cursor-pointer"
            >
              {copiedCurl ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Terminal size={12} />
              )}
              <span>{copiedCurl ? "Copied" : "cURL"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Surface Layout AST */}
      {activeTab === "surface" && (
        <div className="text-[13px] overflow-x-auto max-h-[420px] overflow-y-auto">
          <SyntaxHighlighter
            language="json"
            style={atomOneDark}
            customStyle={{ margin: 0, padding: "1.25rem", background: "transparent" }}
          >
            {JSON.stringify(localResult, null, 2)}
          </SyntaxHighlighter>
        </div>
      )}

      {/* REST API tester */}
      {activeTab === "api" && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                POST
              </span>
              <span className="font-mono text-[11px] text-[#ebebeb]">
                http://localhost:5173/api/adapt
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400/80">
              {apiResponse?.computeLatencyMs != null
                ? `${apiResponse.computeLatencyMs}ms server`
                : "awaiting request"}
            </span>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/50 p-3">
            <div className="text-[10px] text-muted-foreground/70 mb-2 font-mono uppercase tracking-wide">
              Response
            </div>
            <pre className="text-[11px] font-mono text-[#d0e5d8] overflow-x-auto max-h-[220px] overflow-y-auto leading-relaxed">
              {apiResponse
                ? JSON.stringify(apiResponse, null, 2)
                : '// Hit "POST /api/adapt" to see the live response here'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
