# SEED: GLYPH-SENSE — elephant's room-sense on REAL rendered frames

**Planted:** 2026-09-27 · **Gardener:** seed-gardener subagent · **Parent:** lab scout `lab/LAB-NOTE-2026-09-27.md`
**Status:** graduated from synthetic to real decodes. **Verdict: GRAFT.**

## Hypothesis

Elephant's room-sense (`~/projects/elephant` — `vmf.py`: `zvec` / `vmf_fit` / `edge` / `record_with`) can run as Tessera's live temperature organ over **real rendered ASCII frames**, and its readings log into quilt cells in the exact wire shape `quilt-rust`'s field-edge-bridge consumes. The lab proved separation on synthetic frames; this seed replaces the synthetic generator with real ffmpeg decodes and keeps everything downstream **unchanged**.

## Method

1. **Real frames** — ffmpeg (static 7.0.2, list-form subprocess, frames never touch disk) renders two contrasting 12 s @ 10 fps 160×90 clips, decoded off the PPM `image2pipe`:
   - `still-solid` — `color=c=gray` (dead-calm room, nothing moves)
   - `moving-testsrc` — `testsrc` (busy room: rotating gradient, counter, sweep)
   Pure-python P6 parse (no PIL needed even though PIL exists — the pure path is the portable one), integral-image block-mean raster to the lab's 80×24 grid, same `" .:-=+*#%@"` ramp → `(T, 24, 80)` uint8, the lab's exact frame dtype. Verified by preview rasters (`preview-*.txt`: solid `+` vs testsrc's bars + counter digits).
2. **Features → dials** — the lab's mapping **verbatim** (`glyph_rooms.frame_features`, `windowed_readings`): 6 features (change, persistence, gradient energy, crest coherence, density, mean luminance) → hand-crafted readings for exactly the 7 `vmf.DIALS` names.
3. **Elephant unchanged** — `zvec` → `vmf_fit` (B=400): non-overlapping W=8 windows (15/clip) for the honest-CI headline fits; 10-window batches of the overlapping stream for the quilt log (each batch ≥ `NMIN=10`, so every logged fit is honest).
4. **Quilt seam** — `QUILT-CELL-LOG.jsonl`, one cell per batch: `{clipId, t, mu_hat, kappa, warmth, se, gate}`; `gate` = sequential `edge(prev, this)` (null genesis cell, `record_with` semantics: never a fake number).

## Real numbers

Headline fits (non-overlapping windows, N=15, B=400):

| clip | change/frame | persist | κ̂ | κ 95% CI | ρ | warmth_vmf | μ_se |
|------|-------------|---------|------|----------|------|-----------|------|
| still-solid | 0.0000 | 1.000 | **500.0** (saturated) | [500, 500] | 0.999 | +0.691 | 0.0000 |
| moving-testsrc | 0.0051 | 0.958 | **253.2** | [98, 500] | 0.988 | +0.788 | 0.0396 |

Room separation — drift gate (`db_factor=2.0`) and divergence:

| edge | d_μ | d_warmth | d_log_κ | real |
|------|------|---------|---------|------|
| still → moving | **0.628** | +0.097 | −0.680 | **True** |
| moving → still | **0.628** | −0.097 | +0.680 | **True** |

`kl_sym(still, moving) = 147.5` — same order as the lab's A-vs-others (75–115). Sauna/plunge: within-room cosines 1.000 / 0.996, cross 0.785, **gap +0.211** (positive, as required).

Quilt log — 24 cells, the gate does exactly what an organ should:

- **Still room: silent.** 12 cells, every gate `real: false` with d_μ exactly 0.0 (point-mass room, μ_se = 0; the deadband holds without flicker).
- **Boundary: fires.** still→moving cell books d_μ = 0.608, `real: true` — the walk between rooms is enormous, detected the moment it happens.
- **Moving room: reads continuous drift.** 9 of 11 within-clip gates `real: true` at d_μ 0.005–0.084 (testsrc's gradient genuinely rotates ~1°/frame — nonstationarity is real and the organ tracks it); 2 consecutive-batch pairs held by the deadband. Genesis cell books `gate: null`.

## What transfers from the lab

- **The entire protocol** — windowed readings → `zvec` → `vmf_fit` → `edge`/`kl_sym`/sauna-plunge ran with zero changes to elephant and zero changes to the lab's dial mapping. Only the frame *source* changed. That is the whole portability claim, now demonstrated.
- **The deadband is a real deadband** — quiet on the quiet room, proportional on the busy one, decisive at the boundary. Same behavior the lab saw across four synthetic rooms.
- **κ tracks temperature coarsely, with the same caveat** — still (dead) room saturates κ ≥ 500; moving room κ ≈ 253. The lab's booked lesson repeats verbatim: the geometry transfers, the warm/cold *sign* is a property of the room class (here the moving room reads slightly warmer, +0.788 vs +0.691 — the opposite ordering of the lab's calm-slow room; do not treat "still = warmest" as a law).
- **κ CIs starved at N=15** in d=7 ([98, 500] for moving) — same sample-size fact as the lab; pool more windows in production.

## Portability

- **Core path: pure python + numpy + ffmpeg.** The PPM pipe parse means no PIL/OpenCV anywhere; ffmpeg is a static binary; the whole pipeline is CPU and runs in **< 1 s** for 240 frames. Drops onto any node (including the F/V EILEEN boat, offline).
- **Seam is one dtype:** anything that produces `(T, 24, 80)` uint8 ramp indices feeds the organ — chiaroscuro's node engine (five browser doors) replaces the ffmpeg source with zero downstream changes; chiaroscuro is the intended production renderer.
- **GPU path later:** elephant `gpu/` v0 room-encoder embeddings replace the hand-crafted dials behind the same `zvec`/`vmf_fit` interface (lab's declared next step); the quilt seam doesn't move.
- **Quilt seam is live:** `QUILT-CELL-LOG.jsonl` is the field-edge-bridge wire shape (per-cell `{clipId, t, mu_hat, kappa, warmth, se, gate}`, imbalance ≡ d_μ identity intact, genesis nulls preserved).

## Perf (measured)

- `vmf_fit(B=400)`: **mean 3.2 ms/batch** (max 3.4 ms, n=24 batches); honest-CI clip fits ~3–15 ms.
- ffmpeg decode + PPM parse + raster: **0.86 ms/frame** mean (0.48–1.23 across clips).
- Full seed run (240 real frames, 27 fits, all tables): well under 5 s wall, CPU-only.

## Honesty boundaries

- Sources are ffmpeg *generators* (testsrc / solid color) — real decodes, real raster pipeline, but not yet a live chiaroscuro webcam/screen stream. That claim stays booked until the camera runs; the render-side seam is proven, the capture side is next.
- Within-moving `real: true` gates ride overlapping-window fits whose μ_se is optimistic (window autocorrelation); the headline separation uses the lab's non-overlapping honest-CI fits. For a live stream the right per-batch unit is the trailing non-overlap window set — production should refit on windows that just closed.
- κ = 500 on the still room is saturation (KMAX), i.e. "≥ 500", not a measurement.
- One dial mapping (hand-crafted, the lab's); no learned encoder was exercised.

## GRAFT VERDICT

**GRAFT.** The hypothesis holds on real frames end-to-end: elephant reads real decoded ASCII as rooms with the geometry they should have (d_μ 0.628 across, kl_sym 148, gap +0.211), the drift gate is quiet-quiet/fire-at-change, and the readings already land in the quilt's wire shape. Recommend grafting into tessera as the field-edge producer: chiaroscuro frames → this adapter → `QUILT-CELL-LOG` → field-edge-bridge. Next: (1) learned dials via `gpu/` v0, (2) live chiaroscuro capture, (3) per-cell `record_with` provenance fields if the bridge wants them.

## Files

- `glyph_sense_real.py` — the seed (run: prints tables, writes log + previews)
- `QUILT-CELL-LOG.jsonl` — 24 cells, field-edge-bridge wire shape
- `preview-still-solid.txt`, `preview-moving-testsrc.txt` — raster verification
- `SEED.md` — this file
