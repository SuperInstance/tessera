# TESSERA — Reverse-Actualization Roadmap

*Casey's directive, 2026-09-27: start from the future where people design ASCII-first because of massive savings, high-concept fast iteration at super-low cost — then walk backward to today, taking each era's tools for granted. "Follow the stories like old sci-fi that didn't even know the power of what they were painting."*

*Read it the way it was written: back to front. Each era assumes the one after it already worked.*

---

## 2031 — The Text-Native Cinema (5 years)

Nobody "converts video to ASCII" anymore. ASCII **is** a first-class production format — the way 1995 treated DV or 2015 treated vertical video. Film schools teach value structure on 70-step ramps because you can't fake Caravaggio past a ramp, and the ramp is honest.

The studio looks like this:

- **Design happens at macro scale.** A director roughs a whole scene on a 40×20 grid — because at macro resolution, *motion is cheap to author*. You block the scene like a puppeteer: move the shapes, hold the beats. Then you zoom into any region and the detail levels **emerge** — the macro mechanics pass down to finer grids whose local representation rules were learned, not hand-coded. Zoom out for choreography, zoom in for a face, back out before the render budget even notices. Resolution is a camera move, not a re-render.
- **The representation rules are learned.** Each level of the pyramid — macro motion → mid grids → glyph texture — has models trained on the fleet's GPU (the 4050 started this; whatever the boat carries in 2031 continues it). They don't ray-trace and they don't "pick characters" by lookup: they learned which representations *emerge* from the level above. JEPA-descended senses (the elephant lineage) read room temperature; quilt-lineage databases remember every look that ever worked; The Tap's bar taught the models what audiences actually watch.
- **Any LLM can don the exoJ.** This is the part history kept: the intelligence behind the studio was never a proprietary model. It was an interface — the exoJ — that any language model, local or frontier, can put on and immediately operate the studio the way a trained editor does. The tools learned the craft; the models bring the intent. A kid with a free chat model makes a film that would have taken a studio in 2026, because the studio itself holds the skill.
- **The fleet is invisible.** jev-quilt, quilt-dba, exoj, fleet-seeds, The Tap tavern — by 2031 these aren't products anyone opens. They're the backstage: the memory, the taste, the rehearsal space where agents and humans try scenes on each other before cameras roll. Users know the name Tessera. They have never needed to know the plumbing, which is the highest compliment plumbing gets.
- **Cost fell off a cliff** for the boring reason: text frames are ~8 KB, and everything downstream of "the footage is text" — storage, transport, diffing, training signal — got 100× cheaper the day the pixels stopped being pixels. The savings weren't a feature. They were the substrate.

## 2029 — The Proof Years (3 years)

The people building toward the 2031 ideal are working with Tessera-lineage tools in earnest, and taking them for granted in their own way:

- Real studios (and a lot of not-real ones) use **ASCII pre-vis** as the cheap first pass: block the scene in text at macro resolution, only commit pixels for the shots that survive. "Text pass" becomes production vocabulary.
- The **resolution-pyramid editor** exists in early form: macro grid for motion, emergent detail on zoom, trained by RL against human preference signals gathered in The Tap's bar. It's janky. It's used anyway, because iteration speed beats polish at the ideation stage — that was always the wedge.
- **ExoJ v1 ships** as a spec + reference harness: enough structure that a handful of models can drive the studio end-to-end from natural language. Most still need hand-holding. One or two don't, and the demos of those two are what pull the next thousand users in.
- The **fleet mesh** stops being internal: quilt-dba graduates from "our memory" to "a video database that answers questions" — every clip anyone ever made is a queryable tile, and directors ask it things like "show me every chase cut on a hold-then-release" and it answers in tiles.
- The honest ledger from these years: the first learned-representation layers were wrong in ways nobody predicted (details that emerged were *plausible*, not *true to the macro intent*), and fixing it — conditioning emergence on macro contracts, not just macro pixels — was the breakthrough that made 2031 possible.

## 2027 — The Working Tool (1 year)

Tessera is a real editor that real people use for real rough-outs, and the seeds of the pyramid are planted:

- **v1.x:** WebCodecs frame-exact pipeline replaces the ±1-frame slop era. Multi-project quilt. The **re-skin slider** and **motion-as-diff** from the vision lane are shipped and heavily used — diff-based editing turns out to be the thing people can't go back from.
- **Macro/zoom authoring v0:** the quilt already is a zoomable multi-resolution surface; the editor gains the first honest version — a macro grid clip type whose motion you author directly and whose detail is *rendered down* from it, no learning yet, just deterministic refinement. People start designing at low res because it's faster, which builds the habit the 2029 models will need as training ground.
- **The first learning loop:** RL on the 4050 learns *local glyph-choice policies* conditioned on macro motion — not creative, just correct: "this region is moving left fast, favor these edges." Small, boring, and the first link in the emergent chain.
- **ExoJ v0:** a tool-schema + transcript format so agents can operate the studio headlessly. The fleet's own agents (and Wesley's successors) cut scenes overnight and leave their roughs on the quilt for morning review.

## 2026-Q4 — The Wedge (6 months)

Tessera v0.x is the charter, shipping in slices, each independently useful:

- **Slice 1 — Capture:** screen/stream selection-box → live ASCII → record to baked text clips. People use this alone, as a better mirror and a clip harvester.
- **Slice 2 — Transport:** import any video, play/pause/seek/step, park frames. The frame-stepper becomes the meme-and-analysis tool overnight (stepping through film in text is its own genre).
- **Slice 3 — Quilt:** the free-drag surface, park-and-hold cells, IndexedDB persistence. This is the heart per the vision lane; it gets the most polish.
- **Slice 4 — Timeline:** EDL with holds, overlaps, gaps; WebM + standalone-HTML + frame-sequence exports.
- The **first non-Casey user** lands somewhere in here, uses it for something we didn't predict, and that use case gets promoted to a first-class feature. (Track record says: it will be the diff view or the terminal export.)

## Next Week

- **The renderer spine:** port chiaroscuro's engine core into `tessera/src/engine/` as a clean module (the gold keeps its fingerprints — chiaroscuro stays the reference implementation and the four doors stay live).
- **Screen capture spike:** `getDisplayMedia` + selection box over the letterboxing math (the systems lane's known bug farm) — get one live region rendering in the Tessera shell.
- **EDL unit tests first:** the hold primitive as pure data (3-segment expansion) with tests, before any timeline UI exists. Boring first, because the EDL is the part that must not rot.
- **Quilt skeleton:** pannable surface, one draggable cell, park-on-frame. No persistence yet.

## Today (2026-09-27)

- Repo born, charter written, name chosen. ✅
- Ideation from two tempers banked in `docs/IDEATION.md`. ✅
- This roadmap. ✅
- And the plan, compressed: **tomorrow the engine moves in; next week a region of your screen renders as text inside Tessera; in six months you rough out a scene end-to-end; in a year people design at macro resolution because it's faster; in three, the detail learns to emerge; in five, a kid with a free chat model dons the exoJ and makes a film in an afternoon — and takes all of it for granted.**

That last part is the tell that we did it right. Old sci-fi never knew the power of what it was painting either.
