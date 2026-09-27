"""glyph_sense_real.py — SEED GLYPH-SENSE: elephant's room-sense on REAL rendered frames.

Tessera seed garden, 2026-09-27. Graduates LAB-NOTE-2026-09-27 from synthetic
glyph rooms to real video decodes:

  1. ffmpeg renders two contrasting clips (12 s @ 10 fps, 160x90):
       still-solid     color=c=gray — the dead-calm room, nothing moves
       moving-testsrc  testsrc      — the busy room, gradient sweep + counter
  2. Frames are decoded straight off the PPM image2pipe (pure-python P6
     parse — no PIL dependency), block-mean rastered to the lab's 80x24
     glyph grid with the same " .:-=+*#%@" ramp.
  3. The LAB'S UNCHANGED feature->dial mapping (glyph_rooms.frame_features +
     windowed_readings) feeds elephant's UNCHANGED vmf machinery: zvec,
     vmf_fit (B=400), edge drift gate, kl_sym.
  4. QUILT-CELL-LOG.jsonl — one line per batch in the field-edge-bridge wire
     shape {clipId, t, mu_hat, kappa, warmth, se, gate}. A batch = 10
     consecutive W=8 windows (>= vmf.NMIN, so every fit is honest); `gate` is
     the sequential before->after edge, null on the genesis batch
     (record_with semantics: never a fake number).

numpy-only on the core path (scipy only inside elephant.kl_sym).
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

LAB = Path("/home/eileen/projects/tessera/lab")
sys.path.insert(0, str(LAB))
sys.path.insert(0, "/home/eileen/projects/elephant")

from glyph_rooms import (RAMP, W, H, WINDOW, frame_features,  # noqa: E402
                         windowed_readings)
from elephant import vmf as evmf  # noqa: E402

SEED_DIR = Path.home() / "projects/tessera/seeds/glyph-sense"
RATE, DUR, SRC_W, SRC_H = 10, 12, 160, 90
N_FRAMES = RATE * DUR            # 120 real frames per clip
BATCH_N = 10                     # windows per quilt batch (>= vmf.NMIN = 10)

# walk order: dead calm -> busy (the boundary edge is the money line)
CLIPS = [
    ("still-solid", ["-f", "lavfi", "-i",
                     f"color=c=gray:s={SRC_W}x{SRC_H}:d={DUR}:r={RATE}"]),
    ("moving-testsrc", ["-f", "lavfi", "-i",
                        f"testsrc=duration={DUR}:size={SRC_W}x{SRC_H}:rate={RATE}"]),
]

# 80x24 block edges over the 160x90 source (linspace -> 80 / 24 contiguous bands)
XE = np.linspace(0, SRC_W, W + 1).astype(int)
YE = np.linspace(0, SRC_H, H + 1).astype(int)


# ------------------------------- real frames ------------------------------- #

def decode_ppm_frames(lavfi_args: list[str]) -> list[np.ndarray]:
    """ffmpeg -> stdout PPM image2pipe -> list of HxWx3 uint8 arrays.

    List-form subprocess (no shell re-parsing); frames never touch disk.
    """
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error",
           *lavfi_args, "-f", "image2pipe", "-vcodec", "ppm", "-"]
    proc = subprocess.run(cmd, capture_output=True)  # list form only
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {proc.stderr.decode()[:400]}")
    return list(parse_ppms(proc.stdout))


def parse_ppms(buf: bytes):
    """Yield (w, h, pixels) for each concatenated binary P6 PPM in buf."""
    pos, n = 0, len(buf)
    while pos < n:
        if buf[pos:pos + 2] != b"P6":
            raise ValueError(f"bad PPM magic at byte {pos}")
        pos += 2
        vals = []
        while len(vals) < 3:
            while pos < n and buf[pos:pos + 1].isspace():
                pos += 1
            if buf[pos:pos + 1] == b"#":          # header comments, for robustness
                while pos < n and buf[pos:pos + 1] != b"\n":
                    pos += 1
                continue
            s = pos
            while pos < n and not buf[pos:pos + 1].isspace():
                pos += 1
            vals.append(int(buf[s:pos]))
        pos += 1                                   # single whitespace after maxval
        w, h, maxval = vals
        nbytes = w * h * 3
        yield w, h, np.frombuffer(buf, np.uint8, nbytes, pos).reshape(h, w, 3)
        pos += nbytes


def blockmean_luma(img: np.ndarray) -> np.ndarray:
    """HxWx3 RGB -> (24, 80) luminance via integral image (exact block mean)."""
    f = img.astype(np.float64) / 255.0
    c = np.zeros((f.shape[0] + 1, f.shape[1] + 1, 3))
    c[1:, 1:] = np.cumsum(np.cumsum(f, 0), 1)
    cs = c[YE][:, XE]
    sums = cs[1:, 1:] - cs[:-1, 1:] - cs[1:, :-1] + cs[:-1, :-1]
    areas = np.outer(np.diff(YE), np.diff(XE))[..., None]
    return (sums / areas) @ np.array([0.299, 0.587, 0.114])   # in [0,1]


def to_glyph_frames(ppms) -> np.ndarray:
    """(T, 24, 80) uint8 glyph indices on the lab ramp — the lab's frame dtype."""
    out = []
    for _, _, pix in ppms:
        idx = np.round(blockmean_luma(pix) * (len(RAMP) - 1))
        out.append(idx.clip(0, len(RAMP) - 1).astype(np.uint8))
    return np.stack(out)


def render_frame_text(idx: np.ndarray) -> str:
    return "\n".join("".join(RAMP[v] for v in row) for row in idx)


# --------------------------- elephant machinery ---------------------------- #

def zmatrix(readings) -> np.ndarray:
    return np.array([evmf.zvec(r) for r in readings])


def fit_room(readings, B=400):
    """vmf_fit with per-call timing (perf section of SEED.md)."""
    t0 = time.perf_counter()
    f = evmf.vmf_fit(zmatrix(readings), B=B)
    return f, (time.perf_counter() - t0) * 1000.0


def mean_cos(Za, Zb):
    X = Za / np.linalg.norm(Za, axis=1, keepdims=True)
    Y = Zb / np.linalg.norm(Zb, axis=1, keepdims=True)
    return float((X @ Y.T).mean())


def batches(rn: list, n: int = BATCH_N):
    """Non-overlapping batches of n consecutive windows (last may be short)."""
    return [rn[i:i + n] for i in range(0, len(rn) - n + 1, n)]


def main():
    print(f"elephant DIALS={evmf.DIALS}")
    print(f"clips: {DUR}s @ {RATE}fps -> {N_FRAMES} real decoded frames each; "
          f"window W={WINDOW}; fits B=400\n")

    clip_data, batch_fits, fit_ms, decode_ms = {}, {}, [], []
    for clip_id, args in CLIPS:
        t0 = time.perf_counter()
        ppms = decode_ppm_frames(args)
        assert len(ppms) == N_FRAMES, f"{clip_id}: got {len(ppms)} frames"
        assert (ppms[0][0], ppms[0][1]) == (SRC_W, SRC_H)
        frames = to_glyph_frames(ppms)
        dms = (time.perf_counter() - t0) * 1000.0
        decode_ms.append(dms)

        feat = frame_features(frames)
        ro, _ = windowed_readings(feat, step=1)        # trajectory (overlapping)
        rn, _ = windowed_readings(feat, step=WINDOW)   # honest-CI batches
        fn, ms = fit_room(rn)
        fit_ms.append(ms)

        ci = fn["kappa_ci"]
        print(f"{clip_id:<16} change={feat['change'].mean():.4f} "
              f"persist={feat['persistence'].mean():.3f} crest={feat['crest'].mean():+.3f} | "
              f"kappa={fn['kappa']:7.2f} rho={fn['rho']:.3f} "
              f"warmth={fn['warmth_vmf']:+.3f} kCI=[{ci[0]:.0f},{ci[1]:.0f}] "
              f"mu_se={fn['mu_se']:.4f} Nw={len(rn)} saturated={fn['saturated']}")
        print(f"{'':<16} decode+raster {dms:.0f} ms total "
              f"({dms / N_FRAMES:.2f} ms/frame); vmf_fit(B=400) {ms:.1f} ms")

        (SEED_DIR / f"preview-{clip_id}.txt").write_text(
            render_frame_text(frames[len(frames) // 2]) + "\n")
        clip_data[clip_id] = {"feat": feat, "ro": ro, "rn": rn, "fn": fn,
                              "Zo": zmatrix(ro)}
        # quilt batches: fits over consecutive 10-window groups of the stream
        batch_fits[clip_id] = [fit_room(b) for b in batches(ro)]

    # ---- headline: honest-CI (non-overlapping) fits separate the rooms ----
    a, b = CLIPS[0][0], CLIPS[1][0]
    fa, fb = clip_data[a]["fn"], clip_data[b]["fn"]
    print("\n--- cross-room drift gate (non-overlap fits, db_factor=2.0) ---")
    for x, y in [(a, b), (b, a)]:
        e = evmf.edge(clip_data[x]["fn"], clip_data[y]["fn"])
        print(f"{x:>16} -> {y:<16} d_mu={e['d_mu']:.3f} d_warmth={e['d_warmth']:+.3f} "
              f"d_log_kappa={e['d_log_kappa']:+.3f} real={e['real']}")
    print(f"kl_sym(still, moving) = {evmf.kl_sym(fa, fb):.2f}")

    wa = mean_cos(clip_data[a]["Zo"], clip_data[a]["Zo"])
    wb = mean_cos(clip_data[b]["Zo"], clip_data[b]["Zo"])
    cr = mean_cos(clip_data[a]["Zo"], clip_data[b]["Zo"])
    print(f"sauna/plunge: within still={wa:.3f} within moving={wb:.3f} "
          f"cross={cr:.3f} gap={min(wa, wb) - cr:+.3f}")

    # ---- QUILT-CELL-LOG.jsonl: the field-edge-bridge wire shape ----
    log_path = SEED_DIR / "QUILT-CELL-LOG.jsonl"
    prev = None
    n_lines = n_real = n_boundary_real = 0
    with log_path.open("w") as fh:
        for clip_id, _ in CLIPS:
            for bi, (f_i, _ms) in enumerate(batch_fits[clip_id]):
                assert f_i is not None, "batch < NMIN — would be a fake number"
                t_close = round(((bi + 1) * BATCH_N + WINDOW - 1) / RATE, 2)
                if prev is None:
                    gate = None                       # genesis batch: no prior
                else:
                    gate = evmf.edge(prev, f_i)       # sequential before->after
                    if clip_id != prev_clip:
                        n_boundary_real += int(bool(gate["real"]))
                cell = {"clipId": clip_id, "t": t_close,
                        "mu_hat": [round(v, 4) for v in f_i["mu_hat"]],
                        "kappa": round(f_i["kappa"], 2),
                        "warmth": round(f_i["warmth_vmf"], 4),
                        "se": round(f_i["mu_se"], 5),
                        "gate": None if gate is None else
                                {"d_mu": round(gate["d_mu"], 4),
                                 "d_warmth": round(gate["d_warmth"], 4),
                                 "d_log_kappa": round(gate["d_log_kappa"], 4),
                                 "real": gate["real"]}}
                fh.write(json.dumps(cell) + "\n")
                n_lines += 1
                n_real += int(bool(gate and gate["real"]))
                prev, prev_clip = f_i, clip_id
    print(f"\nquilt log: {log_path}")
    print(f"  {n_lines} cells, {n_real} real=True gates "
          f"({n_boundary_real} at clip boundary)")

    # per-batch fit cost, honest measurement across the whole run
    all_ms = [ms for cid in batch_fits for _, ms in batch_fits[cid]]
    print(f"\nperf: vmf_fit(B=400) mean {np.mean(all_ms):.1f} ms/batch "
          f"(n={len(all_ms)}, max {np.max(all_ms):.1f}); "
          f"decode+raster {np.mean(decode_ms) / N_FRAMES:.2f} ms/frame")


if __name__ == "__main__":
    main()
