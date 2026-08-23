#!/usr/bin/env python3
"""
Convert a photo into a hand-drawn-looking line-art SVG sketch.

Pipeline (all local, no network, no AI image generation):
  1. Grayscale + resize
  2. Canny edge detection (finds real edges in the photo)
  3. Marching-squares contour tracing (skimage.measure.find_contours)
  4. Polygon simplification (fewer, cleaner points per stroke)
  5. Emit each contour as an SVG <path> -> a true vector sketch,
     not a raster image embedded in a wrapper.

Usage:
  python3 photo_to_sketch.py input.jpg output.svg
  python3 photo_to_sketch.py input.jpg output.svg --sigma 2.0 --simplify 2.0 \
      --stroke "#cfd8ef" --width 1.4 --bg "#22314f" --max-width 900
"""
import argparse
import sys

import numpy as np
from PIL import Image, ImageOps
from skimage import feature, measure


def photo_to_sketch_svg(
    input_path,
    output_path,
    max_width=900,
    sigma=1.8,
    low_threshold=None,
    high_threshold=None,
    min_contour_len=12,
    simplify_tol=1.6,
    stroke_color="#cfd8ef",
    stroke_width=1.4,
    bg_color=None,
    opacity=0.85,
):
    img = Image.open(input_path)
    img = ImageOps.exif_transpose(img)  # respect phone photo orientation
    img = img.convert("L")

    w, h = img.size
    if w > max_width:
        scale = max_width / w
        img = img.resize((max_width, round(h * scale)), Image.LANCZOS)
        w, h = img.size

    arr = np.asarray(img) / 255.0
    edges = feature.canny(
        arr, sigma=sigma, low_threshold=low_threshold, high_threshold=high_threshold
    )
    contours = measure.find_contours(edges.astype(float), level=0.5)

    paths = []
    for c in contours:
        if len(c) < min_contour_len:
            continue
        simplified = measure.approximate_polygon(c, tolerance=simplify_tol)
        if len(simplified) < 2:
            continue
        # contour points are (row, col) = (y, x)
        pts = [(pt[1], pt[0]) for pt in simplified]
        d = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        paths.append(d)

    svg = [f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">']
    if bg_color:
        svg.append(f'<rect x="0" y="0" width="{w}" height="{h}" fill="{bg_color}" />')
    svg.append(
        f'<g fill="none" stroke="{stroke_color}" stroke-width="{stroke_width}" '
        f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}">'
    )
    for d in paths:
        svg.append(f'<path d="{d}" />')
    svg.append("</g></svg>")

    with open(output_path, "w") as f:
        f.write("\n".join(svg))

    return {"strokes": len(paths), "width": w, "height": h}


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--max-width", type=int, default=900)
    p.add_argument("--sigma", type=float, default=1.8, help="Canny smoothing; higher = fewer/cleaner lines")
    p.add_argument("--simplify", type=float, default=1.6, help="Polygon simplification tolerance")
    p.add_argument("--min-len", type=int, default=12, help="Drop contours shorter than this many points")
    p.add_argument("--stroke", default="#cfd8ef")
    p.add_argument("--width", type=float, default=1.4, dest="stroke_width")
    p.add_argument("--bg", default=None, help="Optional background fill color")
    p.add_argument("--opacity", type=float, default=0.85)
    args = p.parse_args()

    stats = photo_to_sketch_svg(
        args.input,
        args.output,
        max_width=args.max_width,
        sigma=args.sigma,
        simplify_tol=args.simplify,
        min_contour_len=args.min_len,
        stroke_color=args.stroke,
        stroke_width=args.stroke_width,
        bg_color=args.bg,
        opacity=args.opacity,
    )
    print(f"{args.output}: {stats['strokes']} strokes, {stats['width']}x{stats['height']}")


if __name__ == "__main__":
    main()
