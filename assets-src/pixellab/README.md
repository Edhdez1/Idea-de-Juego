# Piloto PixelLab (Fase 5, puerta G1 + «Mundo vivo»)

Piloto del pipeline de arte con la API REST v2 de PixelLab. Nada de esto está
en `public/assets/`: **solo se exporta lo que el dueño apruebe**.

Previews para el dueño: `docs/presentacion/piloto-arte/`
- `hoja_contactos_ingeniera.png`: el sprite aprobado frente a todas las vistas nuevas.
- `loseta_agua_canal.gif`, `loseta_respiradero_vapor.gif`, `prop_engranaje.gif`
- `ingeniera_reposo_sur.gif`, `ingeniera_caminar_sureste.gif`
- `loseta_respiradero_vapor_v1_fondo_blanco.gif` (intento fallido, se deja como referencia)

## Cómo se usa

```bash
export PIXELLAB_API_TOKEN=...          # nunca en el repo ni en archivos
python3 scripts/pixellab/prep_refs.py ingeniera   # 128 -> 64 px, vecino más cercano
python3 scripts/pixellab/pixellab.py balance
python3 scripts/pixellab/pixellab.py list
python3 scripts/pixellab/pixellab.py run <id> [<id> ...] [--force]
python3 scripts/pixellab/previews.py              # regenera las previews
```

- `manifest.json` guarda cada entrada `{id, endpoint, params, references}`. Las
  `references` son rutas a PNG que se inyectan como Base64Image. La clave admite
  puntos, por ejemplo `directions.south`.
- La salida queda en `assets-src/pixellab/<id>/`: los PNG, `result.json` (parámetros,
  uso, id del trabajo y del recurso) y `raw-response.json`. Este último es la
  respuesta cruda saneada, sin base64, y git lo ignora.
- La CLI reintenta los cortes del proxy, que fueron frecuentes. También guarda
  `pending.json` con el id del trabajo, así que un corte durante el sondeo se
  reanuda sin volver a pagar.
- Requiere Python 3, `requests` y `pillow`.

## Qué se generó (16 generaciones de 2000; saldo final: 1984)

Cada trabajo costó **1 generación** según el campo `usage` de la API. Hubo 2
trabajos pagados de más: se reenviaron tras cortes de conexión, antes de
añadir `pending.json`.

| id | endpoint | resultado |
|---|---|---|
| `ingeniera_sur_a` | `/rotate` (de este a sur, `side` a `low top-down`, guidance 3) | Sur fiel; el moño sale doble |
| `ingeniera_sur_b` | `/rotate` (de sureste a sur, guidance 6) | **Sur elegida**: frontal, limpia y fiel |
| `ingeniera_rot8_v3` | `/generate-8-rotations-v3` (`first_frame` = ref. 64) | 8 giros muy fieles, pero sin un Sur frontal puro (ver problemas) |
| `ingeniera_char_v3` | `/create-character-v3` (`reference_image` = Sur B) | **8 direcciones recomendadas.** Queda como personaje animable `a68c6be8-9db4-41d7-a952-7fb8658bf721` |
| `ingeniera_8dir_std` | `/create-character-with-8-directions` estándar (`directions`: S y SE congeladas) | Descartado: el esqueleto de plantilla pierde la mochila y las llaves en las vistas de espalda y cambia las proporciones |
| `ingeniera_anim_reposo_s` | `/characters/animations` v3, 4 cuadros, S | Respiración en bucle; se mantiene fiel |
| `ingeniera_anim_caminar_se` | `/characters/animations` v3, 6 cuadros, SE | Ciclo de caminar creíble; la mochila se conserva |
| `loseta_agua_canal` | `/create-isometric-tile` 64×64, `thin tile`, `isometric_tile_size` 32 | Rombo de 64 de ancho con borde de piedra y latón |
| `loseta_respiradero` | `/create-isometric-tile` (mismos parámetros) | Adoquín con rejilla redonda |
| `prop_engranaje` | `/create-image-pixflux` 64×64, `no_background` | Engranaje de latón |
| `anim_agua_canal` | `/animate-with-text-v3`, 6 cuadros más el cuadro de referencia | Ondas y brillos sutiles; el borde queda quieto |
| `anim_respiradero` | `/animate-with-text-v3` (vapor blanco) | Fallido: fondo blanco opaco y vapor blanco indistinguible |
| `anim_respiradero_v2` | `/animate-with-text-v3`, `no_background: true`, vapor gris azulado | Bocanada que sube y se disipa; el bucle cierra |
| `anim_engranaje` | `/animate-with-text-v3` | Casi no gira: el modelo no rota objetos simétricos |

Tiempos: `/rotate` es síncrono y tarda unos 20 s. Los trabajos asíncronos
tardan entre 45 y 270 s.

## Problemas encontrados

1. **El sprite aprobado no es «Este» puro: es un 3/4 hacia el sureste.**
   `generate-8-rotations-v3` lo trata como el cuadro 0 y gira desde ahí, así
   que sus 8 vistas quedan desfasadas y no incluyen un Sur frontal. Por eso el
   flujo bueno es este: **Sur con `/rotate` → aprobación del dueño → `create-character-v3`
   con esa Sur.**
2. **`create-character-with-8-directions` estándar no respeta el diseño** en las
   direcciones que genera: usa una plantilla de maniquí y se nota. Con
   referencias solo sirve para las direcciones congeladas. El modo `pro` cuesta
   20–40 generaciones y no se probó.
3. **`animate-with-text-v3` sin `no_background` devuelve fondo blanco opaco.**
   Con losetas hay que pedir `no_background: true` o recortar con el alfa de la
   loseta original. Las previews de agua hacen eso último.
4. **Las rotaciones de objetos simétricos no se animan bien.** Para el engranaje
   conviene rotarlo por código en Phaser. El plan ya lo prevé como alternativa
   («ciclo de paleta o desplazamiento por código»).
5. Hay dos formatos de salida duplicados: el base64 inline y
   `storage_urls`/`quantized_*`. La CLI se queda con el base64.
6. El proxy corta conexiones con frecuencia (`Connection reset`). La CLI ya lo
   tolera.

## Recomendación para producción

- **Personajes (G1):** usar `/rotate` para 2–3 candidatas Sur (1 generación cada
  una), esperar la aprobación del dueño y después correr `/create-character-v3`
  con esa Sur (1 generación). Queda un personaje con 8 direcciones y animable.
  Hoy la API cobra aproximadamente `ceil(64·64·8/65536) = 1` generación por
  personaje de 64 px.
- **Animaciones:** usar `/characters/animations` en modo v3, una dirección por
  trabajo, a **1 generación por dirección**. Con la tabla del plan, un héroe
  suma unas 5+5+2+2+2+1 = 17 direcciones-animación. Eso da unas **17 generaciones
  por héroe**, unas 10 por enemigo y unas 8 por NPC. Todo el slice (4 héroes,
  5 enemigos, Gran Maestre, 3 personajes nuevos y unos 8 NPC) cuesta del orden
  de **250–350 generaciones con reintentos**, dentro del plan actual de 2000/mes.
  Hay que evitar `mode: "pro"` (20–40 por dirección).
- **Losetas y props:** usar `create-isometric-tile` (1) y después
  `animate-with-text-v3` con `no_background: true` (1). Cada loseta animada
  cuesta unas **2 generaciones**. Las rotaciones puras (engranajes, aspas) van
  por código.
- **El coste real es la revisión humana, no los créditos.** Conviene generar 2–3
  semillas por asset y que el dueño elija.
- Siempre hay que reducir los sprites aprobados con vecino más cercano y
  pasarlos como referencia. Nunca se generan desde texto solo: eso rediseña al
  personaje.
