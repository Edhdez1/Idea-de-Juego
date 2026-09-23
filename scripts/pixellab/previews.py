#!/usr/bin/env python3
"""Genera las vistas previas del piloto de arte para el dueño.

Salida en docs/presentacion/piloto-arte/:
  - hoja_contactos_ingeniera.png : sprite aprobado vs vistas nuevas (x4, rotulado)
  - *.gif                        : animaciones de losetas, prop y personaje (x4)

Uso: python3 scripts/pixellab/previews.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src" / "pixellab"
OUT = ROOT / "docs" / "presentacion" / "piloto-arte"
DIRS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]
DIRS_ES = ["S", "SE", "E", "NE", "N", "NO", "O", "SO"]
FONDO = (46, 40, 52, 255)
FONDO_CELDA = (72, 66, 80, 255)
TEXTO = (240, 226, 190, 255)
SUB = (180, 170, 150, 255)
CELDA = 256  # 64 px x4


def font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def load(p):
    return Image.open(p).convert("RGBA")


def fit(im, box=CELDA):
    """Escala entera con vecino más cercano para que quepa en la celda."""
    k = max(1, box // max(im.width, im.height))
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def hoja_contactos():
    filas = [
        ("Aprobado (canónico)", "sprite 128 px original y reducción a 64 px usada como referencia",
         [(load(ROOT / "public/assets/sprites/ingeniera.png"), "128 px"),
          (load(SRC / "refs/ingeniera_este_64.png"), "ref 64 px")]),
        ("Candidatas Sur (/rotate)", "desde la referencia; B es la elegida para el giro",
         [(load(SRC / "ingeniera_sur_a/image.png"), "Sur A"),
          (load(SRC / "ingeniera_sur_b/image.png"), "Sur B *")]),
        ("8 direcciones — create-character-v3 (RECOMENDADO)", "a partir de Sur B; personaje animable",
         [(load(SRC / f"ingeniera_char_v3/storage_urls_{d}.png"), e) for d, e in zip(DIRS, DIRS_ES)]),
        ("8 direcciones — generate-8-rotations-v3", "giro directo de la referencia (el cuadro 0 es la ref., en SE)",
         [(load(SRC / f"ingeniera_rot8_v3/images_{i:03d}.png"), f"{i}") for i in range(8)]),
        ("8 direcciones — with-8-directions (estándar)", "Sur B + ref. congeladas; el resto pierde la mochila: DESCARTADO",
         [(load(SRC / f"ingeniera_8dir_std/images_{d}.png"), e) for d, e in zip(DIRS, DIRS_ES)]),
    ]
    pad, cab = 16, 64
    W = pad + 8 * (CELDA + pad)
    H = 90 + sum(cab + CELDA + 30 + pad for _ in filas)
    hoja = Image.new("RGBA", (W, H), FONDO)
    d = ImageDraw.Draw(hoja)
    d.text((pad, 16), "La Ingeniera — piloto G1 de PixelLab (x4, vecino más cercano)", font=font(34), fill=TEXTO)
    d.text((pad, 58), "Las vistas nuevas deben parecer el MISMO personaje que el sprite aprobado.", font=font(18), fill=SUB)
    y = 90
    for titulo, sub, celdas in filas:
        d.text((pad, y + 6), titulo, font=font(24), fill=TEXTO)
        d.text((pad, y + 36), sub, font=font(16), fill=SUB)
        y += cab
        for i, (im, et) in enumerate(celdas):
            x = pad + i * (CELDA + pad)
            d.rectangle([x, y, x + CELDA - 1, y + CELDA - 1], fill=FONDO_CELDA)
            s = fit(im)
            hoja.alpha_composite(s, (x + (CELDA - s.width) // 2, y + (CELDA - s.height) // 2))
            d.text((x + 6, y + CELDA + 4), et, font=font(18), fill=TEXTO)
        y += CELDA + 30 + pad
    dst = OUT / "hoja_contactos_ingeniera.png"
    hoja.convert("RGB").quantize(colors=255, method=Image.MEDIANCUT).save(dst, optimize=True)
    return dst


def gif(nombre, frames, ms, escala=4, fondo=(46, 40, 52, 255), mascara=None):
    out = []
    for f in frames:
        if mascara is not None:
            # animate-with-text-v3 devuelve fondo blanco opaco: recortamos con
            # el alfa de la loseta original (su forma no cambia).
            f = f.copy()
            f.putalpha(mascara)
        base = Image.new("RGBA", f.size, fondo)
        base.alpha_composite(f)
        out.append(base.resize((f.width * escala, f.height * escala), Image.NEAREST).convert("P", palette=Image.ADAPTIVE, colors=255))
    dst = OUT / f"{nombre}.gif"
    out[0].save(dst, save_all=True, append_images=out[1:], duration=ms, loop=0, optimize=True, disposal=2)
    return dst


def frames(carpeta, patron="images_*.png"):
    return [load(p) for p in sorted((SRC / carpeta).glob(patron))]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    hechos = [hoja_contactos()]
    agua_alfa = load(SRC / "loseta_agua_canal/image.png").getchannel("A")
    hechos.append(gif("loseta_agua_canal", frames("anim_agua_canal"), 160, mascara=agua_alfa))
    hechos.append(gif("loseta_respiradero_vapor", frames("anim_respiradero_v2"), 140))
    hechos.append(gif("loseta_respiradero_vapor_v1_fondo_blanco", frames("anim_respiradero"), 140))
    hechos.append(gif("prop_engranaje", frames("anim_engranaje"), 120))
    hechos.append(gif("ingeniera_reposo_sur", frames("ingeniera_anim_reposo_s"), 220))
    hechos.append(gif("ingeniera_caminar_sureste", frames("ingeniera_anim_caminar_se"), 120))
    for h in hechos:
        print(h.relative_to(ROOT), f"{h.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
