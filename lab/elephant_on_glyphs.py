"""elephant_on_glyphs.py — does the room-sense survive in glyph space?

Tessera lab, 2026-09-27. Feeds synthetic ASCII-frame rooms' hand-crafted
glyph dials through elephant's UNCHANGED vMF machinery (zvec standardization,
vmf_fit on S^6, kl_sym, edge drift gate) and asks:

  1. Do the four rooms (calm-slow / busy-fast / calm-fast / busy-slow)
     separate in representation space?  (d_mu, kl_sym, edge `real`)
  2. Does kappa track the room's change rate (temperature), per the
     cold-tight/warm-loose prior — or at least order monotonically?
  3. Is the sauna/plunge contrast positive (within-room closer than
     cross-room)?

Direct import — elephant is numpy+scipy only on the vmf path.
"""
from __future__ import annotations

import sys

import numpy as np

sys.path.insert(0, "/home/eileen/projects/elephant")
from elephant import vmf as evmf  # noqa: E402

from glyph_rooms import (KINDS, ROOMS, SEEDS, WINDOW,  # noqa: E402
                         frame_features, make_room, windowed_readings)


def zmatrix(readings) -> np.ndarray:
    return np.array([evmf.zvec(r) for r in readings])


def fit_room(readings, B=400):
    Z = zmatrix(readings)
    norms = np.linalg.norm(Z, axis=1)
    return evmf.vmf_fit(Z, B=B), norms


def mean_cos(Za, Zb):
    X = Za / np.linalg.norm(Za, axis=1, keepdims=True)
    Y = Zb / np.linalg.norm(Zb, axis=1, keepdims=True)
    return float((X @ Y.T).mean())


def main():
    print(f"elephant vmf module: DIALS={evmf.DIALS}")
    print(f"window W={WINDOW}; fits use B=400 bootstrap\n")

    rooms = {}
    print(f"{'room':<14} {'change':>7} {'kappa':>8} {'rho':>6} {'warmth_vmf':>10} "
          f"{'kCI':>16} {'mu_se':>7} {'Nw':>4} {'Nw_no':>5}")
    for name in ROOMS:
        frames, meta = make_room(KINDS[name], seed=SEEDS[name] * 1000)
        feat = frame_features(frames)
        ro, _ = windowed_readings(feat, step=1)          # overlapping (trajectory)
        rn, _ = windowed_readings(feat, step=WINDOW)     # non-overlapping (honest CI)
        fo, _ = fit_room(ro)
        fn, nrm = fit_room(rn)
        use = fn if fn else fo
        ci = use["kappa_ci"]
        print(f"{name:<14} {feat['change'].mean():7.3f} {use['kappa']:8.2f} "
              f"{use['rho']:6.3f} {use['warmth_vmf']:10.3f} "
              f"[{ci[0]:6.2f},{ci[1]:7.2f}] {use['mu_se']:7.4f} {len(ro):4d} {len(rn):5d}"
              + ("" if fn else "   <- N<NMIN on non-overlap; used overlapping"))
        rooms[name] = {"feat": feat, "ro": ro, "rn": rn, "fo": fo, "fn": fn,
                       "Zo": zmatrix(ro)}

    print("\n--- d_mu / edge gate (fits on NON-overlapping windows; db=2.0) ---")
    print(f"{'pair':<26} {'d_mu':>6} {'d_warmth':>9} {'d_log_k':>8} {'real':>6}")
    edges = {}
    for i, a in enumerate(ROOMS):
        for b in ROOMS[i + 1:]:
            e = evmf.edge(rooms[a]["fn"] or rooms[a]["fo"],
                          rooms[b]["fn"] or rooms[b]["fo"])
            edges[(a, b)] = e
            print(f"{a+' -> '+b:<26} {e['d_mu']:6.3f} {e['d_warmth']:+9.3f} "
                  f"{e['d_log_kappa']:+8.3f} {str(e['real']):>6}")

    print("\n--- kl_sym matrix ---")
    hdr = " " * 14 + "".join(f"{r.split('-')[0]:>8}" for r in ROOMS)
    print(hdr)
    for a in ROOMS:
        row = f"{a:<14}"
        for b in ROOMS:
            fa = rooms[a]["fn"] or rooms[a]["fo"]
            fb = rooms[b]["fn"] or rooms[b]["fo"]
            row += f"{evmf.kl_sym(fa, fb):8.3f}"
        print(row)

    print("\n--- sauna/plunge contrast (mean cosine, overlapping z-windows) ---")
    print(f"{'pair':<26} {'within_a':>9} {'within_b':>9} {'cross':>7} {'gap':>7}")
    for i, a in enumerate(ROOMS):
        for b in ROOMS[i + 1:]:
            wa = mean_cos(rooms[a]["Zo"], rooms[a]["Zo"])
            wb = mean_cos(rooms[b]["Zo"], rooms[b]["Zo"])
            cr = mean_cos(rooms[a]["Zo"], rooms[b]["Zo"])
            print(f"{a+' / '+b:<26} {wa:9.3f} {wb:9.3f} {cr:7.3f} {min(wa, wb)-cr:+7.3f}")

    # Prediction check: kappa ordering vs change rate
    ch = {n: rooms[n]["feat"]["change"].mean() for n in ROOMS}
    kp = {n: (rooms[n]["fn"] or rooms[n]["fo"])["kappa"] for n in ROOMS}
    order_k = sorted(ROOMS, key=lambda n: -kp[n])
    order_c = sorted(ROOMS, key=lambda n: ch[n])
    print("\nkappa order (hi->lo): " + " > ".join(order_k))
    print("change order (lo->hi): " + " < ".join(order_c))

    # frame previews for the lab note
    for name in ROOMS:
        frames, _ = make_room(KINDS[name], seed=SEEDS[name] * 1000)
        mid = frames[len(frames) // 2]
        with open(f"preview-{name}.txt", "w") as fh:
            for row in mid:
                fh.write("".join(__import__('glyph_rooms').RAMP[v] for v in row) + "\n")


if __name__ == "__main__":
    main()
