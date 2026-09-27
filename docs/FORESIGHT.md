# FORESIGHT.md — Tessera, Three Horizons

*Written from inside each future, the way old sci-fi wore its machines without astonishment. Grounded in the ideation record, the council, and the organ scout; nothing restated, everything projected. (Futurist lane, 2026-09-27.)*

---

## FAR — 2031–2032: The Industry Is the Format

It's 8:40 on a Tuesday at a mid-size studio and the crew is walking the quilt before dailies. That sentence still describes the whole morning meeting: the wall is the meeting. The overnight agents — junior editors who wore the exoJ through the dark hours — left their roughs parked on cells, each park carrying its receipt and its contract residual. The director reads the wall like a chart table: dense regions where the agents churned, quiet bays where a held frame breathes, two cells overlapping because the agents disagreed and left the disagreement visible for the humans to arbitrate. Nobody opens anything. The wall *is* the state of the film.

Macro-resolution authoring stopped being a trick years ago. You block at 40×20 because motion is cheap to author there — shapes moved like puppets, beats held like breath — and when you need a face you zoom, and the detail is simply *there*, emerging from learned local rules that were trained before most of the current staff was hired. Zooming is a camera move, not a render. The macro field is the director's performance; the fine grids are the orchestra reading it.

Job titles that didn't exist in 2026: the **macro choreographer**, who owns the L0 field the way a cinematographer once owned the lens; the **contract auditor**, who watches the frozen encoders for drift and keeps emergence honest — the Goodhart watch, a full-time union role; the **detail supervisor**, who tunes which learned rules serve which look; the **lens smith**, who designs ramp-font-aspect triples as lighting rigs; and the **quilt curator**, the studio's spatial-memory librarian, who decides what the wall keeps and runs the composting margins so six months of alternates don't bury the film.

Deprecated, in order of death: the **proxy file** (there is no offline/online divide when the text *is* the online — the text proxy was the picture all along); **render farms as a billable line** (playback is a function call, not a decode; furnaces survive only for training); the **color grading suite**, which became the staging room — a grade is a re-staging, ramp and dial-field and learned rules, and you re-hang the film in minutes; and the verb **"encode,"** which retired from daily speech, because distribution is handing over a contract.

The thing nobody in 2026 predicted: the **receipts**. quilt-stone was built to make saves crash-safe — a WAL hygiene feature, an afterthought. By 2029 the receipt chain was the industry's authorship layer: every cut signed human, machine, or ensemble, guild agreements citing the ledger, credit disputes settled by reading the log. We solved provenance by accident while solving durability. (Runner-up, one line: because the master is text, no film has been lost since 2029. Nitrate had a century; a repo has longer.)

---

## MID — 2027–2028: The Wedge Years

Looking back from the end of 2028, one capability broke adoption open, and it was the one our own skeptic steelmanned: **motion-as-diff**, aimed at people who already edit. It survived every kill line because it never depended on the lines that killed the others. The paste test didn't gate it — diff editing lives inside the engine, not inside comment boxes. Mirror retention didn't gate it — streamers were a lane, not the wedge. The only real fuse was **determinism**, and we didn't defuse it by luck or by browsers converging; we defused it architecturally, by pinning the render contract, which is why change-density editing could claim frames were comparable. Change-density became production vocabulary: post supervisors asked "what actually changed between v14 and v15," story editors painted cuts by churn, archivists diffed restorations.

The first paying user: a QC lead on an animated series pipeline whose outsourced vendors swore nothing had changed in a scene and the diff said otherwise, frame by frame, in text she could paste into the ticket. Four seats, paid, before we had a pricing page. The commons, honestly: died as a *market* in 2027 — the paste test landed 2 of 5 and we called it at the line we'd drawn — and was reborn by 2029 as *infrastructure*, when platforms grew native support for frame-quotation rather than being asked to.

And the pyramid? The skeptic called it, near enough. Deterministic refinement carried roughly ninety percent of the usable value. The learned layer survived as learned dithering — and quietly became load-bearing at flicker suppression and prior initialization — while full artifact-free emergence stayed a 2029 problem, right at his ten percent. The mid-2028 falsifier ran as designed: the policy beat hand-tuned ramp+Sobel on blind preference in texture bands — fog, rain, crowds, where *plausible* and *true* coincide — and lost on motion-faithful classes. So we scoped the pyramid to what it could prove instead of killing it. The plan's virtue was that his being right didn't matter; the boring link shipped value the whole time. The exoJ, meanwhile, proved him right a second way: skill still lived mostly in the models, the spec was copyable, and the moat turned out to be corpus and defaults — which is why we started collecting both in 2027, when The Tap's logs graduated from hypothesis to asset.

---

## NEAR — 2026-Q4 → Winter: What Had to Be True in the Code

By the time the snow melted, three load-bearing walls were in, because everything above is built on them:

1. **The EDL is pure data, derived from a log.** Holds expand to three segments; unit tests existed before timeline UI; every splice and hold is a typed JEV delta in a jev-quilt WAL. The timeline is a *view*, never a state to be mutated.
2. **The render contract is pinned.** Explicit color conversion, fixed dither seeds, a versioned engine string inside every cache key, golden-frame tests run across engines in CI. The determinism audit passes by construction, not by browser charity.
3. **The macro sidecar ships from frame one.** E0 frozen early; every rendered frame carries its L0 field and contract residual even though nothing consumes them yet. The 2027 training corpus exists because winter wrote it — retrofitting representation data onto an existing corpus would mean re-watching every clip ever made, the one cost text cannot absorb backward.

Guardrails that held: the pincher rule (under 50 ms, never a model, on scrub/hover/snap); baked screen-capture as the one path with no source blob, where text economics are fully real; and dialect discipline — tessera is a projection layer, never a fourteenth quilt runtime.

---

## The Payoff: Best Architecture, Today

```
 sources ──► SourceProvider seam ──► chiaroscuro core ──► text frame + L0 sidecar
 screen│video│mirror                (INHERIT; contract    (E0 field + residual
                                     versioned, frozen)    logged every render)
                                                │
                                                ▼
                     cache: hash(source+preset+engine+grid) — LRU ±30f, ~8 MB
                                                │
                                                ▼
                     quilt-rust cells — projections only, no 14th dialect
                                                │   intent: human hands or exoJ agent
                                                ▼
                     JEV deltas ─► WAL (jev-quilt) ─► EDL derived view
                                                │
                    ┌───────────────┬───────────┴────────────┐
                    ▼               ▼                        ▼
          stone-v1 receipts   playback = contract      exports: frame-seq text
          on every save       evaluation, not decode   │ standalone-HTML │ WebM
```

**Borrowed vs built.** Borrowed: chiaroscuro (render), quilt-rust (cell substrate), jev-quilt (WAL + typed deltas), quilt-stone (receipts), tldraw/xyflow (quilt surface), ffmpeg.wasm (export only). Built: SourceProvider seam (screen-capture is ours alone), the pinned render contract + golden frames, the EDL model + hold expansion, the L0 sidecar, exoJ tool surface.

**The three irreversible decisions — make them now:**
1. **Where the EDL lives:** pure derived data over a typed WAL. Everything human or agent does is a delta; nothing mutates a timeline. (Reversing this later means re-watching every clip ever made.)
2. **Deterministic render contract, versioned in every cache key and receipt.** Not a hygiene goal — the load-bearing wall for diff-editing, receipts, and agent trust alike.
3. **Representation-space macro contract from frame one.** Log E0 fields + residuals even before anything consumes them; the training corpus of 2027 is written by winter 2026, for free, or not at all.

*The Foresight in one line: the format is the moat; the WAL is the product; winter writes the corpus.*
