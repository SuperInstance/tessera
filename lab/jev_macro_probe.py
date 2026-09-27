"""jev_macro_probe.py — 20-line-class probe of the pyramid contract d(E0(x), L0).

Tessera lab, 2026-09-27. No trained E0 exists yet, so the probe asks the
cheap precondition: does MACRO structure (mean-pooled pixel-intensity grid —
a hand-crafted L0 stand-in) preserve the distance structure the glyph-side
representations see?

  d_macro(i,j)   : L2 between 20x6 mean-pooled luminance grids (4x4 blocks)
  d_repr(i,j)    : L2 between per-frame 6-dim feature vectors (the raw senses
                   the glyph dials read — elephant's representation input)
  d_glyph(i,j)   : L2 between raw 80x24 glyph-index grids (no encoder at all)

If corr(d_repr, d_macro) is high, a hand-crafted E0 already aligns with the
room-sense representation — the contract has a measurable target. If it is
low, the representation adds something pooling loses (also a finding: mean-
pooling is the wrong L0 for room-sense).
"""
from __future__ import annotations

import numpy as np
from scipy.stats import spearmanr

from glyph_rooms import (KINDS, ROOMS, SEEDS, RAMP,  # noqa: E402
                         frame_features, make_room)

BLOCK = 4  # 80x24 -> 20x6


def macro_grid(frame: np.ndarray) -> np.ndarray:
    lum = frame.astype(float) / (len(RAMP) - 1)
    H, W = lum.shape
    return lum.reshape(H // BLOCK, BLOCK, W // BLOCK, BLOCK).mean(axis=(1, 3)).ravel()


def main():
    reprs, macros, glyphs, room_of = [], [], [], []
    for r_i, name in enumerate(ROOMS):
        frames, _ = make_room(KINDS[name], seed=SEEDS[name] * 1000)
        feat = frame_features(frames)
        F = np.stack([feat[k] for k in ("lum_mean", "density", "change",
                                        "grad", "persistence", "crest")], axis=1)
        reprs.append(F)
        macros.append(np.stack([macro_grid(f) for f in frames]))
        glyphs.append(frames.reshape(len(frames), -1).astype(float))
        room_of += [r_i] * len(frames)
    X = np.vstack(reprs)      # (512, 6)
    M = np.vstack(macros)     # (512, 120)
    G = np.vstack(glyphs)     # (512, 1920)
    room_of = np.array(room_of)
    # standardize repr columns so no feature dominates by unit
    Xs = (X - X.mean(0)) / (X.std(0) + 1e-12)
    Ms = (M - M.mean(0)) / (M.std(0) + 1e-12)
    Gs = (G - G.mean(0)) / (G.std(0) + 1e-12)

    iu = np.triu_indices(len(Xs), k=1)
    same = room_of[iu[0]] == room_of[iu[1]]
    d_rep = np.linalg.norm(Xs[iu[0]] - Xs[iu[1]], axis=1)
    d_mac = np.linalg.norm(Ms[iu[0]] - Ms[iu[1]], axis=1)
    d_gly = np.linalg.norm(Gs[iu[0]] - Gs[iu[1]], axis=1)

    def corr(a, b, mask=None):
        if mask is not None:
            a, b = a[mask], b[mask]
        return float(np.corrcoef(a, b)[0, 1]), float(spearmanr(a, b).statistic)

    print(f"frames={len(Xs)} pairs={len(d_rep)} (within-room {same.sum()}, "
          f"cross-room {(~same).sum()})\n")
    print(f"{'distance pair':<28} {'all pearson':>11} {'all spearman':>12} "
          f"{'within':>9} {'cross':>8}")
    for label, a, b in (("d_repr vs d_macro", d_rep, d_mac),
                        ("d_glyph vs d_macro", d_gly, d_mac),
                        ("d_repr vs d_glyph", d_rep, d_gly)):
        p_all, s_all = corr(a, b)
        p_w, s_w = corr(a, b, same)
        p_c, s_c = corr(a, b, ~same)
        print(f"{label:<28} {p_all:11.3f} {s_all:12.3f} {p_w:9.3f} {p_c:8.3f}")

    # macro energy check: does the pooled grid even see the tempo difference?
    print("\nmean |frame-to-frame macro delta| per room "
          "(does L0 stand-in track change rate?)")
    for r_i, name in enumerate(ROOMS):
        dM = np.linalg.norm(np.diff(macros[r_i], axis=0), axis=1).mean()
        print(f"  {name:<14} {dM:8.4f}")


if __name__ == "__main__":
    main()
