#!/usr/bin/env python3
"""Prepara referencias para PixelLab a partir de los sprites aprobados.

Reduce public/assets/sprites/<nombre>.png (128x128, mira al Este) a 64x64 con
vecino más cercano y lo guarda en assets-src/pixellab/refs/<nombre>_este_64.png.

Uso: python3 scripts/pixellab/prep_refs.py ingeniera [brayan ...]
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets-src" / "pixellab" / "refs"


def main(names):
    OUT.mkdir(parents=True, exist_ok=True)
    for n in names:
        src = ROOT / "public" / "assets" / "sprites" / f"{n}.png"
        im = Image.open(src).convert("RGBA")
        small = im.resize((64, 64), Image.NEAREST)
        dst = OUT / f"{n}_este_64.png"
        small.save(dst)
        print(dst.relative_to(ROOT))


if __name__ == "__main__":
    main(sys.argv[1:] or ["ingeniera"])
