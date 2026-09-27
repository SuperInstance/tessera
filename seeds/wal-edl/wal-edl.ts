// wal-edl.ts — Tessera seed WAL-EDL
//
// Hypothesis: the timeline is pure derived data over a typed append-only WAL.
// Edits are small typed deltas (SPLICE, HOLD, PARK, TRIM, REORDER);
// the EDL is fold(wal); crash-safety is replay.
//
// Pure TypeScript, zero deps (node:crypto + node:fs only). Erasable-syntax-only
// so it runs directly on Node >= 22.18 with no build step.

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, truncateSync } from "node:fs";

// ---------- canonical JSON + hashing ----------

/** Deterministic JSON: sorted keys, no whitespace. Same data -> same string. */
export function canonJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(canonJson).join(",") + "]";
  const o = v as Record<string, unknown>;
  return (
    "{" +
    Object.keys(o)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonJson(o[k]))
      .join(",") +
    "}"
  );
}

export function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Checksum of the empty chain. */
export const GENESIS = "0".repeat(32);

// ---------- typed deltas ----------

export type Delta =
  | { op: "SPLICE"; clipId: string; at: number; srcIn: number; srcOut: number; layer?: number }
  | { op: "TRIM"; clipId: string; srcIn: number; srcOut: number }
  | { op: "HOLD"; clipId: string; at: number; durationMs: number; pulse: boolean }
  | { op: "PARK"; clipId: string }
  | { op: "REORDER"; clipId: string; toAt?: number; toLayer?: number };

// ---------- timeline state (fold accumulator) ----------

export type HoldSpan = { atRel: number; durationMs: number; pulse: boolean };

export type Clip = {
  clipId: string;
  at: number; // timeline start, ms
  srcIn: number; // source in-point, ms
  srcOut: number; // source out-point, ms
  layer: number;
  active: boolean;
  seq: number; // insertion order — painter tie-break within a layer
  hold: HoldSpan | null; // one hold per clip in this seed; holds move with REORDER
};

export type Timeline = Map<string, Clip>;

export type Segment = {
  clipId: string;
  at: number;
  duration: number;
  srcIn: number;
  srcOut: number;
  layer: number;
  frozen: boolean; // true for the middle segment of a HOLD
  pulse: boolean;
  seq: number;
};

export type Edl = { segments: Segment[]; totalMs: number };

export function newTimeline(): Timeline {
  return new Map();
}

/** Apply one delta to the in-memory fold state. Pure w.r.t. the log. */
export function apply(tl: Timeline, d: Delta, seq: number): void {
  switch (d.op) {
    case "SPLICE":
      tl.set(d.clipId, {
        clipId: d.clipId,
        at: d.at,
        srcIn: d.srcIn,
        srcOut: d.srcOut,
        layer: d.layer ?? 0,
        active: true,
        seq,
        hold: null,
      });
      return;
    case "TRIM": {
      const c = tl.get(d.clipId);
      if (c) {
        c.srcIn = d.srcIn;
        c.srcOut = d.srcOut;
      }
      return;
    }
    case "HOLD": {
      const c = tl.get(d.clipId);
      // Hold position is stored clip-relative so REORDER moves holds along.
      if (c && d.durationMs > 0) {
        c.hold = { atRel: d.at - c.at, durationMs: d.durationMs, pulse: d.pulse };
      }
      return;
    }
    case "PARK": {
      const c = tl.get(d.clipId);
      if (c) c.active = false; // one-way in this seed; SPLICE again revives
      return;
    }
    case "REORDER": {
      const c = tl.get(d.clipId);
      if (c) {
        if (d.toAt !== undefined) c.at = d.toAt;
        if (d.toLayer !== undefined) c.layer = d.toLayer;
      }
      return;
    }
  }
}

// ---------- fold: state -> EDL ----------

/**
 * fold(timeline) -> EDL.
 * A clip with no hold projects to 1 segment. A clip with a HOLD projects to
 * exactly 3 segments: pre-play, frozen frame (srcIn pinned, frozen=true),
 * post-play resuming at the held source position (timeline stretches by
 * durationMs; total source consumed is unchanged).
 */
export function fold(tl: Timeline): Edl {
  const segments: Segment[] = [];
  for (const c of tl.values()) {
    if (!c.active) continue;
    if (!c.hold) {
      segments.push({
        clipId: c.clipId, at: c.at, duration: c.srcOut - c.srcIn,
        srcIn: c.srcIn, srcOut: c.srcOut, layer: c.layer,
        frozen: false, pulse: false, seq: c.seq,
      });
    } else {
      const h = c.hold;
      const holdAt = c.at + h.atRel;
      const srcAtHold = c.srcIn + h.atRel; // source position when the freeze starts
      const preDur = holdAt - c.at;
      if (preDur > 0) {
        segments.push({
          clipId: c.clipId, at: c.at, duration: preDur,
          srcIn: c.srcIn, srcOut: c.srcIn + preDur, layer: c.layer,
          frozen: false, pulse: false, seq: c.seq,
        });
      }
      segments.push({
        clipId: c.clipId, at: holdAt, duration: h.durationMs,
        srcIn: srcAtHold, srcOut: srcAtHold, layer: c.layer,
        frozen: true, pulse: h.pulse, seq: c.seq,
      });
      const postDur = c.srcOut - srcAtHold;
      if (postDur > 0) {
        segments.push({
          clipId: c.clipId, at: holdAt + h.durationMs, duration: postDur,
          srcIn: srcAtHold, srcOut: c.srcOut, layer: c.layer,
          frozen: false, pulse: false, seq: c.seq,
        });
      }
    }
  }
  segments.sort((a, b) => a.at - b.at || a.layer - b.layer || a.seq - b.seq);
  const totalMs = segments.reduce((m, s) => Math.max(m, s.at + s.duration), 0);
  return { segments, totalMs };
}

// ---------- painter's algorithm ----------

export type VisibleRange = {
  clipId: string;
  at: number;
  end: number;
  layer: number;
  frozen: boolean;
  pulse: boolean;
};

/**
 * Resolve segment overlaps the way a compositor paints: at every instant the
 * topmost segment wins — higher layer first; same layer, later-spliced (higher
 * seq) wins. Contiguous ranges of the same winner merge.
 */
export function resolveOverlaps(edl: Edl): VisibleRange[] {
  const segs = edl.segments;
  if (segs.length === 0) return [];
  const points = new Set<number>();
  for (const s of segs) {
    points.add(s.at);
    points.add(s.at + s.duration);
  }
  const xs = [...points].sort((a, b) => a - b);
  const out: VisibleRange[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    let top: Segment | null = null;
    for (const s of segs) {
      if (s.at <= a && b <= s.at + s.duration) {
        if (!top || s.layer > top.layer || (s.layer === top.layer && s.seq > top.seq)) top = s;
      }
    }
    if (!top) continue;
    const last = out[out.length - 1];
    if (
      last && last.clipId === top.clipId && last.end === a &&
      last.layer === top.layer && last.frozen === top.frozen && last.pulse === top.pulse
    ) {
      last.end = b;
    } else {
      out.push({ clipId: top.clipId, at: a, end: b, layer: top.layer, frozen: top.frozen, pulse: top.pulse });
    }
  }
  return out;
}

// ---------- WAL: JSONL, one record per line, chained checksum ----------

export type WalRecord = { seq: number; ts: number; prev: string; sum: string; delta: Delta };

/** Chained checksum: binds each record to its predecessor and its content. */
function recordSum(prev: string, seq: number, delta: Delta): string {
  return sha256(prev + ":" + seq + ":" + canonJson(delta)).slice(0, 32);
}

/**
 * Append-only writer. Opens by replaying the log (O(n) once), then every
 * append is a single O(1) fs.appendFileSync of one JSON line. If the file ends
 * in a torn tail, the constructor rolls it back to the last-good line first.
 */
export class WalWriter {
  path: string;
  seq: number;
  prev: string;

  constructor(path: string) {
    this.path = path;
    const r = replay(path);
    if (r.torn) truncateSync(path, r.goodBytes);
    this.seq = r.applied;
    this.prev = r.lastSum;
  }

  append(delta: Delta): WalRecord {
    const seq = this.seq + 1;
    const prev = this.prev;
    const sum = recordSum(prev, seq, delta);
    const rec: WalRecord = { seq, ts: Date.now(), prev, sum, delta };
    appendFileSync(this.path, JSON.stringify(rec) + "\n", "utf8");
    this.seq = seq;
    this.prev = sum;
    return rec;
  }
}

export type ReplayResult = {
  edl: Edl;
  applied: number; // number of good records folded
  lastSum: string; // checksum of last good record (GENESIS if none)
  goodBytes: number; // byte offset just past the last good line
  torn: boolean; // true if a bad/truncated line was found
  reason?: string;
};

/**
 * Replay the log: fold every record whose chained checksum verifies; stop at
 * the first bad line. Byte-exact: recovery truncates at goodBytes.
 */
export function replay(path: string): ReplayResult {
  const tl = newTimeline();
  if (!existsSync(path)) {
    return { edl: fold(tl), applied: 0, lastSum: GENESIS, goodBytes: 0, torn: false };
  }
  const buf = readFileSync(path);
  let prev = GENESIS;
  let applied = 0;
  let goodBytes = 0;
  let torn = false;
  let reason: string | undefined;
  let lineStart = 0;

  const checkLine = (bytes: Buffer): void => {
    const rec = JSON.parse(bytes.toString("utf8")) as WalRecord;
    if (typeof rec.seq !== "number" || typeof rec.sum !== "string" || typeof rec.delta !== "object") {
      throw new Error("malformed record");
    }
    if (rec.prev !== prev) throw new Error(`chain break at seq ${rec.seq}`);
    if (rec.sum !== recordSum(rec.prev, rec.seq, rec.delta)) {
      throw new Error(`checksum mismatch at seq ${rec.seq}`);
    }
    apply(tl, rec.delta, rec.seq);
    prev = rec.sum;
    applied += 1;
  };

  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0a) {
      try {
        checkLine(buf.subarray(lineStart, i));
        goodBytes = i + 1;
      } catch (e) {
        torn = true;
        reason = (e as Error).message;
        break;
      }
      lineStart = i + 1;
    }
  }
  if (!torn && lineStart < buf.length) {
    // bytes after the last newline — a torn write tail
    torn = true;
    reason = `torn tail: ${buf.length - lineStart} byte(s) after last newline`;
  }
  return { edl: fold(tl), applied, lastSum: prev, goodBytes, torn, reason };
}

export function recover(path: string): ReplayResult {
  const r = replay(path);
  if (r.torn) {
    truncateSync(path, r.goodBytes);
    return replay(path); // report the post-rollback truth
  }
  return r;
}

// ---------- canonical EDL hash ----------

/** Short deterministic fingerprint of an EDL — the "canon" hash. */
export function canonHash(edl: Edl): string {
  return sha256(canonJson(edl)).slice(0, 16);
}
