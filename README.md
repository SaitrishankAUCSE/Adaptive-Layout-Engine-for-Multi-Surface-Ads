# Anysize — Adaptive Layout Engine for Multi-Surface Ads

> A pure TypeScript layout engine that takes one ad's content and automatically adapts it to any IAB ad surface — resizing text, repositioning elements, cropping images, and hiding lower-priority items when space runs out.

**[Adaptive Multi-Surface Ad Engine • SDE-FE R&D Demo]**

---

## What It Does

Feed the engine one ad (headline, image, subtext, CTA, logo) and a surface size. It returns exact pixel positions and font sizes for every element — adapted to that surface. React renders the result. React makes zero layout decisions.

```
layoutEngine(elements, surface) → LayoutResult
```

Open the live demo, edit the headline, and watch all 5 surface previews update instantly.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React UI (dumb renderer)               │
│                                                          │
│   AdEditor ──→ (elements state) ──→ PreviewGrid          │
│                                         │                │
│                              for each surface:           │
│                                         ▼                │
│                              layoutEngine(els, surface)  │
│                                         │                │
│                              ← pure TS, no DOM →         │
│                                         │                │
│                              → LayoutResult              │
│                              (x, y, w, h, fontSize)      │
│                                         │                │
│                              AdPreview renders it        │
└──────────────────────────────────────────────────────────┘
```

**Key architectural decision**: `src/engine/layoutEngine.ts` is a **pure function** — no React, no DOM, no side effects. This means it can be unit-tested in Node with plain Vitest (no browser required) and the algorithm is completely decoupled from rendering.

---

## How the Algorithm Works

### Step 1 — Classify surface shape

```typescript
aspectRatio = width / height

WIDE   → AR > 2.2    // Leaderboard 728×90 (AR ≈ 8.1)
SQUARE → 0.65–2.2    // MREC 300×250 (AR = 1.2), Square 300×300
TALL   → AR < 0.65   // Story 1080×1920 (AR ≈ 0.56)
```

### Step 2 — Select layout template

| Shape | Template | Description |
|---|---|---|
| WIDE | HORIZONTAL | Image left · text + CTA right — single row |
| SQUARE | CENTERED_STACK | Image top · logo · headline · subtext · CTA centered |
| TALL | VERTICAL_STACK | Large image · logo · big headline · subtext · full-width CTA |

### Step 3 — Priority-based element pruning

Each element has a priority (`1 = always show`, `3 = drop first`).

```
Surface area ≥ 50,000 px² → all elements visible
Surface area < 50,000 px² → drop priority-3 elements
Surface area < 10,000 px² → drop priority-2 too (only P1 survives)
```

The default content is deliberately too long for the Leaderboard banner — load the page and you'll see the engine's adaptive behaviour immediately.

### Step 4 — Scale fonts and images

```typescript
headlineFontSize = clamp(surface.height × 0.09, 10, 80)
subtextFontSize  = headlineFontSize × 0.58
ctaFontSize      = headlineFontSize × 0.70
```

Images fill their allocated slot with `object-fit: cover`. The engine returns real pixel values; the React thumbnail wrapper uses `CSS transform: scale()` to fit Story (1080×1920) into the grid without changing internal math.

---

## Why Rule-Based Heuristics (Not a Constraint Solver)

A **Cassowary-style constraint solver** (used in Apple's Auto Layout, Adobe XD) would express layout as a system of linear equations and let a solver find positions. It's more expressive — you can say "headline must be at least 12px from the CTA" without hard-coding it.

**Why I chose rule-based instead:**

1. **Explainability** — every layout decision maps to a named rule. Easy to debug, audit, and explain to a non-engineer.
2. **Performance** — O(n) with n = number of elements. No solver overhead.
3. **Sufficient for this scope** — 3 templates × priority system covers the real design space of IAB display ads.
4. **Deadline-safe** — adding Cassowary via `kiwi.js` is the natural next step, documented below.

The trade-off: rule-based heuristics become brittle as the number of templates grows. A constraint solver handles edge cases more gracefully.

---

## IAB Surface Presets

| Surface | Size | Shape | Template used |
|---|---|---|---|
| Leaderboard | 728 × 90 | WIDE | HORIZONTAL |
| MREC | 300 × 250 | SQUARE | CENTERED_STACK |
| Square | 300 × 300 | SQUARE | CENTERED_STACK |
| Interstitial | 320 × 480 | SQUARE | CENTERED_STACK |
| Story / Portrait | 1080 × 1920 | TALL | VERTICAL_STACK |

Plus: add **any custom size** via the "Add Custom Surface" button — the aspect-ratio preview tells you which template will be selected before you add it.

---

## Running Locally

```bash
# 1. Clone and install
git clone https://github.com/YOUR-USERNAME/anysize.git
cd anysize
npm install

# 2. Start dev server
npm run dev
# → http://localhost:5173

# 3. Run unit tests
npm run test
# → 15 tests, all passing
```

---

## Unit Tests

The engine is tested in pure Node — no browser, no React mount:

```
✓ classifySurface › Leaderboard (728×90) → WIDE
✓ classifySurface › Story (1080×1920) → TALL
✓ classifySurface › MREC (300×250) → SQUARE
✓ classifySurface › Interstitial (320×480) → SQUARE (borderline)
✓ classifySurface › perfectly square surface → SQUARE
✓ template selection › WIDE surface → HORIZONTAL
✓ template selection › SQUARE surface → CENTERED_STACK
✓ template selection › TALL surface → VERTICAL_STACK
✓ priority pruning › Story shows all elements
✓ priority pruning › micro surface (200×50) hides priority-3
✓ priority pruning › priority-1 always visible on any surface
✓ font scaling › Story fontSize > Leaderboard fontSize
✓ font scaling › all positions are non-negative
✓ hiddenCount › Story with default ad → hiddenCount = 0
✓ hiddenCount › result contains correct surface reference

Test Files  1 passed (1)
Tests      15 passed (15)
```

---

## What I'd Do With More Time

| Feature | Description |
|---|---|
| **Constraint solver (kiwi.js)** | Replace heuristics with Cassowary constraints — "headline must have min 8px gap above CTA" expressed as math, not if/else |
| **Drag-to-override per surface** | Let designers manually tweak positions for one surface without breaking others |
| **ML-suggested layouts** | Train on historical CTR data — "this element arrangement performed 23% better on story format" |
| **Animation preview** | Show how the layout transitions between surfaces for responsive environments |
| **Export to CSS/JSON** | One-click export of the LayoutResult as production-ready CSS absolute positions or a JSON spec |
| **Multi-ad comparison** | A/B test two creative variants across all surfaces simultaneously |

---

## Project Structure

```
src/
├── engine/
│   ├── types.ts          # AdElement, Surface, LayoutResult types
│   ├── classify.ts       # Surface shape classifier (WIDE/SQUARE/TALL)
│   ├── scale.ts          # Font size + dimension calculators
│   ├── templates.ts      # 3 layout templates (pure TS)
│   └── layoutEngine.ts   # Main entry — orchestrates all steps
├── engine.test.ts        # 15 unit tests (Vitest, Node-only)
├── data/
│   ├── surfaces.ts       # IAB surface presets
│   └── sampleAd.ts       # Default demo content
└── components/
    ├── AdEditor.tsx       # Left panel — edit content
    ├── AdPreview.tsx      # Single surface renderer
    ├── AdElement.tsx      # Individual element renderer
    ├── PreviewGrid.tsx    # Grid of all surfaces
    └── CustomSurface.tsx  # Add arbitrary surface size
```

---

## Backend REST API

The layout engine is integrated into an enterprise-grade backend microservice layer running via Vite server middleware:

### Endpoints

| Method | Endpoint | Description | Payload / Response |
|---|---|---|---|
| `GET` | `/api/health` | Service health, version, uptime | `{ "status": "healthy", "version": "1.4.0", "uptimeSec": ... }` |
| `GET` | `/api/surfaces` | Supported IAB surface specifications | Array of surface definitions |
| `POST` | `/api/adapt` | Computes full multi-surface layouts | `{ "elements": [...], "surfaces": [...] }` → `{ "computeLatencyMs": 0.54, "results": [...] }` |
| `POST` | `/api/generate-ad` | AI ad content generation with Zod validation | `{ "prompt": string }` → `{ "elements": [...] }` or typed errors |

### Testing the AI Content Endpoint with cURL

```bash
# Test successful generation (mock mode)
curl -X POST http://localhost:5173/api/generate-ad \
  -H "Content-Type: application/json" \
  -d '{"prompt": "mock: Cyberpunk Smart Chronograph"}'

# Test malformed response handling
curl -X POST http://localhost:5173/api/generate-ad \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test:malformed"}'

# Test invalid schema handling
curl -X POST http://localhost:5173/api/generate-ad \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test:invalid_schema"}'
```

---

## Tech Stack & Architecture

| Layer | Choice | Rationale |
|---|---|---|
| Frontend Framework | React 19 + TypeScript + Vite | Ultra-fast DX, strictly typed, zero runtime overhead |
| Design System | Flam Deep Dark Theme + Tailwind CSS v4 + Radix UI | Glassmorphic aesthetic, hardware-accelerated transitions |
| Layout Engine | Pure Functional TypeScript (Zero DOM) | Deterministic, portable, sub-millisecond execution |
| Backend Layer | Vite Middleware Engine Microservice | Exposes `/api/adapt` endpoint with live latency tracking |
| Testing | Vitest (15/15 unit tests passing) | Exhaustive test coverage of geometry, scaling, and priority pruning |

---

*Built for the Flam SDE FE R&D Intern Assignment.*
