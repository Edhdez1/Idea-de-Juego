# Investigación 03 — Estrategia de animación (2D, 3D→pixel, juice por código)

Contexto: deck builder roguelite 2D pixel art en Phaser, combate estático tipo Slay the Spire. Equipo: 1 persona + IA (PixelLab, Higgsfield con `generate_3d`).

---

## 1. ¿Cuánta animación necesita un deck builder?

**Mucho menos de lo que parece.** El género es de los más baratos en animación: el combate es estático y por turnos; la "sensación de vida" viene del movimiento de las cartas y los efectos.

- **Slay the Spire**: Spine (esqueletal), pero casi todo es un **idle de respiración** + pequeño lunge al atacar. El impacto lo comunican VFX superpuestos, no frames del enemigo. Las animaciones **no bloquean el input** — clave para el ritmo.
- **Monster Train**: idle esqueletal sutil + VFX de impacto.
- **Wildfrost** (2 personas): ilustraciones casi estáticas animadas con **tweens** (rebotes, squash & stretch). Su "buoyant card animation" es código, no sprite sheets.
- **Backpack Hero / Peglin**: 2-4 frames de idle; el golpe es tint-flash + knockback.
- **Loop Hero**: éxito comercial con sprites prácticamente estáticos.

**Set mínimo por personaje/enemigo:**

| Animación | Frames | Notas |
|---|---|---|
| Idle | 2-4 @ 4-6 fps | Respiración/bob. La única obligatoria |
| Hit | 0-2 | Sustituible por tint-flash blanco + knockback por código |
| Attack | 4-6 @ 10-15 fps | Anticipación + golpe; el impacto lo vende el VFX |
| Death | 4-6 (o 0) | Sustituible por disolución con partículas + fade |

**Presupuesto: 3 animaciones reales (idle, attack, death) y "hit" por código → ~12-16 frames por enemigo**, al alcance de PixelLab.

---

## 2. Pipeline 3D→pixel art (estilo Dead Cells): VEREDICTO NO

Dead Cells: modelo low-poly en 3DS Max → animación → herramienta casera que renderiza a baja resolución sin AA → PNG + normales. Ellos mismos admiten **flickering de píxeles entre frames que nunca resolvieron**.

¿Viable hoy con IA? Cada pieza existe (Higgsfield `generate_3d`/Meshy/Tripo para imagen→3D; Tripo/Mixamo auto-rig; addons de Blender para spritesheet). Pero **NO para este proyecto**:

1. **La matemática no cuadra**: el pipeline 3D amortiza con 15-30 animaciones fluidas por personaje (action game). Aquí: ~3 animaciones de 4-6 frames en combate estático. El coste fijo (Blender, retopología de mallas IA sucias, rigs, shader, flickering) nunca se recupera.
2. **A 64-96 px el 3D pierde su ventaja**: siluetas blandas y ruido entre frames. PixelLab genera directamente en la retícula, con clusters limpios y paleta coherente.
3. **Las mallas imagen→3D no vienen listas para animar**: retopología y weights; el auto-rig falla en criaturas steampunk con engranajes y siluetas raras — justo nuestro bestiario.
4. **Cadena frágil para 1 persona**: 5+ eslabones vs. PixelLab → Aseprite → Phaser.

**Excepción**: props/escenografía estáticos y `generate_3d` solo como *referencia de consistencia* para vistas rotadas de un diseño — no como pipeline de animación.

---

## 3. Animación esqueletal 2D

- **Spine**: el estándar (StS), runtime oficial `spine-phaser`. Editor $69-349. La opción seria si algún día pasamos a arte de alta resolución.
- **DragonBones**: gratis pero editor semi-abandonado, plugins Phaser de 2017. No para 2026.
- **PixelLab "Animate with skeleton"**: **la mejor carta.** Estima el esqueleto del personaje, se posan keyframes y genera los frames interpolados **como sprite sheet** ([docs](https://www.pixellab.ai/docs/tools/animate-with-skeleton)). Control esqueletal sin runtime, sin licencia, sin plugin.

**Punto técnico clave**: la esqueletal *en runtime* rompe la estética pixel (al rotar huesos, los píxeles salen de la retícula). Para pixel art: **esqueletal como herramienta de autoría, frames como formato de entrega**. Conclusión: **ningún runtime esqueletal en Phaser.**

---

## 4. Juice / game feel por código (el 80% de la sensación de calidad)

Phaser trae todo: tweens con easing/yoyo, cámara (shake/flash/fade/zoom), tint, ParticleEmitter. Patrones:

- **Squash & stretch**: `tweens.add({targets: sprite, scaleX: 1.15, scaleY: 0.85, duration: 80, yoyo: true, ease: 'Quad.easeOut'})`.
- **Hit-flash**: `sprite.setTintFill(0xffffff)` + `delayedCall(60, clearTint)`. Cero frames de arte.
- **Knockback**: tween de `x` 8-12 px con `Back.easeOut`, yoyo.
- **Screen shake**: `cameras.main.shake(120, 0.008)` en impactos fuertes; `flash()` en críticos. Shake corto (<150 ms) y solo en eventos grandes.
- **Hitstop**: congelar 50-80 ms en el frame de impacto de golpes importantes.
- **Partículas steampunk** (un atlas de 4-5 texturas 8×8: círculo blando, engranaje, chispa, humo): *vapor* = speedY negativa, alpha 0.6→0, scale creciente; *chispas* = ráfaga radial, lifespan 300, gravedad, tint naranja; *engranajes* = 2-3 partículas girando al morir un autómata.
- **Cartas** (el corazón del feel):
  - *Draw*: tween desde el mazo con stagger ~60 ms, rotación leve, `Back.easeOut`, estelas.
  - *Hover*: scale 1.12, y −16, subir depth, 100 ms; las vecinas se apartan.
  - *Play*: tween al objetivo, flash, partículas — **nunca bloquear el input** (lección nº1 de StS).
  - *Exhaust*: tintFill blanco → fade + scale 1.3 + partículas de ceniza hacia arriba.

---

## 5. La carta de caos que explota

Principios: **lo que pulsa más rápido que un latido comunica peligro**; la anticipación vende el poder.

**Fase 1 — Telegraph (en mano/mazo):**
- **Brillo pulsante rojo/naranja** en el borde (glow tween con yoyo). Truco clave: **acelerar el pulso según cercanía a explotar** (1 Hz → 3 Hz).
- **Mecha encendida**: chispa de partículas recorriendo el perímetro del marco — lenguaje universal, ideal steampunk (caldera sobrepresionada, manómetro en rojo).
- **Humo**: hilillos grises desde la esquina (1-2 partículas/s).
- **Micro-shake** de la carta (±1-2 px) en el último turno.

**Fase 2 — Explosión:**
1. **Anticipación** (~120 ms): la carta se encoge (scale 0.9) y se ilumina.
2. **Flash blanco**: tintFill + `camera.flash(100)`.
3. **Hitstop** 60-80 ms.
4. **Estallido**: `camera.shake(150, 0.01)` + ráfaga radial (chispas naranjas, anillo de humo, **fragmentos de engranaje** girando) + la carta se destruye (trocear en 4-6 pedazos con tweens y gravedad).
5. **Secuela** (300-500 ms): humo residual, número de daño rojo flotante, hit-flash + knockback del héroe. La secuela hace que la explosión "haya pasado de verdad".

Todo 100% Phaser nativo (un frame-burst de 5-6 frames de PixelLab como capa central lo eleva por muy poco coste).

---

## VEREDICTO FINAL

**Animación 2D directa con PixelLab (esqueleto como autoría) + capa gruesa de juice por código en Phaser. Descartar 3D→pixel y runtimes esqueletales.**

1. PixelLab genera personaje + animaciones → sprite sheet → `this.anims`. Set: idle 2-4f, attack 4-6f, death 4-6f; "hit" por código.
2. Sin Spine/DragonBones: el combate estático no lo justifica y la esqueletal en runtime rompe la retícula.
3. Sin pipeline 3D: ROI claramente negativo para 3 animaciones cortas a 64-96 px. Higgsfield queda para cartas ilustradas, fondos, marketing y referencia rotacional.
4. El 80% del feel va en código: tweens, shake/flash, hitstop, partículas steampunk, coreografía de cartas.
5. La lección transversal: **los jugadores miran las cartas, no a los personajes** — invertir los frames donde se mira y el código donde se siente.

Fuentes: [Game Developer — Dead Cells 3D pipeline](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-) · [PixelLab — Animate with skeleton](https://www.pixellab.ai/docs/tools/animate-with-skeleton) · [spine-phaser](http://en.esotericsoftware.com/spine-phaser) · [phaser3-juice-plugin](https://github.com/RetroVX/phaser3-juice-plugin) · [StraySpark — AI Auto-Rigging Showdown 2026](https://www.strayspark.studio/blog/ai-auto-rigging-showdown-2026-tripo-meshy-cascadeur-mixamo)
