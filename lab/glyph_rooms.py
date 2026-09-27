"""glyph_rooms.py — synthetic ASCII frame sequences with known "room temperature".

Tessera lab, 2026-09-27. Headless stand-in for chiaroscuro's browser engines
(five HTML doors — awkward headless; the task pre-authorizes synthesis).

A frame is an 80x24 grid of glyph indices into RAMP (luminance = index/9).
Four rooms on a 2x2 (texture x change-rate) design, so the lab can ask
whether elephant's field machinery tracks CHANGE RATE (the temperature axis)
and not just spatial texture:

  A  calm-tex,  slow-change   (the still, held room)
  B  busy-tex,  fast-change   (the crowded, jittering room)
  C  calm-tex,  fast-change   (control: A's texture at B's tempo)
  D  busy-tex,  slow-change   (control: B's texture at A's tempo)

numpy-only.
"""
from __future__ import annotations

import numpy as np

RAMP = " .:-=+*#%@"
W, H = 80, 24          # terminal-ish frame
N_FRAMES = 128         # 127 trailing windows (step 1); 16 non-overlapping at W=8
WINDOW = 8             # matches elephant.vmf's default W

# --- field generators (smooth spatial noise = sum of random plane waves) ----

def _plane_waves(rng, n_waves, fmin, fmax):
    """Random plane-wave components: returns fn(x, y, t) -> field in [0,1]."""
    amps = rng.uniform(0.5, 1.0, n_waves)
    amps /= amps.sum()
    kx = rng.uniform(-fmax, fmax, n_waves)
    ky = rng.uniform(-fmax, fmax, n_waves)
    om = rng.uniform(-1.0, 1.0, n_waves) * fmax   # temporal frequency scales with spatial
    ph = rng.uniform(0, 2 * np.pi, n_waves)
    xs = np.arange(W)[None, :]
    ys = np.arange(H)[:, None]

    def field(t):
        f = np.zeros((H, W))
        for a, ax, ay, o, p in zip(amps, kx, ky, om, ph):
            f += a * np.sin(ax * xs + ay * ys + o * t + p)
        return f

    return field, om


def make_room(kind: str, seed: int):
    """Return (frames, meta): frames = uint8 (T, H, W) glyph indices.

    kind = '<calm|busy>-<slow|fast>': texture sets spatial frequency +
    density bias; tempo sets temporal step, flicker, and phase jitter.
    """
    rng = np.random.default_rng(seed)
    tex, _, tempo = kind.partition("-")
    if tex == "calm":
        gen, om = _plane_waves(rng, 3, 0.0, 0.45)      # low spatial freq
        bias = 0.50
    else:                                               # busy
        gen, om = _plane_waves(rng, 6, 0.0, 1.8)       # high spatial freq
        bias = 0.62
    if tempo == "slow":
        dt, flicker, jitter_amp = 0.35, 0.02, 0.0      # the still, held room
    else:                                               # fast
        dt, flicker, jitter_amp = (2.20 if tex == "busy" else 1.60), 0.30, 0.8

    frames = []
    for i in range(N_FRAMES):
        t = dt * i
        f = gen(t + rng.uniform(0, jitter_amp) if jitter_amp else t)
        f = f + bias
        if flicker > 0.05:                              # multiplicative shimmer
            f = f * (1.0 + rng.normal(0, flicker, (H, W)))
        lum = np.clip(f, 0.0, 1.0)
        frames.append(np.round(lum * (len(RAMP) - 1)).astype(np.uint8))
    return np.stack(frames), {"dt": dt, "flicker": flicker, "bias": bias}


# --- per-frame features (the raw "senses" the glyph dials read) -------------

def frame_features(frames: np.ndarray) -> dict:
    """Per-frame scalar features, each shape (T,). Change terms use frame t-1."""
    lum = frames.astype(float) / (len(RAMP) - 1)        # (T,H,W) in [0,1]
    d = np.abs(np.diff(lum, axis=0))                    # (T-1,H,W) temporal change
    pad = np.zeros((1, H, W))
    d = np.concatenate([pad, d], axis=0)                # frame 0 has no prior

    gx = np.abs(np.diff(lum, axis=2))
    gy = np.abs(np.diff(lum, axis=1))
    grad = gx.mean(axis=(1, 2)) + gy.mean(axis=(1, 2))  # spatial busyness

    return {
        "lum_mean": lum.mean(axis=(1, 2)),
        "density":   (frames > 0).mean(axis=(1, 2)),
        "change":    d.mean(axis=(1, 2)),
        "grad":      grad,
        "persistence": (d < 0.06).mean(axis=(1, 2)),    # fraction of held cells
        "crest":     _crest_coherence(d),               # coherent vs noisy motion
    }


def _crest_coherence(d: np.ndarray) -> np.ndarray:
    """Correlation between frame-to-frame change and its 3x3 box smooth —
    coherent travelling change (a crest passes) vs incoherent flicker."""
    k = np.ones((3, 3)) / 9.0
    # cheap box blur per frame via stride tricks-free separable pass
    sm = (d[:, :-1, :-1] + d[:, :-1, 1:] + d[:, 1:, :-1] + d[:, 1:, 1:]) / 4.0
    c = d[:, 1:, 1:]
    cm = c - c.mean(axis=(1, 2), keepdims=True)
    smm = sm - sm.mean(axis=(1, 2), keepdims=True)
    num = (cm * smm).sum(axis=(1, 2))
    den = np.sqrt((cm ** 2).sum(axis=(1, 2)) * (smm ** 2).sum(axis=(1, 2))) + 1e-12
    return num / den


# --- the 7 named glyph dials, native ranges mirroring elephant.vmf LO/HI ----

def glyph_dial_readings(feat: dict, t0: int, t1: int) -> dict:
    """Aggregate frame features over [t0, t1) into the 7 vmf.DIALS readings.

    Hand-crafted on purpose (fleet pattern: hand-crafted first, learned
    second). Native ranges: mood/joke_landing in [-1,1], rest in [0,1].
    """
    sl = slice(t0, t1)
    persist = feat["persistence"][sl].mean()
    change = feat["change"][sl].mean()
    ch_std = feat["change"][sl].std() + 1e-9
    grad = feat["grad"][sl].mean()
    crest = feat["crest"][sl].mean()
    dens = feat["density"][sl].mean()
    ch_max = feat["change"][sl].max()
    return {
        "mood":         float(np.clip(2.0 * persist - 1.0, -1.0, 1.0)),
        "volume":       float(np.clip(change * 8.0, 0.0, 1.0)),
        "earnestness":  float(np.clip(1.0 - 3.0 * grad, 0.0, 1.0)),
        "cynicism":     float(np.clip(ch_std * 12.0, 0.0, 1.0)),
        "joke_landing": float(np.clip(2.0 * crest, -1.0, 1.0)),
        "panic":        float(np.clip(ch_max * 6.0 - 0.3, 0.0, 1.0)),
        "presence":     float(np.clip(1.4 * dens - 0.2, 0.0, 1.0)),
    }


def windowed_readings(feat: dict, step: int = 1, cap: int = 256):
    """Trailing-window readings, elephant.vmf.windowed-style. Returns
    (list_of_dicts, starts): windows [max(0,i-W+1), i+1) for i in range(0,T,step)."""
    out, starts = [], []
    T = feat["change"].shape[0]
    for i in range(0, T, step):
        r = glyph_dial_readings(feat, max(0, i - WINDOW + 1), i + 1)
        out.append(r)
        starts.append(i)
        if len(out) >= cap:
            break
    return out, starts


ROOMS = ["A-calm-slow", "B-busy-fast", "C-calm-fast", "D-busy-slow"]
KINDS = {"A-calm-slow": "calm-slow", "B-busy-fast": "busy-fast",
         "C-calm-fast": "calm-fast", "D-busy-slow": "busy-slow"}

SEEDS = {name: i + 11 for i, name in enumerate(ROOMS)}

if __name__ == "__main__":
    for name in ROOMS:
        frames, meta = make_room(KINDS[name], seed=SEEDS[name] * 1000)
        feat = frame_features(frames)
        print(f"{name}: dt={meta['dt']:.2f} flicker={meta['flicker']:.2f} "
              f"change={feat['change'].mean():.4f} persist={feat['persistence'].mean():.3f} "
              f"crest={feat['crest'].mean():+.3f}")
