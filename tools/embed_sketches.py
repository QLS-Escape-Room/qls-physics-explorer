#!/usr/bin/env python3
"""
Bundle generated sketch SVGs (art/*.svg) into a single JS file (art/sketches.js)
that the game loads as a <script>. Embedding avoids relying on the browser
fetching separate SVG files (which can be unreliable when the game is opened
straight from disk via file://).
"""
import re
import sys
from pathlib import Path

ART_DIR = Path(__file__).resolve().parent.parent / "art"
OUT_FILE = ART_DIR / "sketches.js"

SKETCHES = {
    "exterior": "exterior.svg",  # used by the win screen background
}


def extract(svg_path):
    text = svg_path.read_text()
    vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', text)
    w, h = int(vb.group(1)), int(vb.group(2))
    g = re.search(r"(<g .*?</g>)", text, re.S)
    return w, h, g.group(1)


def main():
    entries = []
    for key, filename in SKETCHES.items():
        path = ART_DIR / filename
        if not path.exists():
            print(f"skip {key}: {path} not found", file=sys.stderr)
            continue
        w, h, markup = extract(path)
        js_markup = markup.replace("`", "\\`")
        entries.append(f'  {key}: {{ w: {w}, h: {h}, markup: `{js_markup}` }},')

    out = "const SKETCHES = {\n" + "\n".join(entries) + "\n};\n"
    OUT_FILE.write_text(out)
    print(f"wrote {OUT_FILE} ({len(entries)} sketches)")


if __name__ == "__main__":
    main()
