#!/usr/bin/env python3
"""
Vectorises the supplied raster logo files into clean, transparent SVGs.

The logo artwork was supplied as flat-colour JPEGs on white. This script
separates the two brand colours (green and teal) by colour coverage, which
discards white and JPEG noise, upsamples 4x so small type traces cleanly, and
traces each colour layer with potrace. It writes:

  public/brand/imc-<variant>.svg           full colour, for light surfaces
  public/brand/imc-<variant>-reversed.svg  green → light, for dark surfaces
  public/brand/favicon.svg                 the mark on a white tile

Variants: "horizontal" (lockup with names), "stacked" and "mark" (the IMC
symbol on its own, cropped from the stacked artwork).

Requires: pip install potracer numpy pillow
Usage:    python3 scripts/trace_logo.py
"""

from __future__ import annotations

import json
import os

import numpy as np
import potrace
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "brand-source")
OUT = os.path.join(ROOT, "public", "brand")

GREEN_HEX, TEAL_HEX = "#1E572C", "#158E87"  # measured from the supplied artwork
GREEN = np.array([0x1E, 0x57, 0x2C], dtype=float)
TEAL = np.array([0x15, 0x8E, 0x87], dtype=float)
WHITE = np.array([255.0, 255.0, 255.0])
LIGHT = "#F2F0EB"  # replaces green on dark surfaces
SCALE = 4

# (source file, crop box in source pixels or None for the whole artwork)
VARIANTS = {
    "horizontal": ("imc-logo-horizontal.jpeg", None),
    "stacked": ("imc-logo-stacked.jpeg", None),
    "mark": ("imc-logo-stacked.jpeg", (40, 30, 860, 565)),
}


def coverage(rgb: np.ndarray, colour: np.ndarray) -> np.ndarray:
    """How much of each pixel is `colour` laid over white (0..1); 0 for unrelated colours."""
    axis = colour - WHITE
    rel = rgb - WHITE
    t = (rel @ axis) / (axis @ axis)
    off_axis = np.linalg.norm(rel - t[..., None] * axis, axis=-1)
    t = np.where(off_axis > 60, 0.0, t)
    return np.clip(t, 0.0, 1.0)


def upsample(mask: np.ndarray) -> np.ndarray:
    """4x bicubic upsample, lightly blurred so JPEG jitter doesn't become outline noise."""
    img = Image.fromarray((mask * 255).astype(np.uint8))
    img = img.resize((img.width * SCALE, img.height * SCALE), Image.BICUBIC)
    img = img.filter(ImageFilter.GaussianBlur(radius=SCALE * 0.5))
    return np.asarray(img).astype(float) / 255.0


def trace(mask: np.ndarray) -> str:
    """Trace a coverage mask (already upsampled) to SVG path data in source pixels."""
    # potracer treats truthy pixels as white background (it inverts internally), so pass the
    # inverse of the shape mask.
    bitmap = potrace.Bitmap(~(mask > 0.5))
    paths = bitmap.trace(turdsize=12 * SCALE, alphamax=0.9, opticurve=True, opttolerance=0.5)
    s = 1.0 / SCALE
    fmt = lambda p: f"{p.x * s:.1f} {p.y * s:.1f}"
    parts = []
    for curve in paths:
        parts.append(f"M{fmt(curve.start_point)}")
        for seg in curve.segments:
            if seg.is_corner:
                parts.append(f"L{fmt(seg.c)}L{fmt(seg.end_point)}")
            else:
                parts.append(f"C{fmt(seg.c1)} {fmt(seg.c2)} {fmt(seg.end_point)}")
        parts.append("Z")
    return "".join(parts)


def bbox(*masks: np.ndarray) -> tuple[int, int, int, int]:
    union = np.zeros_like(masks[0], dtype=bool)
    for m in masks:
        union |= m > 0.5
    ys, xs = np.where(union)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def svg(view: tuple[float, float, float, float], layers: list[tuple[str, str]], title: str) -> str:
    x, y, w, h = view
    body = "".join(f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/>' for fill, d in layers)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.1f} {y:.1f} {w:.1f} {h:.1f}" '
        f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n'
    )


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    title = "IMC — Industrial Minerals Company (SFZ) L.L.C"
    manifest = {}
    traced: dict[str, tuple[str, str, tuple[float, float, float, float]]] = {}

    for variant, (file, crop) in VARIANTS.items():
        img = Image.open(os.path.join(SRC, file)).convert("RGB")
        if crop:
            img = img.crop(crop)
        rgb = np.asarray(img).astype(float)
        green = coverage(rgb, GREEN)
        teal = coverage(rgb, TEAL)
        x0, y0, x1, y1 = bbox(green, teal)
        pad = round(max(x1 - x0, y1 - y0) * 0.02)
        view = (x0 - pad, y0 - pad, (x1 - x0) + 2 * pad, (y1 - y0) + 2 * pad)
        green_d = trace(upsample(green))
        teal_d = trace(upsample(teal))
        traced[variant] = (green_d, teal_d, view)

        colour = svg(view, [(GREEN_HEX, green_d), (TEAL_HEX, teal_d)], title)
        reversed_ = svg(view, [(LIGHT, green_d), (TEAL_HEX, teal_d)], title)
        with open(os.path.join(OUT, f"imc-{variant}.svg"), "w") as fh:
            fh.write(colour)
        with open(os.path.join(OUT, f"imc-{variant}-reversed.svg"), "w") as fh:
            fh.write(reversed_)
        manifest[variant] = {"width": round(view[2]), "height": round(view[3])}
        print(f"  {variant:<11} {view[2]:.0f}×{view[3]:.0f}  {len(colour) / 1024:.0f} KB")

    # Favicon: the mark centred on a white rounded tile.
    green_d, teal_d, (x, y, w, h) = traced["mark"]
    side = max(w, h) * 1.22
    cx, cy = x + w / 2, y + h / 2
    tile = (cx - side / 2, cy - side / 2, side, side)
    favicon = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{tile[0]:.1f} {tile[1]:.1f} {side:.1f} {side:.1f}">'
        f'<rect x="{tile[0]:.1f}" y="{tile[1]:.1f}" width="{side:.1f}" height="{side:.1f}" rx="{side * 0.18:.1f}" fill="#ffffff"/>'
        f'<path fill="{GREEN_HEX}" fill-rule="evenodd" d="{green_d}"/><path fill="{TEAL_HEX}" fill-rule="evenodd" d="{teal_d}"/></svg>\n'
    )
    with open(os.path.join(OUT, "favicon.svg"), "w") as fh:
        fh.write(favicon)

    with open(os.path.join(ROOT, "src", "generated", "logos.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")
    print("  favicon.svg, src/generated/logos.json")


if __name__ == "__main__":
    main()
