#!/usr/bin/env python3
"""
Procedural material studies for the DRYCHEM website.

Official DRYCHEM photography was not available to the build, so instead of
stock or AI imagery the site uses honest *material studies*: height fields of
real construction finishes (putty, plaster, concrete, notched adhesive, primer,
powder, texture) lit by a low raking light — the same light used on
site to inspect a wall's finish.

Every texture is seamless (all noise is FFT-based and every stamp wraps), so
it can tile at native resolution. Lighting is a single directional light with
height-field shadows; dramatic falloff is added later with CSS overlays.

Usage:  python3 scripts/render_materials.py [name ...]
Output: assets-src/materials/<name>.png  (2048 × 2048, sRGB)
"""

from __future__ import annotations

import math
import os
import sys
import time

import numpy as np
from PIL import Image

N = 2048
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets-src", "materials")

F32 = np.float32


# ─── Noise & filtering (all periodic, so textures tile) ──────────────────────

def _freq_grid(n: int) -> tuple[np.ndarray, np.ndarray]:
    ky = np.fft.fftfreq(n).astype(F32)[:, None]
    kx = np.fft.rfftfreq(n).astype(F32)[None, :]
    return kx, ky


def spectral(n: int, beta: float, seed: int, lo: float = 0.0, hi: float = 0.5,
             stretch: tuple[float, float] = (1.0, 1.0)) -> np.ndarray:
    """1/f^beta noise, optionally band-limited to [lo, hi] cycles/px. Unit std."""
    rng = np.random.default_rng(seed)
    spec = np.fft.rfft2(rng.standard_normal((n, n)).astype(F32))
    kx, ky = _freq_grid(n)
    k = np.sqrt((kx * stretch[0]) ** 2 + (ky * stretch[1]) ** 2)
    k[0, 0] = 1.0
    amp = k ** (-beta / 2.0)
    if lo > 0:
        amp *= 1.0 / (1.0 + np.exp(-(k - lo) / (lo * 0.25 + 1e-6)))
    if hi < 0.5:
        amp *= 1.0 / (1.0 + np.exp((k - hi) / (hi * 0.15 + 1e-6)))
    amp[0, 0] = 0.0
    out = np.fft.irfft2(spec * amp, s=(n, n)).astype(F32)
    return out / (out.std() + 1e-8)


def blur(img: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return img
    n0, n1 = img.shape
    ky = np.fft.fftfreq(n0).astype(F32)[:, None]
    kx = np.fft.rfftfreq(n1).astype(F32)[None, :]
    g = np.exp(-2.0 * (math.pi ** 2) * sigma ** 2 * (kx ** 2 + ky ** 2))
    return np.fft.irfft2(np.fft.rfft2(img) * g, s=img.shape).astype(F32)


def smoothstep(e0: float, e1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def coords(n: int = N) -> tuple[np.ndarray, np.ndarray]:
    y, x = np.mgrid[0:n, 0:n].astype(F32)
    return x, y


def wrap_delta(a: np.ndarray, c: float, n: int = N) -> np.ndarray:
    """Shortest periodic distance component from a to c."""
    return (a - c + n / 2) % n - n / 2


def warp(field: np.ndarray, dx: np.ndarray, dy: np.ndarray) -> np.ndarray:
    """Sample `field` at (x+dx, y+dy) with bilinear interpolation and wrap."""
    n = field.shape[0]
    x, y = coords(n)
    sx = (x + dx) % n
    sy = (y + dy) % n
    x0 = np.floor(sx).astype(np.int32)
    y0 = np.floor(sy).astype(np.int32)
    fx = sx - x0
    fy = sy - y0
    x1 = (x0 + 1) % n
    y1 = (y0 + 1) % n
    a = field[y0, x0] * (1 - fx) + field[y0, x1] * fx
    b = field[y1, x0] * (1 - fx) + field[y1, x1] * fx
    return (a * (1 - fy) + b * fy).astype(F32)


def stamp(h: np.ndarray, cx: float, cy: float, radius: float, fn) -> None:
    """Add fn(dx, dy) inside a wrapped bounding box around (cx, cy)."""
    n = h.shape[0]
    r = int(math.ceil(radius)) + 2
    xs = (np.arange(int(cx) - r, int(cx) + r + 1)) % n
    ys = (np.arange(int(cy) - r, int(cy) + r + 1)) % n
    gx = (np.arange(int(cx) - r, int(cx) + r + 1) - cx).astype(F32)[None, :]
    gy = (np.arange(int(cy) - r, int(cy) + r + 1) - cy).astype(F32)[:, None]
    h[np.ix_(ys, xs)] += fn(gx, gy)


# ─── Lighting ────────────────────────────────────────────────────────────────

def light_vector(azimuth_deg: float, elevation_deg: float) -> np.ndarray:
    """Direction *towards* the light. Azimuth 0° = from the left, 90° = from the top."""
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)
    return np.array([-math.cos(az) * math.cos(el), -math.sin(az) * math.cos(el), math.sin(el)], dtype=F32)


def grad(h: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    gx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    gy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5
    return gx, gy


def shadows(h: np.ndarray, L: np.ndarray, steps: int = 48, softness: float = 1.2) -> np.ndarray:
    """Soft height-field shadows: march towards the light, track max occluder."""
    horiz = math.hypot(L[0], L[1])
    if horiz < 1e-4:
        return np.ones_like(h)
    dx, dy = L[0] / horiz, L[1] / horiz
    slope = L[2] / horiz
    occ = np.zeros_like(h)
    for s in range(1, steps + 1):
        dist = s * (1.0 + s / steps * 2.0)  # accelerate: fine near, coarse far
        sx, sy = int(round(dx * dist)), int(round(dy * dist))
        shifted = np.roll(h, shift=(-sy, -sx), axis=(0, 1))
        occ = np.maximum(occ, shifted - h - dist * slope)
    return np.clip(1.0 - occ / softness, 0.0, 1.0).astype(F32)


def shade(h: np.ndarray, albedo: np.ndarray, *, azimuth: float = 30.0, elevation: float = 24.0,
          ambient: float = 0.22, spec: float = 0.0, gloss: float = 30.0, cavity: float = 0.35,
          shadow_softness: float = 1.2, sheen: np.ndarray | None = None) -> np.ndarray:
    """Return linear RGB under one directional light plus sky ambient."""
    L = light_vector(azimuth, elevation)
    gx, gy = grad(h)
    nx, ny, nz = -gx, -gy, np.ones_like(h)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx * inv, ny * inv, nz * inv

    ndl = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0.0, None)
    sh = shadows(h, L, softness=shadow_softness)
    # Cavity term: recesses relative to their neighbourhood receive less sky light.
    local = blur(h, 5.0)
    cav = np.clip(1.0 + (h - local) * cavity, 0.35, 1.15)
    sky = ambient * (0.6 + 0.4 * nz) * cav

    lit = ndl * sh / max(L[2], 1e-3) * 0.62  # flat surface → 0.62 direct
    rgb = albedo * (sky + lit)[..., None]

    if spec > 0:
        hv = L + np.array([0, 0, 1], dtype=F32)
        hv /= np.linalg.norm(hv)
        ndh = np.clip(nx * hv[0] + ny * hv[1] + nz * hv[2], 0.0, 1.0)
        s = spec * ndh ** gloss * sh
        if sheen is not None:
            s = s * sheen
        rgb = rgb + s[..., None] * np.array([1.0, 0.98, 0.95], dtype=F32)
    return rgb.astype(F32)


def finish(rgb: np.ndarray, *, target: float, grain: float = 0.012, seed: int = 0) -> np.ndarray:
    """Auto-expose to a target median luminance, filmic tone-map, add fine grain."""
    lum = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722
    med = float(np.median(lum))

    def tonemap(x: np.ndarray) -> np.ndarray:
        a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
        return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0)

    # Find exposure so the median maps to the target (in sRGB).
    lo, hi = 0.05, 20.0
    for _ in range(40):
        mid = math.sqrt(lo * hi)
        v = float(tonemap(np.array([med * mid], dtype=F32))[0]) ** (1 / 2.2)
        if v < target:
            lo = mid
        else:
            hi = mid
    out = tonemap(rgb * math.sqrt(lo * hi)) ** (1 / 2.2)
    if grain > 0:
        rng = np.random.default_rng(seed + 991)
        g = blur(rng.standard_normal(out.shape[:2]).astype(F32), 0.6)
        out = out + (g / (g.std() + 1e-8) * grain)[..., None]
    return np.clip(out, 0.0, 1.0)


def to_image(rgb: np.ndarray) -> Image.Image:
    return Image.fromarray((rgb * 255.0 + 0.5).astype(np.uint8), "RGB")


def tint(base: tuple[float, float, float], variation: np.ndarray, amount: float,
         shift: tuple[float, float, float] = (1.0, 1.0, 1.0)) -> np.ndarray:
    """Albedo map: base colour modulated by a variation field."""
    b = np.array(base, dtype=F32)
    s = np.array(shift, dtype=F32)
    v = variation[..., None] * amount
    return np.clip(b * (1.0 + v * s), 0.0, 1.0).astype(F32)


# ─── Materials ───────────────────────────────────────────────────────────────

def trowel_strokes(n: int, count: int, seed: int, width: float, amp: float,
                   radius: tuple[float, float]) -> np.ndarray:
    """Overlapping curved blade edges, as left by a steel trowel on a skim coat.

    Each pass leaves a soft step along an arc that fades out within a narrow
    band, so passes overlap like real trowel work. Radii stay below half the
    tile so the wrapped distance field never folds (keeps the texture seamless).
    """
    rng = np.random.default_rng(seed)
    x, y = coords(n)
    h = np.zeros((n, n), F32)
    for _ in range(count):
        r = rng.uniform(*radius)
        cx, cy = rng.uniform(0, n), rng.uniform(0, n)
        dx = wrap_delta(x, cx, n)
        dy = wrap_delta(y, cy, n)
        dist = np.sqrt(dx * dx + dy * dy)
        edge = dist - r
        band = np.exp(-(edge / (width * 9.0)) ** 2)
        # Angular window, measured as distance along the arc, with soft ends.
        ang = rng.uniform(-math.pi, math.pi)
        span = rng.uniform(0.35, 0.9)
        theta = np.arctan2(dy, dx)
        dtheta = np.abs(np.angle(np.exp(1j * (theta - ang)))).astype(F32)
        along = smoothstep(span, span * 0.35, dtheta)
        step = np.tanh(edge / width) * 0.5
        ridge = np.exp(-(edge / (width * 0.8)) ** 2)
        h += (step * band * 0.9 + ridge * 0.28) * along * amp * rng.uniform(0.45, 1.0)
    return h


def mat_putty(seed: int = 11) -> np.ndarray:
    broad = spectral(N, 4.2, seed) * 2.0
    strokes = trowel_strokes(N, 56, seed + 1, width=11.0, amp=1.15, radius=(360, 900))
    micro = spectral(N, 0.9, seed + 2, lo=0.08) * 0.045
    h = broad + strokes + micro
    # Rare, shallow pinholes.
    rng = np.random.default_rng(seed + 3)
    for _ in range(60):
        r = rng.uniform(0.7, 1.6)
        stamp(h, rng.uniform(0, N), rng.uniform(0, N), r * 3,
              lambda gx, gy, r=r: -0.5 * np.exp(-(gx * gx + gy * gy) / (r * r)))
    var = blur(spectral(N, 2.5, seed + 4), 2) * 0.5 + strokes * 0.05
    albedo = tint((0.93, 0.905, 0.855), var, 0.012)
    rgb = shade(h, albedo, azimuth=18, elevation=11, ambient=0.22, spec=0.05, gloss=12, cavity=0.4,
                shadow_softness=0.8)
    return finish(rgb, target=0.84, grain=0.009, seed=seed)


def sand_grains(n: int, count: int, seed: int, rmin: float, rmax: float, amp: float) -> np.ndarray:
    rng = np.random.default_rng(seed)
    h = np.zeros((n, n), F32)
    for _ in range(count):
        r = rng.uniform(rmin, rmax)
        a = amp * rng.uniform(0.5, 1.0)
        stamp(h, rng.uniform(0, n), rng.uniform(0, n), r * 1.6,
              lambda gx, gy, r=r, a=a: a * np.clip(1.0 - (gx * gx + gy * gy) / (r * r), 0, None) ** 0.6)
    return h


def mat_plaster(seed: int = 21) -> np.ndarray:
    fine = spectral(N, 1.4, seed, lo=0.04) * 0.55
    grains = sand_grains(N, 52000, seed + 1, 1.2, 3.4, 1.4)
    x, y = coords()
    # Float swirl: circular marks from a rotating float.
    swirl = np.zeros((N, N), F32)
    rng = np.random.default_rng(seed + 2)
    for _ in range(18):
        cx, cy, r = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(140, 320)
        d = np.sqrt(wrap_delta(x, cx) ** 2 + wrap_delta(y, cy) ** 2)
        swirl += np.sin(d / rng.uniform(5, 9)) * smoothstep(r, r * 0.4, d) * 0.22
    broad = spectral(N, 3.6, seed + 3) * 1.6
    h = fine + grains + swirl + broad
    var = spectral(N, 2.2, seed + 4) * 0.6 + blur(grains, 0.8) * 0.25
    albedo = tint((0.79, 0.765, 0.725), var, 0.05, (1.0, 1.0, 1.06))
    # Darker mineral grains scattered through the sand.
    speck = (spectral(N, 0.2, seed + 5, lo=0.18) > 2.4).astype(F32)
    albedo = albedo * (1.0 - 0.22 * blur(speck, 0.7))[..., None]
    rgb = shade(h, albedo, azimuth=28, elevation=20, ambient=0.24, cavity=0.55, shadow_softness=0.8)
    return finish(rgb, target=0.68, grain=0.012, seed=seed)


def mat_concrete(seed: int = 31) -> np.ndarray:
    rng = np.random.default_rng(seed)
    h = spectral(N, 2.6, seed) * 1.1 + spectral(N, 1.2, seed + 1, lo=0.05) * 0.35
    mottling = spectral(N, 2.8, seed + 2)
    albedo = tint((0.575, 0.565, 0.548), mottling, 0.10)
    # Exposed aggregate: flattened stones flush with the surface, different tones.
    stones = np.zeros((N, N), F32)
    tone = np.zeros((N, N), F32)
    for _ in range(950):
        rx, ry = rng.uniform(5, 26), rng.uniform(4, 18)
        rot = rng.uniform(0, math.pi)
        t = rng.normal(0, 1)
        c, s = math.cos(rot), math.sin(rot)

        def ellipse(gx, gy, rx=rx, ry=ry, c=c, s=s):
            u = (gx * c + gy * s) / rx
            v = (-gx * s + gy * c) / ry
            return smoothstep(1.0, 0.82, np.sqrt(u * u + v * v))

        cx, cy = rng.uniform(0, N), rng.uniform(0, N)
        stamp(stones, cx, cy, max(rx, ry), lambda gx, gy: ellipse(gx, gy) * 0.5)
        stamp(tone, cx, cy, max(rx, ry), lambda gx, gy, t=t: ellipse(gx, gy) * t)
    stones = np.clip(stones, 0, 0.5)
    h += stones * 0.8
    albedo = albedo * (1.0 + 0.10 * np.clip(tone, -2, 2))[..., None]
    # Bugholes: air voids open at the surface.
    for _ in range(700):
        r = rng.uniform(0.8, 5.0) if rng.random() > 0.06 else rng.uniform(6, 11)
        stamp(h, rng.uniform(0, N), rng.uniform(0, N), r * 1.5,
              lambda gx, gy, r=r: -r * 0.9 * smoothstep(1.0, 0.55, np.sqrt(gx * gx + gy * gy) / r))
    rgb = shade(h, albedo, azimuth=34, elevation=26, ambient=0.26, cavity=0.7, shadow_softness=1.4)
    return finish(rgb, target=0.50, grain=0.014, seed=seed)


def mat_adhesive(seed: int = 41) -> np.ndarray:
    x, y = coords()
    period = N / 36  # px between notch ridges; divides the tile so it wraps
    # One long, gentle sweep of the trowel: ridges stay parallel and bend together.
    bend = np.sin(x / N * 2 * math.pi + 0.6) * 22.0 + blur(spectral(N, 4.4, seed), 8) * 6.0
    phase = (y + bend) / period
    frac = phase - np.floor(phase)
    # Square-notch profile: flat-topped ridge, sloped flanks, open trough.
    profile = smoothstep(0.10, 0.26, frac) * smoothstep(0.80, 0.64, frac)
    ridge_idx = np.floor(phase).astype(np.int64)
    rng = np.random.default_rng(seed + 1)
    per_ridge = rng.uniform(0.9, 1.08, size=4096).astype(F32)
    height_var = per_ridge[ridge_idx % 4096]
    # Drag striations along the ridges, and rare soft breaks where the bed thinned.
    drag = spectral(N, 1.5, seed + 2, stretch=(0.08, 1.0)) * 0.55
    breaks = smoothstep(2.6, 3.4, blur(spectral(N, 2.2, seed + 3, stretch=(0.3, 1.0)), 3))
    ridge_h = 12.0 * height_var * (1.0 - 0.55 * breaks)
    sand = spectral(N, 1.1, seed + 4, lo=0.06) * 0.38
    trough = (1.0 - profile) * spectral(N, 2.6, seed + 5, lo=0.01) * 0.6
    h = profile * ridge_h + drag * profile + sand + trough + spectral(N, 3.8, seed + 6) * 1.2
    var = spectral(N, 2.4, seed + 7) * 0.45 - (1.0 - profile) * 0.35
    albedo = tint((0.62, 0.618, 0.606), var, 0.06)
    sheen = 0.35 + 0.65 * profile
    rgb = shade(h, albedo, azimuth=80, elevation=28, ambient=0.26, spec=0.08, gloss=16, cavity=0.3,
                shadow_softness=2.4, sheen=sheen)
    return finish(rgb, target=0.56, grain=0.011, seed=seed)


def mat_primer(seed: int = 51) -> np.ndarray:
    # Roller stipple: rounded cells, slightly stretched in the rolling direction.
    cells = spectral(N, 2.0, seed, lo=0.03, hi=0.11, stretch=(1.0, 0.7))
    stipple = smoothstep(-0.2, 1.4, cells) * 1.6
    fine = spectral(N, 1.0, seed + 1, lo=0.1) * 0.06
    x, _ = coords()
    # Lap marks between roller passes.
    laps = np.sin(x / N * 2 * math.pi * 5 + blur(spectral(N, 3.0, seed + 2), 6) * 0.8) * 0.5
    h = stipple + fine + laps + spectral(N, 3.8, seed + 3) * 1.2
    var = spectral(N, 2.6, seed + 4) * 0.5
    albedo = tint((0.865, 0.852, 0.822), var, 0.015)
    rgb = shade(h, albedo, azimuth=24, elevation=18, ambient=0.24, spec=0.12, gloss=22, cavity=0.3,
                shadow_softness=0.8)
    return finish(rgb, target=0.76, grain=0.009, seed=seed)


def mat_powder(seed: int = 61) -> np.ndarray:
    x, y = coords()
    # Soft drifts of fine powder with one clean spatula pass through them.
    drifts = blur(spectral(N, 3.6, seed), 4) * 11.0
    grain = spectral(N, 0.5, seed + 1, lo=0.18) * 0.07
    clumps = sand_grains(N, 2600, seed + 2, 1.0, 2.6, 0.9)
    cx = N * 0.5 + np.sin(y / N * 2 * math.pi) * N * 0.06
    groove_d = np.abs(wrap_delta(x, 0) - (cx - N / 2))
    floor = smoothstep(120.0, 70.0, groove_d)
    groove = -floor * 12.0
    lip = np.exp(-((groove_d - 128.0) / 22.0) ** 2) * 3.2
    h = drifts * (1 - 0.92 * floor) + groove + lip + (grain + clumps) * (1 - 0.85 * floor)
    var = spectral(N, 2.0, seed + 3) * 0.25
    albedo = tint((0.94, 0.94, 0.932), var, 0.008)
    rgb = shade(h, albedo, azimuth=12, elevation=20, ambient=0.27, cavity=0.18, shadow_softness=2.0)
    return finish(rgb, target=0.83, grain=0.008, seed=seed)


def mat_texture(seed: int = 71) -> np.ndarray:
    # Sand-faced decorative texture: graded aggregate with short drag channels.
    base = spectral(N, 2.6, seed, lo=0.004)
    plateaus = smoothstep(-0.6, 0.6, base) * 2.4
    rng = np.random.default_rng(seed + 1)
    scratches = np.zeros((N, N), F32)
    for _ in range(1300):
        length = rng.uniform(10, 42)
        ang = rng.normal(0.25, 0.12)
        c, s_ = math.cos(ang), math.sin(ang)
        w = rng.uniform(0.9, 1.8)

        def groove(gx, gy, c=c, s_=s_, length=length, w=w):
            u = gx * c + gy * s_
            v = -gx * s_ + gy * c
            return -smoothstep(length, length * 0.5, np.abs(u)) * np.exp(-(v / w) ** 2) * 1.5

        stamp(scratches, rng.uniform(0, N), rng.uniform(0, N), length, groove)
    sand = sand_grains(N, 42000, seed + 2, 1.0, 3.0, 1.2)
    h = plateaus + scratches + sand + spectral(N, 1.2, seed + 3, lo=0.05) * 0.35
    var = spectral(N, 2.4, seed + 4) * 0.5 + blur(sand, 1.0) * 0.12
    albedo = tint((0.845, 0.815, 0.76), var, 0.03, (1.0, 1.02, 1.08))
    rgb = shade(h, albedo, azimuth=26, elevation=19, ambient=0.25, cavity=0.42, shadow_softness=1.0)
    return finish(rgb, target=0.71, grain=0.011, seed=seed)


def mat_samples(seed: int = 91) -> np.ndarray:
    """A sample board: six finishes as swatches on graphite."""
    order = ["putty", "plaster", "adhesive", "concrete", "primer", "texture"]
    tiles = {}
    for name in order:
        path = os.path.join(OUT_DIR, f"{name}.png")
        if not os.path.exists(path):
            render(name)
        tiles[name] = np.asarray(Image.open(path)).astype(F32) / 255.0
    board = np.empty((N, N, 3), F32)
    board[...] = np.array([0.072, 0.075, 0.077], F32)
    cols, rows = 3, 2
    margin, gap = 150, 56
    sw = (N - 2 * margin - (cols - 1) * gap) // cols
    shh = int(sw * 1.18)
    top = (N - (rows * shh + gap)) // 2
    x, y = coords()
    for i, name in enumerate(order):
        cx = margin + (i % cols) * (sw + gap)
        cy = top + (i // cols) * (shh + gap)
        # Soft contact shadow.
        dx = np.maximum(np.maximum(cx - x, x - (cx + sw)), 0)
        dy = np.maximum(np.maximum(cy + 14 - y, y - (cy + shh + 14)), 0)
        d = np.sqrt(dx * dx + dy * dy)
        board *= (1.0 - 0.55 * np.exp(-(d / 34.0) ** 2) * (d > 0))[..., None]
        ox, oy = (i * 397) % (N - sw), (i * 211) % (N - shh)
        board[cy:cy + shh, cx:cx + sw] = tiles[name][oy:oy + shh, ox:ox + sw]
        # Bevel highlight on the top edge.
        board[cy:cy + 2, cx:cx + sw] = np.clip(board[cy:cy + 2, cx:cx + sw] * 1.25, 0, 1)
    rng = np.random.default_rng(seed)
    g = blur(rng.standard_normal((N, N)).astype(F32), 0.6)
    board = np.clip(board + (g / g.std() * 0.008)[..., None], 0, 1)
    return board


MATERIALS = {
    "putty": mat_putty,
    "plaster": mat_plaster,
    "concrete": mat_concrete,
    "adhesive": mat_adhesive,
    "primer": mat_primer,
    "powder": mat_powder,
    "texture": mat_texture,
    "samples": mat_samples,
}


def render(name: str) -> None:
    t0 = time.time()
    rgb = MATERIALS[name]()
    os.makedirs(OUT_DIR, exist_ok=True)
    to_image(rgb).save(os.path.join(OUT_DIR, f"{name}.png"), optimize=False)
    print(f"  {name:<10} {time.time() - t0:5.1f}s")


def main(argv: list[str]) -> None:
    names = argv or list(MATERIALS)
    unknown = [n for n in names if n not in MATERIALS]
    if unknown:
        sys.exit(f"Unknown material(s): {', '.join(unknown)}. Choose from: {', '.join(MATERIALS)}")
    print(f"Rendering {len(names)} material studies at {N}×{N} → {os.path.relpath(OUT_DIR, ROOT)}")
    for name in names:
        render(name)


if __name__ == "__main__":
    main(sys.argv[1:])
