# SEED: WAL-EDL — the timeline as a fold, never state

**Grown:** 2026-09-27 · **Language:** pure TypeScript, zero deps (node:crypto, node:fs only) · **Status: KEPT — first graft onto the trunk**

## Hypothesis
The timeline is pure derived data over a typed append-only WAL. Edits are small typed deltas (SPLICE, TRIM, HOLD, PARK, REORDER); the EDL is `fold(wal)`; crash-safety is `replay(wal)`. If a torn write can't corrupt a project and a lost edit can be re-appended to reach a byte-identical EDL, the design holds.

## Method & actual output
- 20-delta scenario (fixture.ts): splices, trims, holds, parks, reorders across 6 clips.
- WAL = JSONL, one record per line, **chained checksum** (`sum = sha256(prev:seq:delta)`) — binds each record to its predecessor and its content, so tampering anywhere breaks the chain.
- `node test.ts` → **ALL TESTS PASSED**
  - Crash test: file truncated 17 bytes into the last line → replay detects torn tail, folds 19 good records, EDL == fold of the surviving prefix (canon hash match).
  - `recover()` rolls the tail back; re-appending the lost edit yields **canon `30192ea2661650fb` — byte-identical to the pre-crash EDL**.
  - Tamper test: mutating delta 5's payload → chain breaks there, exactly 4 records fold.
  - HOLD: a hold at 2000ms (800ms, pulse) expands to exactly **3 segments** (pre-play / frozen / post-play); timeline stretches to 4800ms; source consumed unchanged.
  - Painter's algorithm: a layer-1 clip covering a layer-0 clip's frozen hold wins 1000–3000ms; the held clip shows on both sides — resolution correct.

## Portability story
Pure TS, no build step (erasable-syntax-only, runs directly on Node ≥22.18). Runs in browser (swap fs for IndexedDB/opfs append) and anywhere node runs. The format — JSONL + chained checksums — is language-agnostic; a rust reader is a one-afternoon port.

## Perf story
Append is O(1) (`fs.appendFileSync` of one line). Open-time replay is O(n) over the log; for a feature-length project (~10⁵ edits) that's still sub-second JSONL. Swap to sled/SQLite only if logs exceed ~10⁷ records or we need indexed seeks — not before.

## GRAFT VERDICT
**KEEP.** This is the timeline foundation: EDL-as-view satisfies crash-safety, undo (truncate + re-append, or negation deltas later), multi-writer merge (rebase logs, chain re-links deterministically), and audit (the chain is a poor-man's quilt-stone receipt already). Next graft: JEV-typed deltas from jev-quilt's bookkeeper instead of raw JSON deltas — same WAL, typed cells.

*(Grown by lane-then-bridge: seed lane was rate-limited mid-plant; bridge finished tests, fixed a recover() semantics bug the crash test caught, verified green.)*
