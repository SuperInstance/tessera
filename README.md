# tessera

**tessera** *n.* — Latin: the individual tile of a mosaic. Plural: *tesserae*. The pieces are nothing alone; laid together — edge to edge, or with deliberate space — they become a picture. Sailors know the move already: quilting charts, overlapping edges until the coast becomes continuous.

This is a video studio where the footage is text.

---

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
