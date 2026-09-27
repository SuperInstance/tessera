// test.ts — crash-safety + fold tests for wal-edl seed. Run: node test.ts
import { ok, equal } from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  WalWriter, replay, recover, fold, newTimeline, apply,
  resolveOverlaps, canonHash,
} from "./wal-edl.ts";
import { TWENTY } from "./fixture.ts";

const dir = mkdtempSync(join(tmpdir(), "wal-edl-"));
const wal = join(dir, "project.wal");

// 1) append 20 deltas, replay must fold identically
const w = new WalWriter(wal);
for (const d of TWENTY) w.append(d);
const r1 = replay(wal);
equal(r1.applied, 20, "all 20 applied");
equal(r1.torn, false, "no torn tail");

// 2) crash test: truncate mid-line (torn write), replay recovers to last good
const fs = await import("node:fs");
const buf = fs.readFileSync(wal);
fs.writeFileSync(wal, buf.subarray(0, buf.length - 17)); // chop into the last line
const r2 = replay(wal);
equal(r2.torn, true, "torn tail detected");
equal(r2.applied, 19, "recovers 19 good records");
// recovered EDL == fold of surviving prefix (deltas 1..19)
const tl19 = newTimeline();
TWENTY.slice(0, 19).forEach((d, i) => apply(tl19, d, i + 1));
equal(canonHash(r2.edl), canonHash(fold(tl19)), "EDL == fold(surviving prefix)");
// recover() truncates the torn tail; writer resumes cleanly on top
const r3 = recover(wal);
equal(r3.torn, false, "tail rolled back");
const w2 = new WalWriter(wal);
w2.append(TWENTY[19]); // replay the lost edit
const r4 = replay(wal);
equal(r4.applied, 20, "re-append after recovery");
equal(canonHash(r4.edl), canonHash(r1.edl), "final EDL identical to pre-crash");

// 3) corruption detection: flip a byte in delta 5 -> chain break, 4 good
const wal2 = join(dir, "corrupt.wal");
const w3 = new WalWriter(wal2);
for (const d of TWENTY) w3.append(d);
const b2 = fs.readFileSync(wal2);
const lines = b2.toString().split("\n");
const rec5 = JSON.parse(lines[4]);
rec5.delta.at = 99999; // tamper, checksum no longer matches
lines[4] = JSON.stringify(rec5);
fs.writeFileSync(wal2, lines.join("\n"));
const r5 = replay(wal2);
equal(r5.torn, true);
equal(r5.applied, 4, "stops at first tampered record");

// 4) HOLD expands to exactly 3 segments; painter resolves overlap
const tl = newTimeline();
apply(tl, { op: "SPLICE", clipId: "x", at: 0, srcIn: 0, srcOut: 4000, layer: 0 }, 1);
apply(tl, { op: "HOLD", clipId: "x", at: 2000, durationMs: 800, pulse: true }, 2);
const edl = fold(tl);
equal(edl.segments.length, 3, "HOLD -> 3 segments");
equal(edl.segments[1].frozen, true);
equal(edl.segments[1].pulse, true);
equal(edl.totalMs, 4800, "timeline stretched by hold duration");

// overlap: clip y on higher layer covers x entirely 1000..3000
apply(tl, { op: "SPLICE", clipId: "y", at: 1000, srcIn: 0, srcOut: 2000, layer: 1 }, 3);
const vis = resolveOverlaps(fold(tl));
// y wins 1000..3000 (including x's frozen hold), x visible 0..1000 and 3000..4800
const yVis = vis.filter(v => v.clipId === "y");
equal(yVis.length, 1);
equal(yVis[0].at, 1000); equal(yVis[0].end, 3000);
const xVis = vis.filter(v => v.clipId === "x");
equal(xVis.length, 2, "x visible on both sides");
equal(xVis[0].at, 0); equal(xVis[0].end, 1000);
equal(xVis[1].at, 3000); equal(xVis[1].end, 4800);

rmSync(dir, { recursive: true, force: true });
console.log("ALL TESTS PASSED");
console.log("20-delta canon hash:", canonHash(r1.edl));
console.log("post-crash canon hash:", canonHash(r4.edl));
