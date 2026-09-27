# SEED: RENDER-CONTRACT — a baked frame IS its hash, on every runtime

**Grown:** 2026-09-27 · **Language:** pure JS + TS test, zero deps (FNV-1a and UTF-8 encoded by hand) · **Status: KEPT — byte-identity proven node↔browser; this is the quilt's receipt**

## Hypothesis
Tessera's baked-frame renders must be byte-identical across runtimes (node vs browser, eventually rust/wasm) or the quilt contract breaks — a quilt stone that means a different picture on each machine is worthless. If the renderer is integer-only (bitwise ops + `Math.imul`, no float rounding at any implementation-defined boundary) and the hash is hand-rolled over spec-pinned bytes, then one seed → one canonical string → one hash, everywhere. Provable with the smallest possible frame.

## Method & actual output
- `frame.js` — 80×24 char grid, classic ramp `' .:-=+*#%@@'` (verbatim chiaroscuro `RAMP_SETS.classic`). Ink density 0–100 per cell from three integer fields: concentric rings (dy doubled for 2:1 cells), a diagonal sweep mod 53, and a seeded **xorshift32** speckle mod 29. Every op (`+ - * % ^ >>> |0 imul`) is spec-defined for any JS engine — rounding-free by construction.
- Canonical string carries a header line — `CHIARO-FRAME/1 / 80x24 ramp=classic seed=0x5eed` — over the text, so the hash binds version + dims + ramp + seed + content, not just pixels.
- Hash: **FNV-1a 32-bit, implemented by hand** over a hand-rolled UTF-8 encoder's bytes (auditable to the bit; no TextEncoder, no crypto module).
- `test.ts` (plain asserts, `node test.ts`) → **ALL 19 TESTS PASSED**
  - FNV-1a known-answer vectors: `""→811c9dc5`, `"a"→e40c292c`, `"hello"→4f9f2cab` (published reference values).
  - UTF-8 encoder pinned: `é→C3 A9`, `▓→E2 96 93`, `█→E2 96 88`, `𝕏→F0 9D 95 8F` (surrogate pairs).
  - Determinism (two renders identical), shape (24×80, alphabet ⊆ ramp), field non-degeneracy (≥6 distinct glyphs), seed sensitivity, canonical-binding checks.
- `pw-test.js` (playwright-core + headless shell, pattern lifted from chiaroscuro `tools/pw-test*.js`) driving `harness.html`:
  - **node hash: `fa7fc3c1` · browser hash: `fa7fc3c1` → MATCH**
  - text byte-identical: 1943 bytes (24×80 + 23 newlines), DOM display matches too.
  - Seed sensitivity samples: seed 2 → `bb3c381a`, seed 3 → `a3a6a6e9`.
- Honest ledger: one test-side bug caught and fixed mid-grow — my ramp-alphabet check split the *joined* text, so the `\n` separators failed the check. Contract code was clean; the test was lying, not the renderer.

## Portability story
Integer-only math means byte-identity is not a V8-sharing accident — it holds for **any** ECMAScript runtime (node, chromium, firefox, quickjs) and ports mechanically to rust/C/wasm (xorshift32 + FNV-1a are a page of code each). Same file, two hosts: CommonJS in node, `window.ChiaroFrame` in the browser (UMD, same shape as `engine.js` in this directory). Non-ASCII ramps (blocks, runes) are already safe: the hash path pins UTF-8 bytes by hand. Known out-of-scope: float paths (`Math.sin`, `Math.pow`) and any decoder (`drawImage` bilinear) stay excluded from contract scope — `engine.js` already quarantined those; this seed shows the discipline at minimum scale.

## Perf story
Render + hash = **35.4 µs/frame** (20k-frame loop, node 22, includes hashing the 2024-byte canonical string). Everything is O(cells) with a constant factor of a few integer ops; FNV-1a is O(bytes). A full quilt stone (thousands of frames) hashes in low milliseconds on one core — the expensive part of a real render is the pixel pipeline, not the receipt. No reason to reach for a faster hash until profiles say so.

## GRAFT VERDICT
**KEEP.** The hypothesis held on the first cross-runtime pass: byte-identical text and hash from one seed on two runtimes. This is the quilt's receipt mechanism — bake a frame, stamp `fa7fc3c1`, and any machine can verify it sees the same picture. Next grafts: wrap `engine.js`'s `renderFrame` in this same hash-receipt (its integer paths are already portable by design), then a rust port reading the same canonical strings as a cross-language proof.

*(The frame itself — 80×24, seed 0x5eed, hash `fa7fc3c1` — is recorded in git history via harness.html and this file; run `node pw-test.js` to re-stamp it.)*
