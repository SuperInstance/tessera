# tessera

**tessera** *n.* — Latin: the individual tile of a mosaic. Plural: *tesserae*. The pieces are nothing alone; laid together — edge to edge, or with deliberate space — they become a picture. Sailors know the move already: quilting charts, overlapping edges until the coast becomes continuous.

This is a video studio where the footage is text.

---

## The mental model

A mosaic-maker doesn't sculpt one continuous image — they place discrete
tiles (*tesserae*) edge to edge, and the *picture* is what emerges when
you back away. A sailor charting a coastline does the same thing with
paper: overlapping charts, each honest only about its own patch, that
together read as one continuous coast. Tessera treats video the same way:
a **quilt of clips** — spreadsheet-like cells you can drag, overlap, or
gap — where the "film" is never a single timeline but a laid-out mosaic you
can rearrange without re-shooting anything.

```
   quilt (the mosaic)                    timeline (the splice)
   ┌─────┬─────┬─────┐                   ┌───────────────────────┐
   │ clip│ clip│     │   drag a cell ──▶ │  ...clip A══overlap══clip B...  │
   │  A  │  B  │ ...N│                   └───────────────────────┘
   └─────┴─────┴─────┘
     cells you slide around,          splice in time: overlap, gap, or
     not a linear reel                hold-a-frame, frame by frame
```

Each tile (clip) is nothing alone; laid together — with deliberate overlap
or deliberate space, in space *and* in time — they become the picture. That
is the one sentence a reader should carry out of this README.

## How it plugs into the fleet

Tessera does not render frames itself — it doesn't need to, because the
renderer core already exists one hop away: **chiaroscuro** ([grown
elsewhere in this fleet](https://github.com/SuperInstance/chiaroscuro)) is
four doors of real-time webcam-to-text, five engines deep, and tessera folds
that evidence in wholesale rather than re-deriving it. Concretely: every
"clip" tessera quilts and splices is a chiaroscuro render, and the video
studio's entire job is composition (the quilt, the timeline, the splice)
layered on top of a rendering problem chiaroscuro has already solved. See
the generated block below for the machine-readable edge.

## The charter (broad brushstrokes, on purpose)

From the captain, 2026-09-27 — kept verbatim in spirit, painted broad:

1. **Stream the screen as ASCII, live.** A selection box chooses *what part* of the screen renders. Any feed, any type.
2. **Import and render like a video editor.** Play, pause, a slider for rewinding and finding the spot.
3. **A quilt of clips.** Short videos you make get saved and appear on your quilt — spreadsheet-like cells you slide around. Drag a cell out of the quilt into the timeline to splice it in.
4. **Quilt like navigation software.** Many charts joined into one continuous picture — clips can overlap or leave space, in space.
5. **Splice in time.** Drag clips so they overlap or gap, temporally. Go frame by frame. Hold a frame until a chosen exit frame, then slide back to the original.
6. **Leave a frame parked.** The quilt view holds one clip on a frame in one cell while you work with another, so you can tell which is which.

Rough out a scene: record clips from the camera, stream and capture part of the screen, then quilt and splice them into something.

## Status

**Design phase.** Ideations are being gathered (see [`docs/IDEATION.md`](docs/IDEATION.md) once they land). The renderer core exists — it is [`SuperInstance/chiaroscuro`](https://github.com/SuperInstance/chiaroscuro), four doors of real-time webcam-to-text with five engines. Tessera inherits it.

## House style

This fleet keeps an honest ledger: failures first-class, READMEs never oversell, and the gold keeps its fingerprints. See chiaroscuro's ledger for the register.

---

*The tile is the frame. The quilt is the film.*

<!-- QUILT:LINKS:START — generated from .quilt/links.yml by quilt-links.mjs. Do not edit by hand. -->
## Cross-pollination — the Reader's Fold

*Part of the **quilt** family. Under [Law 6](https://github.com/SuperInstance/jev-quilt), this repo carries no verdicts about its neighbors — only content-addressed pointers you fold under your own weights.*

**Consumes** (folded from elsewhere)
- [chiaroscuro](https://github.com/SuperInstance/chiaroscuro) — the renderer core — four real-time webcam-to-text engines (Mirror/Sculptor/Studio/Director) that tessera's video-quilt inherits for turning a live frame into text

**Related** (1-hop siblings — Law 7)
- [pong-quilt](https://github.com/SuperInstance/pong-quilt) — sibling "watch it think, honestly" teaching artifact

<sub>Regenerate: `node quilt-links.mjs` · Fleet map: [FLEET.md](https://github.com/SuperInstance/fleet-seeds/blob/main/FLEET.md)</sub>
<!-- QUILT:LINKS:END -->
