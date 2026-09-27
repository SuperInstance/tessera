# Council — The Skeptic

*The strongest honest case against, so whatever survives it is real. This voice is first-class under the tapestry doctrine — the "No" answers map the edges.*

## 1. The market case: who wants this on a Tuesday?

**VJ instrument.** VJs choose tools on reliability, MIDI mapping, and ecosystem — Resolume, TouchDesigner. Tessera excludes plugins, effects APIs, and audio: the three things performance software lives by. Chiaroscuro is already the performance piece; the editor adds nothing to a live set. Ceiling: two sets of novelty per act.

**Pre-vis.** Previs buyers pay for fidelity to the final image — lens, blocking, camera move. ASCII discards exactly that. A phone video of the blocking costs zero artist time; Blender grease-pencil is free. "Animatics at typography speed" mistakes render cost for artist cost, and artist cost is the only cost that matters.

**Accessibility.** The honest version already concedes the dishonest one. A 120×68 grid at video rate is not large print; screen-reader users get nothing from glyph frames. Sonification and describer piping are good features for *any* player — they don't require this medium, so they don't make this market.

**Memes.** Platforms treat text as text: line-wrap, length limits, markdown mangling, code-fence requirements. A video that needs triple-backticks to look right is dead in every comment box, and algorithmic feeds reward motion plus sound — ASCII strips both.

The unpicked identities (art-school microscope, QR reels) are curriculum units and party tricks. Real, but not markets.

**The two steelmen.** First, the **live mirror**: latency webcam-to-text is a genuine instrument for text-VTubers and privacy-conscious streamers, it exists today, and it needs no editor — the only identity with a user who already returns daily. Second, **motion-as-diff analysis**: stepping through footage with change-density surfacing cuts and holds is the one feature where text-ness creates *capability* rather than aesthetic — something a pixel NLE genuinely cannot do. If Tessera has a wedge, it's this, aimed at people who already edit.

## 2. The technical case: where the 100× evaporates

The 8 KB math compares against a strawman: an NLE that stores decoded pixel frames to disk. No pixel NLE does that — they decode on demand and render previews only where effects force it. Against the real competitor, the saving is ≈ zero.

Count what a Tessera clip actually stores: `sourceBlob + preset + EDL`, plus an evictable text cache (~8 MB ceiling). The source blob is the dominant term and never goes away — ten minutes of phone footage is ~100 MB of H.264 regardless of the glyphs. The 100× is true only of the cache layer: "our render cache is smaller than a pixel render cache would have been." Unremarkable. Text economics are *fully* real only for baked screen captures (no source exists), stills, and the QR reel.

Worse, two flagship claims conflict. "Git for video" requires canonical, immutable frame text; the re-skin slider makes every clip's text mutable forever. Re-renderable looks mean there is no diff — only the current render. And the diff assumes renderer determinism browsers don't provide: the same source and preset through Chrome vs Firefox can disagree on color-matrix conversion and produce *different text*. When text differs per browser, the text is not the truth; the decoder is.

Scrubbing: re-render-on-demand is fine inside a ±30-frame window. Across a 10-minute clip, `currentTime` seeks decode from the previous keyframe — 100–300 ms per jump: tolerable for stepping, miserable for smooth scrubbing. The cache-invalidation dance isn't the morass; *decoder nondeterminism* is, because it's outside your control.

## 3. The learned pyramid: honest odds

RL on a 6 GB laptop GPU, shared thermals, by 2029. The field's known result is that learned detail synthesis produces *plausible* detail — and the roadmap itself names the failure ("plausible, not true to the macro intent"), then hand-waves the fix as a future breakthrough. Conditioning emergence on "macro contracts" is a research program that labs with clusters haven't cracked, not an engineering ticket.

Honest odds: ~10% that learned emergence is artifact-free and useful by 2029; ~40% that it's pretty garnish. Most likely truth: **deterministic refinement delivers ~90% of the usable value; learned emergence is 10% garnish carrying 100% of the debug surface.** The "boring first link" (glyph-choice policy) will probably work — because it is learned dithering. Falsifier: by mid-2028 the learned layer must beat hand-tuned ramp+Sobel on blind human preference over held-out footage. If it can't, the pyramid is a dead branch and the roadmap should say so.

## 4. ExoJ: does the interface hold the skill?

"The tools learned the craft; the models bring the intent" inverts observed reality. The MCP era's lesson: every demo works; every real session finds the model calling the wrong tool, inventing parameters, losing the plan at call forty. Editing is taste sustained across an iteration loop, and the loop lives in the model's context window, not the tool schema. Skill lives mostly in the model; a schema bounds behavior but confers no craft. "Any LLM" therefore means "bounded by the worst model you support."

The uncomfortable version: exoJ is a glue spec, glue specs are copyable, and if any model fits it, any studio can ship the same schema. The moat is then chiaroscuro's renderer (real but small) plus whatever defaults and corpus quilt-dba accumulates. Interface moats exist — Blender, Godot — but they monetize human UX, not agent interfaces. If the interface is the product and any model fits it, the defensible asset is data and taste. The plan hasn't started collecting either.

## 5. The medium: principle or cage?

"Never make a frame less text" bans more than detail:

- **Motion smoothness.** Glyphs are sharp-edged; at 24–30 fps, small cell changes read as shimmer, not motion. No honest motion blur exists, so whip pans, handheld energy, and fast action decay into noise. The medium silently selects for slow, static composition.
- **Color grading culture.** Grading is a language — teal/orange, bleach bypass, hue-as-emotion — and a 16–256 color palette cannot speak it. Every move toward truecolor presses on the meta-rule from the other side. The rule forbids the craft the project most wants to borrow.
- **Faces.** The close-up — cinema's fundamental unit — needs the frame. A readable face costs half the grid, which bans shot/reverse-shot at coverage. The medium structurally cannot do intimacy at wide. That's shot grammar, not resolution.

Note that "hold with a pulse" already violates the dogma's spirit: a breathing held frame is the text of no captured moment — it is synthesized. Which reveals the truth: text is the *render target*, not the *truth*. Saying that out loud would make the project healthier than the catechism does.

## 6. Three cheap experiments with kill criteria

*(This lane's report arrived truncated after the first experiment; the outline named three. Experiment 1 is verbatim; 2–3 are reconstructed from the lane's stated plan and flagged.)*

1. **The paste test** (~2 days). Distribute 5 real ASCII clips (10–60 s) as pure text: Discord, a gist/README, a terminal, two major comment boxes. *Kill:* fewer than 2 of 5 channels render watchable without instructions, or zero unprompted engagement in two weeks → the "frames free as speech" claim is marketing, and the commons identity dies here.
2. **The determinism audit** (~3 days). Render the same source+preset through Chromium and Firefox across 20 frames; diff the text. *Kill:* >5% of frames differ → canonical-text claims (diff editing, git-for-video) must be re-scoped to "canonical per engine build," and the theorist's §5 cash-out needs a pinning story before anything ships.
3. **The mirror retention test** (~1 week). Give the live mirror (door Ⅰ) to 5 streamers/VTubers; measure week-2 return. *Kill:* zero of 5 return in week 2 → the only identity with a daily user today is also novelty, and v0 scope should shrink to the analysis wedge (motion-as-diff) instead.

*— The Skeptic, Tessera council. A skeptic who proposes falsification experiments is a colleague.*
