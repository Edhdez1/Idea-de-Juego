# Reglas tácticas (fuente de verdad del motor)

Este documento fija las reglas numéricas del combate táctico de «El Coso del Rey». Los tests de `tests/core/tactics/` comprueban exactamente lo que dice aquí. Si una regla cambia, cambian el documento, el código y el test a la vez.

El motor vive en `src/core/tactics/` y no depende de Phaser. Las constantes están en `src/core/shared/constants.ts`.

## 1. Tablero

- Las casillas se guardan fila a fila: `índice = y · ancho + x`.
- Cada `BattleDef` trae:
  - `heights`: un dígito de 0 a 6 por casilla.
  - `terrain`: un carácter por casilla, que se traduce con `legend`.
  - `interactables`: casillas con un id, como `valvula`, `archivador` o `puerta`.
- Direcciones: `+x` es SE, `−x` es NW, `+y` es SW y `−y` es NE.
- La dirección entre dos casillas es la del eje dominante. Si hay empate, gana el eje x.

### Terrenos (datos en `src/data/tactico/terrains.ts`)

| id | Coste | Efecto |
|---|---|---|
| `losa`, `tarima`, `puerta` | 1 | — |
| `chatarra` | 2 | — |
| `muro` | ∞ | Impasable. Un empuje choca contra él |
| `canal` | ∞ | Quien es empujado dentro sale de la batalla («baja administrativa») |
| `paja` (era medieval) | 1 | Anula el daño por caída al aterrizar encima |
| `respiradero` (era steampunk) | 1 | Al empezar turno encima: 2 de daño y +1 de Presión |
| `antigravedad` (era futurista) | 1 | +2 de salto a quien empieza a moverse desde ahí |
| `neon` (era cyberpunk) | 1 | Al empezar turno encima: Vulnerable 2 |

## 2. Reloj de Vapor (turnos por tiempo de carga)

- En la barra de turnos hay tres tipos de entrada: las unidades, los prototipos y el reloj del Coso (`coso`, velocidad `COSO_CLOCK_SPEED = 10`). Todas empiezan con CT 0.
- Para avanzar, se busca el menor número de ticks `k` con el que alguien llegue a `CT_READY = 100`. En ese salto, cada entrada suma `k · velocidad`.
- **Desempates** entre las entradas listas, en este orden:
  1. Más CT.
  2. Más velocidad.
  3. Tipo: prototipo, luego reloj y luego unidad («las mechas van primero»).
  4. Unidad del jugador antes que unidad de la IA.
  5. Id estable, en orden natural: `x#2` va antes que `x#10`.
- **CT al acabar el turno de una unidad:** `(se movió ? 0 : 20) + (actuó ? 0 : 20)`, con `CT_WAIT_BONUS = 20`. Esperar sin hacer nada deja la unidad en 40.
- **Prototipos y reloj** vuelven a CT 0 después de activarse.
- **Retrasar** (`delay`) resta CT a la unidad objetivo, sin bajar de 0.
- **Previsión (`predictOrder`):** simula las próximas activaciones, sin contar el turno en curso. Da por hecho dos cosas:
  - El turno en curso termina ya, con sus marcas de movido y actuado.
  - Todos los turnos futuros mueven y actúan (CT 0).

  Las mechas salen de la previsión después de su última activación. Si todas las unidades mueven y actúan, la previsión coincide exactamente con lo que pasa.
- **Pitido del Coso:** `beeps` sube en 1 y se emite `CosoBeeped`. Después se resuelven las Goteras y los disparadores de pitido. De momento no hay decaimiento de Presión.

## 3. Turno de una unidad

**Al empezar**, en este orden:

1. El blindaje caduca (vuelve a 0).
2. El brío sube en 1, hasta `BRIO_MAX = 5`. Todas las unidades empiezan la batalla con brío 0.
3. Se aplican los estados: el veneno quita tantos puntos de vida como stacks tenga, ignora el blindaje y luego pierde 1 stack.
4. Se aplica el terreno: primero el daño, luego el estado y por último la Presión.

Si la unidad cae en este paso, pierde el turno.

**Durante el turno:**

- Se puede **mover** una vez y **actuar** una vez (`ACT` o `INTERACT`), en cualquier orden.
- `UNDO_MOVE` deshace el movimiento, pero solo si todavía no has actuado.
- `WAIT(facing)` cierra el turno y fija la orientación de la unidad.

**Al terminar:** Débil y Vulnerable pierden 1 stack cada uno. La Fuerza no caduca.

**Quién controla cada equipo:**

- El jugador controla las unidades del equipo `player`.
- La IA controla `ally`, `enemy` y `third`.
- Hostilidad: `player` y `ally` forman un bando contra `enemy`. `third` es hostil a todos los demás.

## 4. Movimiento

Se calcula con Dijkstra. El coste de cada paso es el coste del terreno de la casilla a la que se entra, y el coste total no puede pasar de `move`.

- **Subir:** se puede si `dh ≤ salto`. El salto de la unidad suma el `jumpBonus` del terreno de la casilla desde la que empieza a moverse.
- **Bajar:** se puede si `−dh ≤ salto + 2`.
- **Obstáculos:**
  - Las unidades hostiles y los prototipos bloquean el paso.
  - Los aliados se pueden atravesar, pero no se puede terminar el movimiento en una casilla ocupada.
- **Orden fijo:** los vecinos se recorren en el orden +x, +y, −x, −y. Si dos caminos cuestan lo mismo, se queda el primero que se encontró.
- **Salida de `reachable`:** incluye la casilla propia con coste 0. Cada `path` empieza en el origen.
- **Orientación:** tras moverse, la unidad mira en la dirección de su último paso.

## 5. Habilidades

### Alcance

- Distancia Manhattan entre `range.min` y `range.max`.
- Con `highGroundBonus`, el máximo sube en 1 si el atacante está 2 o más niveles por encima de la casilla objetivo.
- `maxDh` limita la diferencia de altura (`|dh|`). Si no se indica y `range.max ≤ 1`, vale 2: el cuerpo a cuerpo exige `|dh| ≤ 2`.
- No hay línea de visión.

### Objetivos válidos

| target | Área `single` | Otras áreas |
|---|---|---|
| `self` | La casilla propia | La casilla propia |
| `hostile` | Casilla con una unidad hostil **o un prototipo** | Cualquier casilla al alcance |
| `friendly` | Casilla con una unidad no hostil (puede ser la propia) | Cualquier casilla al alcance |
| `tile` | Casilla libre, transitable y que no sea canal | — |

### Áreas

- `single`: solo la casilla objetivo.
- `cross`: la casilla objetivo y hasta `radius` casillas en cada una de las 4 direcciones.
- `diamond`: todas las casillas a distancia Manhattan `≤ radius`.
- `line`: la casilla objetivo y `radius` casillas más en la dirección que va del atacante al objetivo.

### A quién afecta

- Habilidades `self` y `friendly`: solo a las unidades no hostiles del área.
- Habilidades `hostile` de área `single`: solo a las unidades hostiles.
- Cualquier otra área: **a todas las unidades**, con fuego amigo, incluida la que lanza la habilidad si está dentro.

Las unidades afectadas se procesan en orden de id.

### Orden de resolución

1. Se paga el brío.
2. Se emite `SkillUsed` con el área.
3. Si se usa Sobremarcha, se suma `OVERCLOCK_PRESSURE = 2` a la Presión (esto puede provocar una Sobrecarga).
4. Se aplican los efectos en el orden de la definición.
5. El atacante gira para mirar al objetivo (`Faced`).

### Sobremarcha

- Solo existe en habilidades marcadas con `overclock`.
- Duplica el poder de daño, la curación, el blindaje, los stacks de estado, el blindaje por punto de la válvula y el CT de retraso.
- No duplica la distancia de empuje ni la Presión que añaden los propios efectos.

### Efectos

- **`damage`:** cada golpe (`times`) pasa por la pipeline del apartado 6. Todo prototipo que esté en el área de una habilidad `hostile` o `tile` detona al instante.
- **`heal`:** cura hasta la vida máxima.
- **`block`:** da blindaje.
- **`status`:** suma stacks.
- **`push`:** empuja a cada unidad afectada en la dirección que va del atacante a ella (ver el apartado 7). En habilidades hostiles, también empuja a los prototipos del área.
- **`pressure`:** suma o resta Presión.
- **`vent`:** baja la Presión a 0 y da `puntos purgados × blockPerPoint` de blindaje a quien la usa.
- **`placePrototype`:** coloca el prototipo en la casilla objetivo y lo añade a la barra de turnos con CT 0.
- **`delay`:** resta CT.

### INTERACT

- Se hace sobre la casilla propia o una adyacente con `interact`. Cuenta como la acción del turno.
- Queda registrado en `interacted` con la clave `"x,y"` y cumple el objetivo `interact`.
- La `valvula` baja además la Presión en 3 (`VALVE_RELIEF`).

## 6. Daño (con desglose)

`src/core/shared/damage.ts` calcula el daño en este orden:

1. **Base** = `max(1, poder + ataque − defensa)`.
2. **+ Fuerza** del atacante (suma plana).
3. **× Caldera** `1,25`: solo si la habilidad es de vapor (`steam`) y la Presión es ≥ `PRESSURE_SWEET_SPOT = 4` en ese momento.
4. **× Altura** `1 + 0,1 · clamp(dh, −3, 3)`, donde `dh` es la altura del atacante menos la del objetivo.
5. **× Orientación del objetivo** respecto a la dirección desde la que le llega el golpe:
   - Frente ×1. El atacante está delante, también en diagonal.
   - Flanco ×1,25.
   - Espalda ×1,5. El atacante está detrás y más en el eje de la mirada que en el perpendicular.
6. **× Débil** 0,75 si el atacante está débil.
7. **× Vulnerable** 1,5 si el objetivo es vulnerable.
8. Se redondea hacia abajo (`floor`), con un mínimo de 1.

Después, el **blindaje absorbe** primero y la vida pierde el resto.

- En el evento `Damaged`, `amount` es la vida perdida, `blocked` lo que absorbió el blindaje y `breakdown` la lista de modificadores. El desglose reproduce exactamente `amount + blocked` si se aplica en orden: las sumas suman y el resto multiplica.
- `previewDamage` usa las mismas cuentas. Tiene en cuenta los golpes múltiples, el blindaje que se va gastando, la Sobremarcha y los efectos de Presión previos de la misma habilidad. **No** incluye las explosiones en cadena.
- Hay tres fuentes de daño con cantidad fija que no pasan por la pipeline: la Sobrecarga (8), las explosiones (`max(daño, 6)`) y el terreno. Las tres sí las absorbe el blindaje. El choque y la caída también son fijos.
- Llegar a 0 de vida deja la unidad KO (`UnitKO`): sale de la barra de turnos y deja libre su casilla.

## 7. Empuje

El empuje avanza casilla a casilla, hasta `distancia` casillas.

- **Choques** (`COLLISION_DAMAGE = 3`). Al chocar, el empuje se detiene:
  - Borde del mapa: choque `edge`.
  - Terreno impasable o una subida de más de 1 nivel: choque `wall`.
  - Otra unidad: choque `unit` con `otherId`, y **las dos** reciben 3 de daño.
  - Un prototipo: choque `unit`, pero solo recibe daño el empujado.
- **Caídas:** si el siguiente paso baja más de 1 nivel, se emite `Fell` y se hace `(niveles − 1) · FALL_DAMAGE_PER_LEVEL (3)` de daño. La `paja` lo anula.
- **Canal:** la unidad entra en la casilla, se emite `UnitRemoved` y sale de la batalla y de la barra de turnos.
- Las unidades con `immunities: ['push']` (los jefes) no se mueven.
- Los prototipos también se pueden empujar: no reciben daño y el canal los frena como si fuera un muro.
- Orden de eventos: `Pushed` (con la posición final y el choque), `Fell`, `Damaged` de la caída y `Damaged` del choque.

## 8. Presión y Sobrecarga

- La Presión va de 0 a `PRESSURE_MAX = 10`. Cada cambio emite `PressureChanged`.
- Al llegar a 10 hay **Sobrecarga**, que hace `OVERLOAD_DAMAGE = 8` a **todas** las unidades en pie. El blindaje la absorbe. Después, la Presión vuelve a 0.
- Orden de eventos: `PressureChanged(p→10)`, `Overload{hit}`, un `Damaged` por cada unidad (en orden de id) y `PressureChanged(10→0)`.

## 9. Prototipos

- Cada activación en la barra de turnos resta 1 a la mecha (`FuseTicked`). Al llegar a 0, el prototipo explota. Cada prototipo lleva su propia mecha.
- **Explosión**, en este orden:
  1. Se emite `PrototypeExploded` con el área.
  2. Todas las unidades del área reciben `max(daño, FUSE_EXPLOSION_MIN = 6)` de daño (con fuego amigo).
  3. Si el prototipo tiene `pushOut`, empuja 1 casilla hacia fuera a las unidades del área, en la dirección que va del centro a cada una.
  4. Se suma la Presión del prototipo.
  5. Los demás prototipos del área quedan en cola para detonar.
- **Cadenas:** la cola se resuelve en orden estable de id: `#1`, `#2`…
- Un prototipo que recibe un ataque detona al instante.
- Si un prototipo con `onExplode: 'defeat'` explota (por ejemplo, la Desmontadora), la batalla se pierde.
- Datos:
  - `prototipo_inestable`: mecha 3, velocidad 10, área en rombo de radio 1, 8 de daño, +2 de Presión y empuje hacia fuera.
  - `desmontadora`: mecha 8 y hace perder la batalla al explotar.

## 10. Goteras

- Cada era se asocia a un terreno fijo: medieval→`paja`, steampunk→`respiradero`, futurista→`antigravedad` y cyberpunk→`neon`.
- Al crear la batalla, la casilla de la Gotera toma el terreno de `cycle[0]`.
- En cada pitido `b`, primero cambian las Goteras con `b % everyBeeps == 0`, que pasan a la era siguiente (`GoteraShifted`). Después avisan las que cambiarán en el pitido siguiente, las que cumplen `(b + 1) % everyBeeps == 0` (`GoteraWarned`).
- `createBattle` también emite los avisos del pitido 1.

## 11. Objetivos, derrota y disparadores

Se evalúan después de cada intent y después de cada activación de la barra de turnos.

- **Derrota**, que tiene prioridad sobre la victoria. La batalla se pierde si ocurre cualquiera de estas cosas:
  - Explota un prototipo con `onExplode 'defeat'`.
  - No queda ninguna unidad `player` en pie. Esto cuenta como derrota aunque la batalla no declare `partyWiped`.
  - Se cumple alguna condición: `partyWiped`, `unitDown` (la unidad está KO o retirada) o `beepLimit` (`beeps ≥ n`).
- **Objetivos:** un objetivo cumplido se queda cumplido. Se emite `ObjectiveMet` una sola vez y queda guardado en `metObjectives`.
  - `rout`: todas las unidades hostiles al jugador (`enemy` y `third`) están caídas.
  - `defeat`: todas las unidades de la lista están caídas.
  - `survive`: `beeps ≥ n`.
  - `reach`: una unidad `player` en pie pisa una de las casillas.
  - `interact`: la casilla está en `interacted`.
- **Victoria:** todos los objetivos están cumplidos y queda al menos una unidad del jugador en pie.
- **Disparadores:** cada uno emite `Dialogue{script}` una sola vez y queda guardado en `firedTriggers`.
  - `start`: al crear la batalla.
  - `hpBelow`: cuando `vida · 100 < pct · vida máxima`.
  - `beep`: cuando `beeps ≥ n`.
- Al terminar la batalla, `phase` pasa a `victory` o `defeat`, `turn` pasa a `null` y el último evento es `BattleEnded`.

## 12. IA por utilidad (determinista)

- **Qué evalúa:** todas las combinaciones de casilla alcanzable × habilidad pagable × objetivo válido. Las casillas van por índice, las habilidades en el orden de la definición y los objetivos por índice.
- **Cómo elige:** gana la puntuación entera más alta. En caso de empate, se queda la primera encontrada, y quedarse quieta suma +1. Si la mejor acción no puntúa más que 0, no actúa.
- **Pesos:**

  | Concepto | Puntos |
  |---|---|
  | Daño a un hostil | ×10 |
  | Blindaje hostil gastado | ×2 |
  | KO hostil | +60 (+90 el jefe) |
  | Daño a un amigo | ×−15 (×−5 el kamikaze) |
  | KO amigo | −120 |
  | Curación útil | ×8 |
  | Blindaje, si hay hostiles a 5 casillas o menos | ×2 |
  | Stacks de estado del lado correcto | ×6 |
  | Empuje | por su resultado: canal +90, daño de caída y de choque ×10 |
  | Sobrecarga provocada | se valora como su daño, pero el kamikaze ignora el daño a su bando |
  | Presión para el kamikaze | +4 por punto |
  | Cruzar a Presión ≥ 4 | +3 |
  | Colocar un prototipo | 40 % del valor de su explosión |
  | Detonar la Desmontadora | −100000 para el bando del jugador y +500 para los demás |

- **Posición:**
  - Altura: +2 por nivel.
  - Casilla de una explosión telegrafiada (prototipo con mecha ≤ 1): −40 (−10 el kamikaze).
  - Terreno dañino: −8 por punto de daño, y −6 si aplica un estado.
- **Perfiles:**
  - `agresivo`, `jefe` y `kamikaze`: −3 por cada casilla de distancia al hostil más cercano.
  - `cobarde`: igual que el agresivo mientras tiene al menos el 50 % de vida. Por debajo, gana +10 por cada casilla de distancia y sus acciones valen la cuarta parte.
  - `guardian`: −4 por cada casilla que se aleja de su posición.
  - `inmovil`: no se mueve.
  - El piloto automático de las unidades del jugador suma −6 por cada casilla de distancia a la casilla `reach` más cercana, y +200 si la pisa.
- **`forecast`:** simula el inicio del turno de la unidad sobre una copia del estado (brío, blindaje, veneno y terreno) y planifica. Si el estado no cambia, coincide exactamente con lo que la IA hace después.
- **`dangerZone`:** son las áreas de los prototipos con mecha ≤ 1 más las casillas de terreno dañino.

## 13. API y eventos (contrato con la UI)

- **`createBattle(def, {roster, flags, seed, registry})`:**
  - Coloca el grupo en `deploy`, en el orden del roster. Cada héroe mira al enemigo más cercano.
  - Los ids se construyen así: `defId` para el primero de cada tipo, y `defId#2`, `#3`… para los siguientes.
  - Emite `PrototypePlaced` por cada prototipo inicial, luego `GoteraWarned` y `Dialogue(start)`.
  - Después **avanza la barra hasta el primer turno del jugador**, resolviendo antes los turnos de la IA si los hay.
- **`dispatch(state, intent, registry)`:**
  - Nunca modifica el estado que recibe: trabaja sobre una copia con `structuredClone`.
  - Si el intent no es válido, lanza un `Error` con el mensaje en español.
  - Tras `WAIT`, resuelve IA, mechas y reloj hasta el siguiente turno del jugador o el final de la batalla (guardarraíl: 500 activaciones).
  - Si la unidad en turno cae durante su propia acción, su turno termina solo.
- **`BattleState.turn`:** es `null` cuando la batalla ha terminado. Mientras la batalla sigue, siempre tiene el turno de una unidad del jugador.
- **Eventos de cada activación:** empiezan con `TurnStarted{ref}` y le siguen los del inicio de turno (`BrioChanged`, veneno, terreno), la acción y el final.
- **Piloto automático (`autoPlayTurn`):** juega el turno en curso con la IA usando solo `dispatch`. Sirve para los tests IA contra IA y para un posible botón «Auto».
