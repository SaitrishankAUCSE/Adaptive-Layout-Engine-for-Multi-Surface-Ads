import JSZip from "jszip";
import type { AdElement, Surface, LayoutResult } from "../engine/types";
import { layoutEngine } from "../engine/layoutEngine";

/**
 * Generates a self-contained, standalone HTML5 creative for a given surface layout.
 */
export function generateStandaloneHtml(result: LayoutResult): string {
  const { surface, elements } = result;

  const elementsHtml = elements
    .filter((el) => el.visible)
    .map((el) => {
      const baseStyle = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;overflow:hidden;border-radius:${el.borderRadius ?? 0}px;box-sizing:border-box;`;

      switch (el.type) {
        case "image":
          if (!el.content) return "";
          const focalPos = el.focalPoint
            ? `${Math.round(el.focalPoint.x * 100)}% ${Math.round(el.focalPoint.y * 100)}%`
            : "center";
          return `<div style="${baseStyle}"><img src="${el.content}" alt="Ad" style="width:100%;height:100%;object-fit:${el.imageFit ?? "cover"};object-position:${focalPos};display:block;" /></div>`;

        case "logo":
          if (!el.content) return "";
          return `<div style="${baseStyle}"><img src="${el.content}" alt="Logo" style="width:100%;height:100%;object-fit:${el.imageFit ?? "contain"};object-position:left center;display:block;" /></div>`;

        case "headline":
          return `<div style="${baseStyle}font-size:${el.fontSize}px;font-weight:800;line-height:1.15;color:#ffffff;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;letter-spacing:-0.02em;word-break:break-word;text-align:${el.textAlign || "left"};">${el.content}</div>`;

        case "subtext":
          return `<div style="${baseStyle}font-size:${el.fontSize}px;font-weight:400;line-height:1.35;color:rgba(255,255,255,0.85);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;text-align:${el.textAlign || "left"};">${el.content}</div>`;

        case "cta":
          return `<a href="#" style="${baseStyle}background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);display:flex;align-items:center;justify-content:center;font-size:${el.fontSize}px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;box-shadow:0 4px 20px rgba(255,107,53,0.45);white-space:nowrap;text-overflow:ellipsis;padding:0 12px;">${el.content}</a>`;

        default:
          return "";
      }
    })
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="ad.size" content="width=${surface.width},height=${surface.height}">
  <title>${surface.name} (${surface.width}×${surface.height}) - Anysize Ad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .ad-container {
      width: ${surface.width}px;
      height: ${surface.height}px;
      position: relative;
      overflow: hidden;
      background: #0f0f0f;
      background-image: radial-gradient(circle at 1px 1px, rgba(240, 241, 199, 0.05) 1px, transparent 0);
      background-size: 16px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    }
  </style>
</head>
<body>
  <div class="ad-container">
    ${elementsHtml}
  </div>
</body>
</html>`;
}

/**
 * Draws a LayoutResult onto an offscreen canvas and returns a PNG Blob.
 */
export async function renderLayoutToCanvasBlob(result: LayoutResult): Promise<Blob> {
  const { surface, elements } = result;
  const canvas = document.createElement("canvas");
  canvas.width = surface.width;
  canvas.height = surface.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context");
  }

  // Draw background
  ctx.fillStyle = "#0c0c0e";
  ctx.fillRect(0, 0, surface.width, surface.height);

  // Background subtle dot pattern
  ctx.fillStyle = "rgba(240, 241, 199, 0.04)";
  for (let x = 8; x < surface.width; x += 16) {
    for (let y = 8; y < surface.height; y += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Helper to load image safely
  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // Render elements in priority order (images first, text/CTA on top)
  const sorted = [...elements.filter((e) => e.visible)].sort((a, b) => {
    if (a.type === "image" || a.type === "logo") return -1;
    if (b.type === "image" || b.type === "logo") return 1;
    if (a.type === "cta") return 1;
    if (b.type === "cta") return -1;
    return 0;
  });

  for (const el of sorted) {
    if (el.type === "image" || el.type === "logo") {
      const img = await loadImage(el.content);
      if (img) {
        ctx.save();
        if (el.borderRadius) {
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius);
          ctx.clip();
        }
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
        ctx.restore();
      } else {
        // Fallback placeholder card
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "12px sans-serif";
        ctx.fillText(el.type.toUpperCase(), el.x + 8, el.y + el.height / 2);
      }
    } else if (el.type === "headline") {
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${el.fontSize || 20}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textBaseline = "top";
      wrapCanvasText(ctx, el.content, el.x, el.y, el.width, (el.fontSize || 20) * 1.2, 3);
    } else if (el.type === "subtext") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = `400 ${el.fontSize || 13}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textBaseline = "top";
      wrapCanvasText(ctx, el.content, el.x, el.y, el.width, (el.fontSize || 13) * 1.35, 3);
    } else if (el.type === "cta") {
      // CTA Button background gradient
      const grad = ctx.createLinearGradient(el.x, el.y, el.x + el.width, el.y + el.height);
      grad.addColorStop(0, "#ff6b35");
      grad.addColorStop(1, "#f7931e");

      ctx.save();
      ctx.shadowColor = "rgba(255, 107, 53, 0.45)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, el.borderRadius ?? 8);
      ctx.fill();
      ctx.restore();

      // CTA Text
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${el.fontSize || 14}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el.content, el.x + el.width / 2, el.y + el.height / 2);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

/**
 * Utility to wrap multiline text on a canvas context with a line limit.
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + (line ? " " : "") + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && i < words.length - 1) {
        // Last available line - append ellipsis if needed
        line += "…";
        break;
      }
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
  }
}

export type ExportFormat = "bundle" | "png" | "html" | "json";

export interface ExportProgressCallback {
  (current: number, total: number, status: string): void;
}

/**
 * Main export coordinator: builds and triggers the download of all or selected layouts.
 */
export async function exportCampaignLayouts({
  elements,
  surfaces,
  format = "bundle",
  onProgress,
}: {
  elements: AdElement[];
  surfaces: Surface[];
  format?: ExportFormat;
  onProgress?: ExportProgressCallback;
}): Promise<void> {
  const zip = new JSZip();
  const total = surfaces.length;
  const results: LayoutResult[] = [];

  // Compute layouts
  for (let i = 0; i < total; i++) {
    const surface = surfaces[i];
    onProgress?.(i + 1, total, `Computing layout for ${surface.name} (${surface.width}×${surface.height})…`);
    const result = layoutEngine(elements, surface);
    results.push(result);
  }

  // 1. If format is JSON only
  if (format === "json") {
    const jsonStr = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        surfaceCount: results.length,
        campaign: { elements },
        layouts: results,
      },
      null,
      2
    );
    downloadBlob(new Blob([jsonStr], { type: "application/json" }), "campaign-layout-ast.json");
    return;
  }

  // 2. Build ZIP package
  const imagesFolder = zip.folder("images");
  const htmlFolder = zip.folder("html5");

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    const filename = `${res.surface.id}-${res.surface.width}x${res.surface.height}`;

    onProgress?.(i + 1, total, `Generating assets for ${res.surface.name}…`);

    // Standalone HTML5
    if (format === "bundle" || format === "html") {
      const htmlContent = generateStandaloneHtml(res);
      htmlFolder?.file(`${filename}.html`, htmlContent);
    }

    // High-Res PNG
    if (format === "bundle" || format === "png") {
      try {
        const pngBlob = await renderLayoutToCanvasBlob(res);
        imagesFolder?.file(`${filename}.png`, pngBlob);
      } catch (err) {
        console.warn(`PNG render fallback for ${res.surface.name}:`, err);
      }
    }
  }

  // Add manifest JSON
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        formatCount: results.length,
        engineVersion: "1.4.0",
        layouts: results.map((r) => ({
          surface: r.surface,
          template: r.template,
          hiddenCount: r.hiddenCount,
          decisions: r.decisions,
        })),
      },
      null,
      2
    )
  );

  // Add README
  zip.file(
    "README.txt",
    `Anysize Adaptive Layout Engine — Campaign Export
=====================================================
Total Formats: ${results.length}
Export Date: ${new Date().toLocaleString()}

Included Folders:
- /images : High-resolution 1:1 pixel PNG ad creatives.
- /html5  : Standalone interactive HTML5 banners conforming to IAB dimensions.
- manifest.json : Structured AST layout decisions and metadata.

Generated autonomously by Anysize Multi-Surface Engine.
`
  );

  onProgress?.(total, total, "Compressing archive…");
  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `campaign-creatives-${results.length}-formats.zip`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
