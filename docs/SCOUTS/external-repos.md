# Scout — External Repo Landscape (2026-09-27)

*Method: web search + GitHub survey. Verdicts: RIDE / STEAL / RIVAL / IGNORE.*

## 1. ASCII/character video renderers
- **libcaca** (~700★, alive) — classic fixed-filter codec. **STEAL**: glyph/dither math as proven fallback filter set; codepage handling is gold.
- **chafa** (~2k★, active) — best terminal visualizer; symbol feature matrix (aspect/coverage/brightness). **STEAL**: this is the "fixed filter done right" baseline Tessera's learned mapper must beat.
- **TheZoraiz/ascii-image-converter** (~3.5k★) — static-first CLI. **IGNORE** (reference ramps).
- **timg** (~2k★) + terminal video players — playback-only. **IGNORE**; steal timg's protocol-fallback ladder.
- **Learned/neural ASCII** (arXiv 2025-03 "Evaluating ML Approaches for ASCII Art Generation"; CNN/RL glyph-selection experiments) — **RIVAL ALERT / WHITE SPACE**: no production library ships a learned glyph mapper. Tessera's edge.

## 2. Browser editors & timeline
- **ffmpeg.wasm** (~45k★) — **RIDE** as export/encode fallback only, not core.
- **WebCut** (Dec 2025) — timeline controller framework (zoom, segments, frame nav). **RIDE/STEAL** — closest reusable timeline; check license/React fit.
- **Remotion** (~22k★) — **STEAL** sequencing model concepts, not the engine (renders pixels; commercial license friction).
- Toy tier (2minclip, vEditor, ffmpeg-webCLI) — **IGNORE**.

## 3. Canvas / quilt hosts
- **tldraw SDK** (~38k★, very active) — infinite-canvas app engine, custom shapes, runtime API, multiplayer. **RIDE** — strongest host for the spatial quilt (clip-frames as custom shapes).
- **xyflow / React Flow** (~28k★, MIT) — **RIDE** if quilt is node-graph-shaped; tldraw if freeform spatial.
- **Excalidraw** (~90k★) — drawing-first, not app-embed friendly. **IGNORE.** Rete.js/Litegraph — aging. **IGNORE.**

## 4. Text-as-first-class media
- **notcurses** (~7k★) — planes/palettes/animation model. **STEAL** conceptually: z-planes of cells ≈ tessera layers.
- **Sixel ecosystem** — bitmap-in-terminal, anti-glyph philosophy. **IGNORE** (export target at most).
- **Braille/dot renderers** — double resolution but break "characters are media." **IGNORE** as core; optional hi-res mode.
- Text-mode revival (retro computing, demoscene, ANSI socials) is ascendant 2024-2026 with **no editing tool built on it** — **WHITE SPACE.**

## 5. Agent-uses-video-tools
- **Kinocil/Kinocut (KyaniteLabs)** — open-source MCP server, guardrailed local FFmpeg for agents, Apache-2.0, growing. **RIVAL→RIDE**: proves the demand; expose Tessera's own MCP surface on similar patterns.
- **HKUDS/VideoAgent** (~3k★+) — agentic video *understanding* (sample→describe→decide loop). **STEAL**: maps onto hold-frame/auto-cut decisions.
- Thin FFmpeg-wrapper MCPs — **IGNORE.**
- **Generative video models** (Wan/LTX-2/HunyuanVideo/Open-Sora) — orthogonal engines; the trend that matters: agents increasingly speak "video as data," and **glyph video is the cheap, token-friendly representation agents can read/write directly.** Huge latent synergy.

## The 3 gaps (Tessera's white space)
1. **Learned glyph mapping in a product** — all shippers are fixed-filter (libcaca/chafa era). A trained per-scene mapper + perceptual metric = category lead.
2. **Text video as an editable project format** — every ASCII-video project is a one-shot converter/player. Nobody has timeline + holds + spatial canvas over glyph clips: an NLE where text IS the media. Unoccupied.
3. **Agent-native editing surface** — MCP servers crudely wrap ffmpeg CLI; agents can't *see* what they edit. Glyph video is directly token-representable: "the video format agents can read and edit natively" (quilt as context window) — a white space nobody is even aiming at.

**Bottom line:** RIDE tldraw/xyflow + ffmpeg.wasm (export); STEAL chafa/libcaca baselines + VideoAgent's perception loop; the learned-mapper + text-NLE + agent-readable-video stack is uncontested.
