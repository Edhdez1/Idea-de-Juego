# Simulaciones de balance — Acto 1 (v1)

> Analista de balance · 2026-07-07 · motor en `src/core/` (commit de trabajo sobre `7c3edcc`).
> **Este documento solo diagnostica y recomienda: no se aplicó ningún cambio a `src/` ni a `tests/`.**

## 1. Metodología

Se escribió un simulador headless (fuera del repo, en el scratchpad de la sesión) que importa el
motor real por ruta relativa — `makeRegistry`, `createCombat`, `playCard`, `endTurn` de
`src/core/index.ts` — y los datos reales de `src/data/cards/ingeniera.ts`,
`src/data/enemies/gremio.ts` y `src/data/encounters/acto1.ts`. Nada se reimplementó: cada combate
usa la pipeline de daño, los statuses, la Presión y el RNG determinista del juego.

**Configuración:**

- **500 combates** por celda (encuentro × política × mazo × HP inicial), seeds deterministas
  distintos por celda.
- **HP del jugador: 70** (el valor de `src/game/controller.ts`). Como en una run el héroe llega
  tocado, se repitió todo con **HP 45** y **HP 30** como análisis de sensibilidad.
- **Encuentros**: los 4 de `ACTO1_ENCOUNTERS` (incluido el jefe `jefe_gran_maestre`, añadido
  recientemente a los datos).
- **Mazos**: el inicial de 12 cartas (`MAZO_INICIAL_INGENIERA`) y una variante
  `inicial + prototipo_inestable` (pick temprano plausible; el mazo inicial no trae Prototipos,
  así que sin la variante la métrica de explosiones sería siempre 0).
- **Corte de seguridad**: 60 turnos (ningún combate lo alcanzó).

**Políticas simuladas** (deliberadamente simples; acotan por abajo el nivel de juego humano):

- **(a) Agresiva** — juega el ataque jugable más caro (desempate por daño total) contra el enemigo
  vivo con menos HP; cuando no quedan ataques jugables, gasta la energía restante en
  bloqueo/válvula; termina el turno.
- **(b) Defensiva** — si el daño telegrafiado total de los intents enemigos es ≥ 8, prioriza
  bloqueo (y `valvula_de_escape`, valorada por su bloqueo real según la Presión actual) y después
  ataca; si el intent total es < 8, ataca como la agresiva.

**Métricas por celda**: tasa de victoria, HP restante promedio (global y solo en victorias),
turnos promedio, Sobrecargas por combate y % de combates con ≥ 1 Sobrecarga, explosiones de
Prototipo por combate y % de combates con ≥ 1 explosión.

**Límites conocidos**: ninguna política usa Overclock (la frecuencia de Sobrecarga medida es una
cota inferior), no hay mulligan ni planificación multi-turno, y la variante con Prototipo lleva
una sola copia. Un humano jugará mejor que ambas políticas.

## 2. Resultados

### 2.1 HP inicial 70 (combate «fresco»)

| Encuentro | Política | Mazo | Victoria | HP fin (prom.) | Turnos | Sobrecargas/combate (% combates) | Explosiones/combate (% combates) |
|---|---|---|---|---|---|---|---|
| taller_embargado | agresiva | inicial | **100 %** | 48.2 | 3.8 | 0.00 (0 %) | 0.00 (0 %) |
| taller_embargado | defensiva | inicial | **100 %** | 48.7 | 6.1 | 0.00 (0 %) | 0.00 (0 %) |
| taller_embargado | agresiva | +prototipo | **100 %** | 48.9 | 3.2 | 0.00 (0 %) | 0.00 (0 %) |
| taller_embargado | defensiva | +prototipo | **100 %** | 53.4 | 5.2 | 0.00 (0.2 %) | 0.03 (3.0 %) |
| visita_del_recaudador | agresiva | inicial | **100 %** | 63.3 | 2.4 | 0.00 (0 %) | 0.00 (0 %) |
| visita_del_recaudador | defensiva | inicial | **100 %** | 67.4 | 3.8 | 0.00 (0 %) | 0.00 (0 %) |
| visita_del_recaudador | agresiva | +prototipo | **100 %** | 63.2 | 2.1 | 0.00 (0 %) | 0.00 (0 %) |
| visita_del_recaudador | defensiva | +prototipo | **100 %** | 67.7 | 3.0 | 0.00 (0 %) | 0.00 (0 %) |
| auditoria_sorpresa | agresiva | inicial | **100 %** | 58.1 | 3.5 | 0.00 (0 %) | 0.00 (0 %) |
| auditoria_sorpresa | defensiva | inicial | **100 %** | 61.7 | 4.3 | 0.00 (0 %) | 0.00 (0 %) |
| auditoria_sorpresa | agresiva | +prototipo | **100 %** | 60.1 | 3.0 | 0.00 (0 %) | 0.00 (0 %) |
| auditoria_sorpresa | defensiva | +prototipo | **100 %** | 64.4 | 3.6 | 0.00 (0 %) | 0.00 (0 %) |
| jefe_gran_maestre | agresiva | inicial | **100 %** | 42.4 | 5.5 | 0.00 (0 %) | 0.00 (0 %) |
| jefe_gran_maestre | defensiva | inicial | **100 %** | 47.7 | 8.6 | 0.00 (0 %) | 0.00 (0 %) |
| jefe_gran_maestre | agresiva | +prototipo | **100 %** | 47.8 | 4.6 | 0.10 (9.6 %) | 0.02 (2.0 %) |
| jefe_gran_maestre | defensiva | +prototipo | **100 %** | 54.1 | 6.5 | 0.10 (9.8 %) | 0.27 (27.4 %) |

### 2.2 Sensibilidad: tasa de victoria con HP inicial reducido

(mazo inicial / mazo +prototipo)

| Encuentro | Política | HP 70 | HP 45 | HP 30 |
|---|---|---|---|---|
| taller_embargado | agresiva | 100 / 100 % | 100 / 100 % | 98.2 / 100 % |
| taller_embargado | defensiva | 100 / 100 % | 100 / 100 % | 93.4 / 99.4 % |
| visita_del_recaudador | ambas | 100 / 100 % | 100 / 100 % | 100 / 100 % |
| auditoria_sorpresa | ambas | 100 / 100 % | 100 / 100 % | 100 / 100 % |
| jefe_gran_maestre | agresiva | 100 / 100 % | 100 / 100 % | 65.8 / 93.0 % |
| jefe_gran_maestre | defensiva | 100 / 100 % | 99.0 / 100 % | 80.8 / 96.4 % |

### 2.3 Coste real de cada encuentro (HP perdido promedio, HP 70, mazo inicial)

| Encuentro | Agresiva | Defensiva | Lectura |
|---|---|---|---|
| jefe_gran_maestre | −27.6 | −22.3 | El más caro, como debe ser un jefe… pero nunca mata. |
| taller_embargado | −21.8 | −21.3 | El «élite» de facto del acto. |
| auditoria_sorpresa | −11.9 | −8.3 | Blando: el Inquisidor «gasta» su primer turno en debuffear. |
| visita_del_recaudador | −6.7 | −2.6 | Casi gratis: muere en ~2.4 turnos, antes de escalar. |

## 3. Diagnóstico

1. **No hay paredón; hay alfombra.** Con HP 70, **las 4 celdas base dan 100 % de victoria con las
   dos políticas**, incluso con políticas tontas sin Overclock ni planificación. Ningún encuentro
   del Acto 1 puede matar a un héroe fresco. El único que llega a doler es el jefe con HP ≤ 30.
2. **`visita_del_recaudador` es trivial.** Muere en 2.1–2.4 turnos con la agresiva: su mecánica
   identitaria (`interes_compuesto`, +2 Fuerza, patrón secuencial en 2º lugar) **casi nunca llega
   a importar** — el «interés compuesto» no compone. Cuesta 2–7 HP; es un nodo de relleno.
3. **`auditoria_sorpresa` también es blanda.** El Inquisidor abre con Vulnerable (0 daño) y el
   Aprendiz pega 5–7; la ventana de Vulnerable rara vez coincide con daño alto enemigo. 8–12 HP
   de coste.
4. **`taller_embargado` es el verdadero muro del acto**, más que el jefe en daño por turno
   temprano: Gólem 12 + Aprendiz 5–7 = hasta 19 de daño telegrafiado en un turno, contra un
   máximo de ~10 de bloqueo del mazo inicial. Correcto como élite, pero está sembrado como
   encuentro normal.
5. **Las mecánicas identitarias están dormidas con el mazo inicial.** La Presión solo sube con
   `motor_a_presion` (+2, 1 copia): el sweet spot (≥ 4 → ×1.25) es casi inalcanzable y la
   **Sobrecarga ocurrió en 0 % de los combates base** (solo 9.6–9.8 % en el jefe con Prototipo,
   ~0.1/combate). Las **explosiones de Prototipo** solo aparecen cuando el combate dura ≥ ~6
   turnos: 27 % de los combates de jefe con política defensiva, 2–3 % en el resto, 0 % en
   encuentros cortos. El «fusible» apenas cobra su precio en el Acto 1: los combates son
   demasiado cortos para que la caldera cante o el Prototipo estalle.
6. **Bloquear casi no compensa** salvo en el jefe: la defensiva gana el mismo 100 % ahorrando
   solo 0.5–5 HP, y con HP 30 en `taller_embargado` la defensiva es *peor* (93.4 % vs 98.2 %):
   alargar el combate contra el Gólem sale más caro que rematarlo. «Matar rápido» domina el acto.

## 4. Recomendaciones (números; NO aplicadas al código)

1. **Recaudador — que el interés componga.** Subir `hp` de `[32, 38]` a **`[44, 50]`** y/o
   invertir el orden de sus moves (abrir con `interes_compuesto`). Con ~47 HP sobrevive ~3.5–4
   turnos y llega a pegar al menos un `embargo_preventivo` a 10 (8 + 2 de Fuerza). Objetivo:
   coste de 10–14 HP en vez de 3–7.
2. **Gólem de Latón — menos esponja, mismo miedo.** Bajar `hp` de `[40, 46]` a **`[34, 40]`** y
   subir `prensazo_certificado` de 12 a **13**. `taller_embargado` mantiene su pico de daño
   telegrafiado (18–20/turno, que obliga a decidir de verdad entre bloquear y matar al Aprendiz)
   pero dura ~1 turno menos, reduciendo el desgaste «inevitable» que hoy lo hace más caro que el
   jefe por turno. Si se prefiere mantenerlo duro, re-etiquetarlo como élite en el mapa en vez de
   tocar números.
3. **Inquisidor — que la auditoría duela.** Subir `multa_retroactiva` de 7 a **9** (con los 2 de
   Vulnerable del turno anterior: 13 reales). Coste esperado del encuentro pasa de ~8–12 a
   ~14–18 HP, diferenciándolo del nodo trivial del Recaudador.
4. **Gran Maestre — un jefe debe poder matar.** Subir `hp` de `[70, 78]` a **`[84, 92]`** y
   `sello_de_denegacion` de 12 a **14**. Hoy un héroe fresco gana el 100 % de las veces perdiendo
   ~22–28 HP; con estos números el combate dura ~7–8 turnos (la Fuerza de `grito_de_patente`
   entra en juego dos veces), el coste esperado sube a ~35–40 HP y además los Prototipos/la
   Presión por fin tienen tiempo de disparar (ya es el único encuentro donde se ven Sobrecargas
   y explosiones).
5. **Presión — bajar el umbral para que la caldera cante en el Acto 1.** Reducir
   `PRESSURE_SWEET_SPOT` de 4 a **3** (o subir `motor_a_presion` de +2 a **+3** de Presión). Con
   el mazo inicial, hoy el bono ×1.25 es casi inalcanzable y la Sobrecarga inexistente: la
   mecánica identitaria del personaje no se manifiesta en todo el acto. Con umbral 3, un solo
   `motor_a_presion` + un Overclock ya enciende el bono, y el riesgo de Sobrecarga (10) sigue
   lejos.

**Orden sugerido de aplicación**: 1 y 3 primero (suben el suelo de dificultad sin tocar el
motor), luego 4, y re-simular antes de tocar 2 y 5.

## 5. Reproducibilidad

Simulador: `sim.ts` en el scratchpad de la sesión (`…/scratchpad/sim-balance/`), Node 22 +
`tsx` locales; importa `src/core` y `src/data` del repo por ruta relativa. Variables:
`RUNS` (default 500) y `HP` (default 70). Salidas crudas: `results-hp70.json`,
`results-hp45.json`, `results-hp30.json`. Todo es determinista por seed (splitmix32 del motor);
re-ejecutar reproduce estas tablas exactas mientras no cambien los datos de `src/data/`.
