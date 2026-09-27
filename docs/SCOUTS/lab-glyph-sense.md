# Scout — Lab Ground Truth (2026-09-27)

*Local experiments on eileen (CPU, numpy). Scripts + full note: `lab/LAB-NOTE-2026-09-27.md`. Synthetic frames; real-chiaroscuro validation is the booked next step.*

## Experiment 1 — ELEPHANT-ON-GLYPHS: WORKED
Elephant's vmf.py machinery, untouched (`zvec → vmf_fit → edge/kl_sym`), on 4 synthetic 80×24 ASCII "rooms" (128 frames each, 2×2 calm/busy × slow/fast):

- κ̂ separates rooms: 160 (calm-slow) / 86 / 61 / 55; all 6 room-pairs pass the drift gate `real: True`.
- Cross-family d_μ 0.78–1.03 vs within-family 0.19–0.47; kl_sym 75–115 vs 2–16.
- Caveats booked: N=16 CIs wide (B/C order swap inside them); the v3 "cold = high κ" prior inverts on this room class — geometry transfers, sign is room-class property.

**Verdict:** the room-sense survives in glyph space on a modality it was never built for. Elephant becomes Tessera's temperature organ via a thin `GlyphSpace` adapter (frames → 7 dial readings), edges loggable straight into quilt cells via `record_with` / quilt-rust's field-edge-bridge.

## Experiment 2 — JEV-MACRO (pyramid contract probe): WORKED
4×4 mean-pooled luminance (L0 stand-in) vs representations over 130,816 frame pairs:

- d_glyph ↔ d_macro: **ρ = 0.824 Pearson / 0.891 Spearman** (0.961 cross-room).
- d_dialrepr ↔ d_macro: only 0.354 — the dial representation is NOT redundant with pixel pooling.
- Decisive: corr(representation-change, macro-temporal-delta) = **0.966** vs static luminance 0.187.

**Verdict:** the pyramid contract d(E0(x), L0) ≤ ε has a cheap measurable floor — a dumb mean-pool already preserves glyph distance structure, so a hand-crafted E0 is legitimate before any training. And it independently confirms the scientist's L0 design: the **beat/flow axis carries the structure; static pooled luminance carries none**. L0 must be flow+beat, not a picture summary.

## Booked next experiments
1. Real chiaroscuro frames + elephant's gpu/ v0 encoder embeddings (venv exists: ~/venvs/elephant-gpu) with cast-heldout control.
2. L0 = 40×20 flow+beat RAFT-lite tokens; regress contract violation ε against elephant's per-edge d_μ → "the room-sense survives the pyramid" becomes a render-pipeline regression test.
