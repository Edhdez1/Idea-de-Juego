# Investigación 02 — Dirección de arte: pixel art de alta legibilidad + ilustración IA

Contexto: deck builder roguelite 2D en navegador (Phaser), steampunk-medieval satírico. Requisito: pixel art "que no sean cuadritos sin definir, sino que los personajes tengan su forma", y splash art grande del personaje en la pantalla de selección. Arte generado con IA: **PixelLab** (sprites) + **Higgsfield** (ilustración), retoque en Aseprite/LibreSprite.

---

## 1. Referentes visuales

| Juego | Resolución de sprites (aprox.) | Paleta / color | Por qué es legible |
|---|---|---|---|
| **Dead Cells** | Héroe ~50 px; interno 1920×1080, sprites renderizados desde 3D | Saturados, cell-shading, rim-light cian/naranja | Silueta limpia + contraste figura/fondo extremo |
| **Blasphemous** | Interno 640×360; el Penitente ~60-70 px | Amplia pero desaturada: ocres, sepias, dorados, rojos litúrgicos | Clúster de valores: interior oscuro con detalles dorados de alto contraste |
| **Souldiers** | ~48-64 px, 1080p interno | Viva estilo SNES tardío, 20-30 colores por personaje | Outline oscuro selectivo |
| **Eastward** | 480×270; personajes ~32-48 px | Cálida amplia con iluminación por escena | Dithering mínimo, identidad concentrada en pocos píxeles |
| **Sea of Stars** | 640×360; ~32-48 px | Limitada por escena + iluminación dinámica | 3-4 valores por material; la luz hace el resto |
| **Wargroove** | Mapa 32 px; **combate con sprites ~128 px** | Planos, alta saturación, outlines completos | Dos escalas: chibi táctico + sprite "hero" — patrón aplicable al combate |
| **Octopath (HD-2D)** | 32-48 px sobre entornos 3D | Retro + post-proceso moderno | Sprites pequeños + producción alta conviven bien |
| **Loop Hero** | 16-32 px, crudo, ~4-8 colores | Muy limitada | **Contraejemplo**: el look "cuadritos sin definir" que NO queremos |
| **Backpack Hero** | ~32-48 px, pastel | Media | Siluetas simples y fondos casi vacíos |
| **Peglin** | ~32-64 px, formas redondas | Limitada | Silueta icónica más que detalle |

**Conclusión**: el look pedido vive en la franja **Blasphemous/Wargroove-battle**: sprites de 64-96 px efectivos, 16-24 colores por personaje, outline selectivo, 3-4 valores por material y silueta reconocible en negro puro.

---

## 2. Especificaciones técnicas

**Resolución interna: 640×360**, escalado entero a 720p (×2), 1080p (×3), 1440p (×4).

**Phaser (pixel-perfect):** `pixelArt: true`, `Scale.FIT` + `autoCenter` + `autoRound`; para escalado estrictamente entero: `zoom = Math.floor(min(innerW/640, innerH/360))`. No rotar sprites en ángulos arbitrarios.

**Tamaños de asset (canvas 640×360):**

| Asset | Tamaño | Justificación |
|---|---|---|
| Héroe en combate | **96×96** (figura ~70-80 px) | Personaje estático y foco visual: se permite más resolución. 64×64 es el mínimo aceptable |
| Enemigos normales | 64×64 – 96×96 | |
| Élites / jefes | 128×128 – 160×160 | PixelLab: hasta 168×168 en Pro; anima con esqueleto hasta 128×128 |
| Icono de arte de carta | **96×72 o 128×96** (4:3) | Equivalente a los ~250×190 de StS a esta escala |
| Carta completa (marco) | **100×140** interno (~300×422 a ×3, como StS en 1080p) | En hover la carta debe ocupar ~38% de la altura |
| Retrato pequeño (HUD/diálogo) | 48×48 o 64×64 | |
| Splash de selección | **1024×1536+ ilustración de alta resolución (NO pixel)** vía Higgsfield | Ver §4 |
| Nodo de mapa | 24×24 – 32×32 | |

**Capa UI aparte**: dos cámaras/escenas — mundo de combate a 640×360 con zoom entero, y texto de cartas a resolución nativa (fuente pixel a múltiplo entero). StS hace todo el layout a 1920×1080 lógico.

---

## 3. Paleta y coherencia

**Paleta maestra: Resurrect 64** (Kerrie Lake, [Lospec](https://lospec.com/palette-list/resurrect-64)) — la más usada en producción indie moderna, rampas cálidas excelentes para latón/cobre/óxido. Alternativas: **Apollo** (46, más sobria y cinematográfica) y **Endesga 64**.

**Sub-paletas por dominio** (16-24 colores):
- **Metales steampunk**: latón (crema→ocre→marrón dorado), cobre/óxido (naranja→rojo terroso→vino), acero (gris azulado).
- **Verde-gas**: verde ácido de alta saturación **reservado como único verde brillante del juego** (venenos, vapores, magia corrupta) → legibilidad instantánea.
- **Medieval**: rojos estandarte, azul heráldico desaturado, madera y piedra sepia.

**Regla de oro**: personajes con los colores más saturados; fondos con versiones desaturadas/oscurecidas de la misma paleta (patrón Blasphemous/Dead Cells).

**Cuantización post-IA (Python/Pillow):**
```python
from PIL import Image
pal_img = Image.new('P', (1,1)); pal_img.putpalette(flat_rgb_resurrect64)
img = Image.open('sprite.png').convert('RGB')
out = img.quantize(palette=pal_img, dither=Image.Dither.NONE)  # sin dithering, crítico
```
Para downscales, **K-Centroid** (K-means por celda) supera a nearest-neighbor: [extensión Aseprite](https://astropulse.gumroad.com/l/K-Centroid), [PixelRefiner](https://github.com/HappyOnigiri/PixelRefiner) (open source: quita anti-aliasing, detecta rejilla, convierte paletas). **BitForge de PixelLab acepta paleta forzada** — pasar la sub-paleta directamente ahorra post-proceso.

---

## 4. Mezcla pixel art + ilustración

Convención totalmente aceptada **si cada estilo tiene su territorio fijo**: StS (criaturas planas + arte de carta pintado + retratos), Darkest Dungeon (un solo tratamiento de línea en todo), Octopath (pixel en juego + retratos ilustrados — el precedente directo).

**Reglas de mitigación:**
1. **Frontera por función**: combate/mapa/iconos de mundo = pixel; selección de personaje, arte interior de carta, eventos narrativos = ilustración. Nunca un sprite pixel flotando sobre un splash sin marco.
2. **Marco común**: todo arte ilustrado vive dentro de marcos pixel (marco de carta, viñeta de evento, panel de selección).
3. **Misma paleta**: cuantizar/corregir color de las ilustraciones Higgsfield hacia Resurrect 64.
4. **Mismo lenguaje de forma**: generar el splash usando el sprite/concept del personaje como referencia. Prompt-base compartido: "satirical medieval-steampunk, brass and copper armor, ink outlines, muted sepia background, painterly, style of Darkest Dungeon meets Blasphemous key art".
5. **Textura unificadora**: grano/papel sutil sobre los splash para bajar el "brillo IA".
6. **Splash con degradado a transparente** por un lado (estilo StS/Hades) para integrarse con el panel UI.

**Riesgo principal**: splashes con render inconsistente entre generaciones. Mitigación: fijar un personaje "canon", iterar hasta el estilo deseado, usarlo como referencia de estilo en todas las demás + mismo prompt-template.

---

## 5. Pipeline de producción con IA

**PixelLab (verificado en [pixellab.ai](https://www.pixellab.ai/)):**

| Capacidad | Detalle |
|---|---|
| **Pixflux** (texto→pixel) | 64×64 y 128×128 (~$0.008/imagen), hasta 400×400; fondo transparente |
| **Bitforge** (estilo custom) | Referencias de estilo, inpainting, **paleta forzada**, máx. 200×200 |
| **Pixen** | Hasta 512×512 |
| **Animación por texto** | Hasta 16 frames a 256×256 — cubre idle/ataque/muerte |
| **Animación esqueletal** | Control por esqueleto, hasta 128×128 |
| **Rotaciones** | 4/8 direcciones hasta 256×256 (~$0.038); isométrico |
| **Otros** | Tilesets, elementos UI, imagen→pixel (hasta 320×320), resize, quitar fondo, API + SDK Python |

**Lo que PixelLab NO da bien**: consistencia perfecta entre generaciones del mismo personaje (usar el sprite base como referencia + inpainting, no regenerar), manos/armas coherentes frame a frame en animaciones complejas, VFX de combate (mejor a mano o shaders/partículas en Phaser).

**Flujo por personaje:**
1. **Concept en Higgsfield** (turnaround/pose) → decisión de diseño.
2. **Sprite base en PixelLab a 128×128** con Bitforge + referencia de estilo + paleta forzada.
3. **Animaciones** (idle 4-6f, ataque 6-8f, hit 2-3f, muerte 6-8f) con esqueleto/texto a 128×128.
4. **Post-proceso Python** batch: alpha con umbral 128, cuantizar sin dithering, recortar, empaquetar spritesheet.
5. **Retoque Aseprite**: la IA deja el sprite al ~90% — limpiar outline, ojos/cara, silueta y frames clave. Presupuesto: 15-45 min por personaje.
6. **Test de silueta**: sprite en negro sobre el fondo de combate; si no se reconoce, rediseñar antes de animar.

**Splash/cartas en Higgsfield**: generar a 2K, downscale con antialiasing normal (NO es pixel art), corrección de color hacia la paleta, exportar WebP/PNG.

---

## 6. UI del deck builder

**Anatomía de la carta** (ref. StS: carta lógica 300×422 a 1080p; arte ~250×190):
- **Marco pixel** que codifica **tipo** por forma (latón remachado=ataque, cobre/tubos=habilidad, hueso/piedra=maldición) y **rareza** por material (hierro/plata/oro con gema animada).
- **Coste** arriba-izquierda dentro de un engranaje/válvula (temático: "presión de vapor" en vez de maná).
- **Arte** 4:3 en la mitad superior; **título** en banda; **caja de texto** en el tercio inferior con keywords coloreadas (daño=rojo, bloqueo=azul acero, veneno=verde-gas); banner de flavor satírico.
- Estados: hover (escala ×1.3-1.5 + glow), jugable (borde brillante), sin coste (coste en rojo).

**Layout de combate (patrón StS)**: héroe a la izquierda (~25% del ancho, suelo a ~55% de altura), 1-4 enemigos a la derecha; **intents** sobre cada enemigo (icono 16-24 px + número); barras de vida + bloqueo; mano en abanico (~5 cartas); pilas de robo/descarte en esquinas; energía como **manómetro de vapor**; reliquias en fila superior (24-32 px).

**Mapa de nodos**: vertical estilo StS, iconos 24-32 px (combate=espadas, élite=calavera con engranaje, evento=?, mercader=balanza, hoguera=caldera), fondo parallax de la torre/fábrica.

**Fuentes** (gratuitas, itch.io):
- **Texto de carta: m6x11 o m5x7** ([Daniel Linssen](https://managore.itch.io/m5x7)) — minúsculas, verificar acentos españoles (á, é, ñ, ¡, ¿). **monogram** para números/stats.
- **Títulos: Press Start 2P** — solo palabras cortas, jamás texto de reglas.
- Renderizar fuentes pixel a múltiplos enteros o como BitmapText. Plan B legítimo para texto denso: fuente humanista compacta solo dentro de la caja de texto (StS hace exactamente eso).

---

## Resumen ejecutivo
- Resolución interna 640×360, escalado entero, `pixelArt: true`.
- Héroes 96×96, enemigos 64-96, jefes 128-160.
- Paleta Resurrect 64; verde-gas exclusivo de lo tóxico; cuantización Pillow sin dithering + K-Centroid.
- Cartas 100×140 lógico, arte 128×96, marco pixel que codifica tipo+rareza.
- Splash de selección: ilustración 2K Higgsfield, cuantizada hacia la paleta, dentro de marco pixel, sprite como referencia de diseño.
- Fuentes: m6x11/m5x7 (texto), monogram (números), Press Start 2P (títulos).
- Retoque manual: ~20-40% del tiempo de arte; la legibilidad de caras y siluetas se gana a mano.

Fuentes: [PixelLab](https://www.pixellab.ai/) · [PixelLab API](https://www.pixellab.ai/pixellab-api) · [Game Developer: Dead Cells art pipeline](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-) · [Interface In Game: Slay the Spire](https://interfaceingame.com/games/slay-the-spire/) · [Lospec: Resurrect 64](https://lospec.com/palette-list/resurrect-64) · [PixelRefiner](https://github.com/HappyOnigiri/PixelRefiner) · [m5x7](https://managore.itch.io/m5x7)
