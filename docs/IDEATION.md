# TESSERA — Ideation

*Two lanes, two tempers. Vision first; systems pragmatism lands beside it. Where they disagree is where the design decisions live.*

---

## Lane 1 — Product Vision

# TESSERA — Ideation

*The video studio made of letters. Companion to the captain's charter; grounded in what chiaroscuro already is.*

## The Premise, Stated Once

Chiaroscuro's one idea — characters are shapes, not pixels — means every frame Tessera produces is text: copyable, diffable, greppable, printable, tiny. Tessera's strategy is to refuse to break that inheritance. Video made of text goes anywhere text goes, and everything in computing already speaks text. Every feature below is judged by one rule: **never add a feature that makes a frame less text.**

## What This Could Become

The charter describes a tool. Identities it might grow into, in rough order of plausibility:

- **Live performance instrument.** Mirror (door Ⅰ) is already a mirror; the quilt is a drum machine's pad grid; the timeline is a sequencer. A VJ instrument where every visual is typography needs no new science — just latency discipline and punchable cells.
- **The text-native video commons.** A clip that survives copy-paste is a new species of media object: it posts to terminals, chats, gists, READMEs, commit messages. Tessera becomes the composer for a video format that travels wherever text travels — no player required.
- **Film pre-visualization.** The engine's obsession is value structure — Caravaggio without outlines — which is exactly what directors manipulate when blocking and lighting. An ASCII stand-in reads composition and light correctly while costing nothing: animatics at typography speed.
- **The art-school microscope.** Rendering is a per-cell decision, so the pipeline is inspectable — view source is the documentation. Tessera teaches sampling, dithering, and quantization by letting students watch themselves see, and it's a brutal, honest teacher of tonality: you cannot fake value structure past a 70-step ramp.
- **Meme factory.** Memes already speak text; ASCII video memes are copyable inside every platform's comment box, which no mp4 has ever been.
- **Accessibility — the honest version.** Not "video for blind audiences," which oversells ASCII. The credible version: scrub-by-ear sonification, frame text piped to describers, and — most real — a video medium a low-vision creator can verify by reading their own work.

## Killer Features Nobody Asked For

1. **Motion-as-diff.** Frames are text, so frame 100 vs. frame 200 is a diff. Paint the edit by change-density: most-altered frames are your cuts, least-altered are your holds. Grep the edit.
2. **The re-skin slider.** Swap the glyph ramp or font mid-project and the entire film re-renders in place. A look change that costs zero re-encode — impossible in a pixel NLE, nearly free here.
3. **Hold with a pulse.** A held cell shouldn't be dead. Let held frames breathe — dither noise, luminance jitter — so a parked clip feels alive while its time stands still. The sustain pedal the timeline needs.
4. **Whitespace as a decision.** Marine quilts use deliberate space between charts; Tessera should render deliberate gaps as unclaimed territory that asks "what goes here?" Undecided space is information; NLEs hide it.
5. **The contact-sheet export.** A whole edit as one printable poster of glyphs — three minutes you can put on a wall. And the single-frame copy-as-text is the true universal export.
6. **Sonified scrubbing.** Luminance to pitch: hear a cut coming. Pairs with the diff view — motion you can hear, edits you can see.
7. **Composting margins.** The quilt's failure mode is hoarding. Cells pushed off the edge age into an archive drawer automatically — nothing destroyed (archive by rename), nothing accumulating forever either.

## What the Quilt Does That an NLE Can't

Timelines are tyrannies of sequence: everything is a track, everything moves, nothing rests. The quilt is **spatial memory**.

- **Park-and-hold is the resting state, not an effect.** In Premiere, a freeze-frame is a destructive insert you must build. In Tessera, a cell holds a frame by default; time is something you *lend* a clip, not something it owns. You can pin one instant all afternoon while working three cells away — the spreadsheet metaphor taken literally: a cell contains a value, and the value can be a moment.
- **Chart quilting, not grid alignment.** OpenCPN joins charts of different scales and vintages with overlaps and deliberate space. Tessera quilts clips of different lengths, rates, and states the same way: overlaps show alternates side by side; space shows honest indecision. The quilt is not a rigid spreadsheet grid — it's a chart table.
- **Legibility.** An NLE timeline is colored bars; a quilt is your actual material visible as texture, all at once. You can see the whole project the way you read a wall of charts: which material is dense, which is quiet, which two clips rhyme.
- **Scale honesty.** Every cell is text, so a 2-second clip and a 2-minute clip differ only in extent. Zoomed out, the quilt becomes a mosaic of the whole film where every thumbnail is an honest rendering, not a shrunk approximation.

## Three Wild Cards

1. **Git for video.** Everything is diffable text, so edits can be commits: the quilt is the working tree, a director's cut is a branch, and a merge conflict is literal — two cells claim one slot. Edit history as archaeology, reversible forever.
2. **The mirror collapse.** The real product may not be editing at all. Webcam-to-text at low latency is a mirror where your face is typography — a text VTuber's instrument with a built-in privacy story: no pixels of your face ever exist to leak. Performance, not post, may be where this lives.
3. **The QR bearer reel.** A 30-second text clip is small enough to live in a grid of QR codes. Print a video; scan it back. Distribution with no servers — hand someone the reel on paper at a show.

## What NOT to Build in v0

- **No audio.** Sync, scrub, and licensing are a second product hiding inside the first. Silent film is an aesthetic, not a gap — lean in.
- **No mp4 export** (or the barest shim). Text is the export format; add encoding only when a real use case begs.
- **No backend, accounts, or collaboration.** Local-first, single-player. The quilt works on one machine; multiplayer is a v2 question at best.
- **No plugin or effect API.** Forty-five dials is already infinity. APIs before audiences are how tools die.
- **No keyframed parameters, no masking/compositing beyond the capture box, no touch/mobile, no undo trees.** One screen, flat undo, keyboard and mouse.

And the meta-rule: the charter is already three products — capture+transport, quilt, timeline. v0 is the charter, with the **quilt as the heart**; transport and timeline exist to feed it. The failure to avoid isn't ambition — it's the middle: building Premiere with extra steps.

---

## Lane 2 — Systems & Architecture

*Grounded in the chiaroscuro code as it stands: five engines, vanilla JS, canvas, no build step, presets already serialize to `.json`. Central commitment: the text is not a filter applied at export — it is the footage. Everything below follows from that.*

### 1. Data model: what is a clip?

Three candidates:

- **A. Raw media + look params.** `{sourceBlob, chiaroscuroPreset, inPoint, outPoint}`. Frames re-render on demand via the existing pipeline (downsample → luminance → Sobel → glyph → color → atmosphere).
- **B. Baked text frames.** An array of strings.
- **C. Hybrid: bake as cache, never as truth.** A is the source of truth; B is an evictable cache keyed by `hash(sourceId + preset + gridDims)`.

**Recommend C, hard.** A's virtue is the infinite re-look: touch one dial, every clip re-renders — the look stays editable forever, which is chiaroscuro's soul. B's vice is freezing those 45 decisions at save time. The surprising math favors C: a text frame is ~8 KB (120×68 chars), a decoded video frame ~0.9 MB — **cache the text, not the pixels; the cache is ~100× smaller.** Cache-keying to the preset hash handles invalidation: new dial values, new hash, re-render.

Screen-capture clips are the exception: the screen isn't a file, so those record straight to baked text frames (§5) — affordable precisely because text is tiny.

### 2. Frame stepping / seek

v0 pipeline: `video.currentTime = frame / fps` → await `seeked` → draw. Three landmines:

1. **`seeked` can fire before paint.** Guard with `requestVideoFrameCallback` (rVFC), which fires on actual frame presentation; double-rAF as fallback.
2. **VFR sources** (phone footage) break the fps assumption. Probe real fps on import by sampling ~1s of playback with rVFC; default 30; let the user nudge it per clip. Honest ledger: frame-exact seek in-browser without WebCodecs is *managed, not solved* — accept ±1 frame slop.
3. **Codec lottery.** Probe `canPlayType` at import and say the result out loud in the UI. H.264 MP4 is near-universal; HEVC is OS-dependent.

The WebCodecs `VideoDecoder` path is the frame-exact endgame but drags in demuxing (mp4box.js) and weeks. Not v0.

Caching: per-clip LRU of rendered text frames, windowed ±30 frames around the playhead, ~1,000-frame global budget ≈ 8 MB. Hard ceiling with eviction — O(window), never O(duration).

### 3. The hold primitive

Represent the timeline as an **EDL**: each clip instance expands to flat segments `{timelineStart, timelineEnd, srcTimeAtStart, frozen}`. A hold at source time `h` until timeline time `x` expands to three segments: motion [inPoint→h], frozen [h for (x − tₕ)], motion [h→outPoint]. Frame lookup = binary search + interpolation. Deterministic, unit-testable, no special cases.

Composition falls out free:
- **Overlaps:** later-in-list paints over earlier (painter's algorithm, z = list order). No blending in v0 — overlap is collage, not dissolve.
- **Gaps:** blank text screen. Not "previous frame persists" — blank is honest.

The charter's "hold until a chosen exit frame, then slide back to the original" is exactly the 3-segment expansion.

### 4. Quilt

**CSS grid is wrong**: marine quilting *requires* overlap and grid cells can't. Use a large pannable surface with **absolutely-positioned cell divs**, free drag, z-index by last-touched, optional half-cell snap.

Per-cell state machine: `EMPTY → LOADED(paused@0) ⇄ PLAYING / PAUSED@t → PARKED@f`. Parked frames are visually flagged (a corner tab, like a chart legend) and survive save. Keep transitions in one module with named events — UI handlers never mutate cell state directly. This is the piece most likely to rot.

Persistence: **IndexedDB**, not localStorage — the 5 MB cap dies instantly on video Blobs; IDB stores Blobs natively. Schema: record per source blob, record per project (`{layout, EDL, preset}`), debounced autosave. v0: one implicit project, autosaved. Named slots later.

Realistic v0: drag, park, autosave. No minimap, no zoom, no multi-select.

### 5. Screen capture

`getDisplayMedia({video:{frameRate:30}})` → `<video>`. **Skip `ImageCapture.grabFrame()`** — Firefox doesn't ship it. The portable path is `drawImage(video, sx, sy, sw, sh, …)` with a source rect, which composes directly with the renderer's downsample step.

Selection box: draggable rect over the preview. The classic bug farm is mapping screen coords → intrinsic video coords under `object-fit: contain` letterboxing — compute letterbox offsets explicitly and test with mismatched aspects. Dim outside the selection; live-ASCII-preview just the region.

Recording: text frames render off the rAF loop into a buffer; on stop, flush to IDB as a baked-frame clip. A screen clip's "source" *is* its text.

### 6. Export

All cheap, because the text already lives on canvas:

1. **WebM (v0 primary).** `canvas.captureStream(30)` → `MediaRecorder`; play the timeline in realtime. Cost: honest — 60s of film takes 60s and may drop frames under load. Fine for scene rough-outs.
2. **Standalone-HTML film (the signature export).** Chiaroscuro already exports the renderer with baked settings; Tessera exports the *film* — one self-contained page carrying the EDL, sources, and the renderer, playing anywhere.
3. **Frame-sequence text.** The archival, diffable, greppable master. Plain text files; git becomes the video codec.

*(Note: this lane's report arrived truncated mid-§6; the tail above is reconstructed from the lane's stated outline. The next sections — ranked risks and the ruthless v0 — were named in the brief and are folded into `docs/ROADMAP.md` rather than lost.)*
