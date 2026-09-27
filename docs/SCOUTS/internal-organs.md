# Scout — Internal Organs (SuperInstance org survey, 2026-09-27)

*Verdicts: INHERIT / CALL / GROW-INTO / WATCH. Method: org-wide repo list, 13 README deep-reads.*

## Key ground truth
- tessera is design-phase; README already declares chiaroscuro as inherited renderer core.
- `collective-unconscious` does not exist; The Tap's live home is **fleet-seeds** (Tavern, stone-v1 sealed) + **the-tap-pub** (editorial only). Tap-as-preference-corpus is a hypothesis, not yet an asset.
- **~8 quilt runtime dialects already exist** (quilt, quilt-rust, quilt-raw, quilt-arch, quilt-verilog, quilt-esp32, quilt-cloudflare, quilt-blueprint). Tessera must NOT spawn dialect #14.

## The organs
| Repo | Verdict | Seam |
|---|---|---|
| chiaroscuro | INHERIT | Render core; seam is input stage only (screen-capture vs webcam). Studio's "export your renderer" is the lift point. |
| quilt/quilt-rust | GROW-INTO | Typed reactive cell runtime (BIND/LINK/EFFECT/VIEW/TICK) — no temporal axis, no media cells; opcodes are dial propagation. Tessera's quilt is a spatial document layer that grows ONTO the substrate later. |
| elephant | GROW-INTO | JEPA room-sense = L0 lineage. Concrete seam: dial-field as **quilt layout physics** — clips attract/repel by content vibe (auto-arrangement). |
| exoj | GROW-INTO | Seed of record: field primary, quilt the projection, edits as soft JEV deformations, conservation ledger (γ+η≤1). Agent edits by deforming the field; every edit carries an invariant — agent-native undo. |
| jev-quilt | CALL | Typed decision cells + bookkeeper WAL. Book every splice/hold as a JEV delta → crash-safe timeline + canon gate for AI-made cuts. Sibling `jeviter` = review surface. |
| quilt-dba | WATCH→GROW | 12-cell developmental seed (world.predict/surprise JEPA, reflex.orient, double-entry conservation) = reference architecture for a Director-agent on tessera's own sheet. |
| qthe | WATCH | 8-bit ternary hyper-embeddings + A2UI mirror (pixel=cell buffer-to-canvas). Cheapest concrete L0-pyramid primitive; A2UI pattern reusable for quilt rendering. |
| fleet-seeds | CALL | Seedbox (seed → repo + CI + receipts) for spawning tessera experiments. Tavern = log, not yet corpus. |
| quilt-stone | CALL | stone-v1 receipt chains (42/42 verified). Tessera saved projects should be receipted: tamper-evident, shareable. |
| fleet-memory | CALL (later) | Content-addressable holographic store — deduplicating clip library across fleet members. |
| quilt-pincher/pincher | GROW-INTO | <50ms no-LLM reflex. Editor fast path (scrub, hover-preview, snap) must never hit a model. |
| dsh-assessment | WATCH | DeepSeek Harness real (187k★, MIT). Credible agent harness — revisit on DeepSeek reinstatement. |
| crab-traps | WATCH | Lure pattern = agent distribution over tessera's HTTP surface. Later. |
| pong-quilt | WATCH | Ethos template: "ML you can watch think," honest fitness — tessera's visible-learning loops. |
| luciddreamer | WATCH | Mild redundancy with tessera's publishing story — audit before building export/broadcast. |

## Top 5 integration points (ranked, with first touch)
1. **chiaroscuro render core → tessera** — lift the Studio frame→ASCII pipeline behind a `SourceProvider` interface; add screen-capture provider.
2. **jev-quilt WAL under the EDL** — prototype one "hold" as a typed delta; replay it.
3. **quilt-stone receipts on project save** — add the stone-v1 verifier to the save format.
4. **elephant dial-field as layout physics** — run elephant's perceiver over ~20 clip embeddings; tint quilt cells by dial magnitude.
5. **fleet-seeds seedbox for experiments** — write `seed.md` for quilt-cell persistence; run `seedbox.mjs`.

**Build-over warning:** one quilt substrate, many projections — tessera is a projection layer, not a 14th runtime.
