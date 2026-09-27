// fixture.ts — the 20-delta scenario shared by tests and demo.
import type { Delta } from "./wal-edl.ts";

export const TWENTY: Delta[] = [
  { op: "SPLICE", clipId: "a", at: 0, srcIn: 0, srcOut: 4000, layer: 0 },
  { op: "SPLICE", clipId: "b", at: 3000, srcIn: 0, srcOut: 5000, layer: 1 },
  { op: "TRIM", clipId: "a", srcIn: 500, srcOut: 4000 },
  { op: "REORDER", clipId: "b", toAt: 3500 },
  { op: "HOLD", clipId: "a", at: 2000, durationMs: 800, pulse: false },
  { op: "SPLICE", clipId: "c", at: 8000, srcIn: 0, srcOut: 2500, layer: 0 },
  { op: "PARK", clipId: "b" },
  { op: "SPLICE", clipId: "d", at: 11000, srcIn: 1000, srcOut: 4000, layer: 2 },
  { op: "TRIM", clipId: "c", srcIn: 250, srcOut: 2250 },
  { op: "HOLD", clipId: "c", at: 8500, durationMs: 400, pulse: true },
  { op: "REORDER", clipId: "d", toLayer: 0 },
  { op: "SPLICE", clipId: "e", at: 14000, srcIn: 0, srcOut: 3000, layer: 1 },
  { op: "TRIM", clipId: "e", srcIn: 500, srcOut: 3000 },
  { op: "REORDER", clipId: "e", toAt: 14200 },
  { op: "PARK", clipId: "d" },
  { op: "SPLICE", clipId: "f", at: 17000, srcIn: 0, srcOut: 1500, layer: 0 },
  { op: "HOLD", clipId: "e", at: 15000, durationMs: 600, pulse: false },
  { op: "TRIM", clipId: "f", srcIn: 100, srcOut: 1400 },
  { op: "REORDER", clipId: "f", toAt: 17500 },
  { op: "HOLD", clipId: "f", at: 18000, durationMs: 300, pulse: true },
];
