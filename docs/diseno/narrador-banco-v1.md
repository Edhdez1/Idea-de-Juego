# Banco de líneas del Narrador — v1

> Fuente de verdad para `src/data/narrator.ts`. Basado en GDD §6 (el Narrador y la cuarta pared), §0 (premisa), §4 (personajes) y §5 (jefes). Alcance: Acto 1 (el Gremio), vertical slice.

## Reglas de uso (presupuesto de frecuencia, GDD §6)

- **Nivel 1 — burla diegética** (se ríe del mundo y del personaje): máx. ~1 de cada 3 combates.
- **Nivel 2 — meta-juego** (comenta tus decisiones de jugador): ~1 por run.
- **Nivel 3 — cuarta pared rota** (habla a quien sostiene el ratón): solo momentos clave, con cooldown persistente en `game:meta`; no se repite entre runs hasta agotar el banco.
- Máx. **1-2 intervenciones del Narrador por combate** (cooldown global). Cada línea se marca como vista y no vuelve a salir hasta agotar su grupo.
- Las líneas de jefe (§ final) pertenecen a la **voz 2** (el jefe, no el Narrador) y no consumen presupuesto del Narrador.

**Reglas de escritura aplicadas**: (1) coherencia — toda referencia (Coso, plástico, «88:88», T-800, Goteras, Recaudadora) existe en GDD/Sinopsis, nada sin contexto; (2) cínico con el poder, nunca cruel con las víctimas (aprendices, gólems, campesinos, Brayan); (3) el Narrador SABE qué es la freidora y deja caer pistas técnicamente correctas y perfectamente inútiles para el reino; (4) jamás revela la verdad.

**Leyenda de cooldown**: `combate` = no repetir en el mismo combate · `run` = 1 vez por run · `meta` = persistente entre runs (`game:meta`) · `banco` = rotación normal con peso hasta agotar grupo.

---

## 1. Inicio de combate — genérico

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| combate:inicio | 1 | «El Gremio manda a alguien más a defender su patente. La patente sigue sin existir, pero el entusiasmo es innegable.» | banco, 1 de cada 3 combates |
| combate:inicio | 1 | «Se desenvainan espadas, se calientan calderas. A lo lejos, el Coso pita. Nadie sabe si es apoyo o burla. Yo sí. No lo diré.» | banco, 1 de cada 3 combates |
| combate:inicio | 1 | «Consejo del manual: precalentar tres minutos antes de usar. No aplica a nada de lo que llevas encima, pero es un consejo excelente.» | banco, 1 de cada 3 combates |
| combate:inicio | 1 | «Que conste en acta que yo solo narro. Las decisiones, buenas o explosivas, son todas tuyas.» | run |
| combate:inicio | 2 | «Combate número… da igual el número. Yo los cuento, tú no. Lo importante es que alguien va a salir humeando.» | run |

## 2. Inicio de combate — por enemigo

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| combate:inicio:aprendiz | 1 | «Un aprendiz del Gremio. Lleva tres años "cogiendo experiencia". Sin cobrar, claro: la experiencia ES el pago.» | run |
| combate:inicio:aprendiz | 1 | «No lo odies a él. Odia al que le dijo que enfrentarte a ti contaba como prácticas curriculares.» | run |
| combate:inicio:golem | 1 | «Un gólem de latón. Garantía vencida y una bolsita de tornillos "que sobraron". Se hace daño solo, así que técnicamente ya vas ganando.» | run |
| combate:inicio:golem | 1 | «Lo ensamblaron un viernes por la tarde. Se le nota. Sé amable con él: no eligió ser un presupuesto recortado.» | run |
| combate:inicio:recaudador | 1 | «El Recaudador. Viene por tu oro, por los intereses y por los intereses de los intereses. Es lo único del reino que funciona con puntualidad.» | run |
| combate:inicio:recaudador | 1 | «Dato fiscal: todo lo que suelte al morir cuenta como devolución. En Vaporcracia Hacienda también devuelve; solo que hay que insistir a espadazos.» | run |
| combate:inicio:inquisidor | 1 | «El Inquisidor de Patentes. Puede confiscarte una carta en pleno combate. La apelación tarda seis meses; el combate, bastante menos.» | run |
| combate:inicio:inquisidor | 1 | «Para él, todo lo que funciona es una patente robada. Lo que no funciona también, pero esas no las reclama nadie.» | run |
| combate:inicio:gran_maestre | 1 | «El Gran Maestre del Gremio. Sostiene que el Coso salió de sus talleres. Sus talleres no consiguen que una tetera deje de explotar.» | run |
| combate:inicio:gran_maestre | 1 | «Ha ahorcado a tres desmontadores por tocar el plástico sagrado. Coherencia no le falta. Otras cosas sí; coherencia no.» | run |

## 3. Presión de Vapor

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| sobrecarga:primera | 1 | «La caldera dijo basta. Diez de presión, una detonación, y todos por los aires en igualdad de condiciones. Justicia, a su manera.» | meta (solo primera Sobrecarga de la cuenta) |
| sobrecarga:primera | 2 | «Los avisos estaban ahí: tubos rojos, temblores, el manómetro suplicando. Tomaste nota mental. La nota también explotó.» | meta |
| sobrecarga:primera | 3 | «¿Sentiste eso? La primera Sobrecarga siempre se recuerda. Y no pongas esa cara, tú, el del cristal: al botón le diste tú.» | meta, único |
| sobrecarga:muerte | 1 | «Muerte por caldera propia. Tercera causa de defunción del reino, después de la burocracia y de preguntar demasiado por el Coso.» | run |
| sobrecarga:muerte | 2 | «El informe forense dirá "error del operario". El operario eras tú.» | meta |
| sobrecarga:muerte | 2 | «Para que conste: la carta decía "+3 de Presión". Grande. En el centro. Lo menciono para el expediente.» | meta |

## 4. Prototipos

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| prototipo:explota | 1 | «Tercer uso, tal como marcaba el contador. La ingeniería del Gremio: puntualísima para explotar, impuntual para todo lo demás.» | combate |
| prototipo:explota | 1 | «Un prototipo menos. Funcionó de maravilla tres veces, que son tres más que la media del Gremio.» | combate |
| prototipo:explota | 2 | «Sabías que explotaba al tercer uso y lo usaste una tercera vez. Eso no es mala suerte: es un plan de pagos.» | run |

## 5. Fin de combate — victorias

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| victoria:sin_daño | 1 | «Ni un rasguño. El Gremio abrirá expediente para determinar qué patente violaste para conseguirlo.» | run |
| victoria:sin_daño | 1 | «Impecable. El Coso pitó dos veces desde la plaza. En su idioma eso significa "cesta lista". No preguntes cómo lo sé.» | run |
| victoria:sin_daño | 2 | «Sin daño recibido. Guarda el orgullo para cuando el mapa te ofrezca dos élites y un signo de interrogación.» | run |
| victoria:agonica | 1 | «Victoria. Técnicamente. Con la misma dignidad con la que fríe el Coso: sin aceite, pero echando humo.» | run |
| victoria:agonica | 1 | «Sobreviviste de milagro. Cuidado con esa palabra en este reino: hay jurisprudencia.» | run |
| victoria:agonica | 2 | «Ganaste con la vida en los tobillos. En algún punto del combate hubo una buena decisión. Yo tampoco la encontré.» | run |

## 6. Fin de combate — derrotas

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| derrota:enemigo | 1 | «El reino sigue girando: el Coso pita al amanecer, la cola del T-800 da la vuelta a la catedral, y tú ya no estás. Casi ni se nota.» | banco |
| derrota:enemigo | 1 | «Derrota. La institución de turno la archivará como prueba de que tenía razón. Todo les cuenta como prueba de que tienen razón.» | banco |
| derrota:enemigo | 2 | «Anotado en tu expediente. Sí, tienes expediente: lo abrió la Recaudadora y lo redacto yo. Nos vemos en la siguiente.» | run |
| derrota:auto | 1 | «Caído por su propia caldera. En la lápida pondrá: "murió haciendo lo que amaba — ignorar manómetros".» | banco |
| derrota:auto | 2 | «Causa de la muerte: tú. Arma homicida: tú. Único sospechoso: tú. El caso más rápido de mi carrera.» | meta |
| derrota:auto | 2 | «El enemigo quedó intacto y algo incómodo; no sabía si le contaba como victoria. Le dije que sí, para que durmiera tranquilo.» | meta |

## 7. Taberna

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| taberna:entrar | 1 | «La Taberna. Fuego encendido, cerveza aguada y contratos con cláusulas que ningún abogado del reino sabe leer. El reino no tiene abogados. Por eso las cláusulas.» | run |
| taberna:entrar | 1 | «Aquí paran los mercenarios: acentos de ciudades que no se fundarán hasta dentro de siglos. Las Goteras traen de todo, y casi todo llega con hambre.» | run |
| taberna:brayan | 1 | «Ahí está el Primo Brayan. Dos semanas en la época cyberpunk y "se le olvidó" su idioma natal. Su madre vive al lado y lo desmiente a gritos, por si tenías dudas.» | run |
| taberna:brayan | 1 | «Brayan dice que arar el campo "ya no escala". Lo mismo dijo de ordeñar, de cavar y de pagarle el alquiler a su madre.» | run |
| taberna:brayan | 2 | «Contrátalo si quieres: dice "sinergia" cada dos frases, pero pega fuerte y en el fondo solo quiere que lo admiren. Como todos aquí. Menos yo: yo ya soy admirable.» | meta |

## 8. Descanso (hoguera)

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| descanso | 1 | «Una hoguera de leña, con humo y chispas. En la época de la que cayó el Coso, esto se cobra aparte y se llama "experiencia rústica premium". No preguntes.» | run |
| descanso | 1 | «Descansa. El Gremio no descansa, la Iglesia no descansa, la Corona no descansa. Por eso el reino está como está.» | run |
| descanso | 2 | «Duerme, yo vigilo. Es broma: yo narro. Vigilarte no es mi trabajo… y aun así eres lo más entretenido que tengo desde que apareció la freidora. El Coso. Eso. Olvida lo primero.» | meta |

## 9. Recompensas y economía

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| recompensa:elegir | 1 | «Tres opciones. Lee la letra pequeña: en este reino nadie más lo hace, y mira cómo les va.» | run |
| recompensa:elegir | 1 | «Cartas nuevas. El Coso también llegó con un folleto de accesorios; el Gremio lo está descifrando. Van por la página de la garantía. Les va a doler.» | run |
| recompensa:elegir | 2 | «Esa de ahí encaja bien en lo que llevas montado. Lo digo sin ironía. No volverá a ocurrir.» | run |
| recompensa:saltar | 1 | «¿Rechazar un obsequio del reino? Técnicamente es desacato. Prácticamente es lo más sensato que has hecho hoy.» | run |
| recompensa:saltar | 2 | «¿Ninguna? Disciplina de mazo… o miedo al compromiso. Desde donde yo narro se ven idénticos.» | run |
| oro:avaricia_150 | 1 | «Más de 150 de oro. La Recaudadora Mayor acaba de sentir un escalofrío y no sabe por qué. Sí lo sabe. Eres tú.» | run |
| oro:avaricia_150 | 1 | «Con eso compras media tienda. La entera no: el tendero también ha visto tu bolsa y ya está subiendo los precios.» | run |
| oro:avaricia_150 | 2 | «¿Ahorras para algo o acumulas por acumular? No contestes: el oro sin gastar también es una decisión, y la estás tomando fatal.» | run |

## 10. Mapa y memoria entre runs

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| mapa:primera_vez | 1 | «El mapa. Todos los caminos suben la pirámide, y arriba espera el Coso: plástico puesto, pantalla en "88:88". Los sabios van por el segundo ocho.» | meta, único |
| mapa:primera_vez | 2 | «Desde aquí se ven todas las rutas. Los errores también, pero esos solo los veo yo, y no pienso señalarlos. Bueno. Quizá uno.» | meta, único |
| jefe:muerte_repetida | 2 | «Él ya te reconoce. Pregunta si eres nuevo por pura cortesía.» | meta (requiere 2+ muertes con el mismo jefe) |
| jefe:muerte_repetida | 2 | «Segunda vez. Ya guardó tu estrategia en un cajón, junto a la patente que jura que le robaste.» | meta |
| jefe:muerte_repetida | 3 | «Otra vez este jefe. Sí, tú, el que sostiene el ratón: hay una definición famosa de locura, y es exactamente esto pero con el mismo mazo.» | meta, único (3+ muertes) |

## 11. Matar al Gran Maestre (cierre de acto)

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| gran_maestre:muerto | 1 | «Cae el Gran Maestre, y con él su "patente robada". El reino ya redacta la siguiente explicación. Te adelanto algo: es peor.» | run |
| gran_maestre:muerto | 1 | «Queda oficialmente desmentido que el Coso saliera de un taller del Gremio. Mañana la Iglesia anunciará de dónde salió. Ojalá no lo hicieran.» | run |
| gran_maestre:muerto | 3 | «Un acto menos. Tú sí sabes lo que es esa cosa. No se lo digas a nadie de aquí: no me estropees el mejor siglo que he tenido.» | meta, único |

---

## 12. Líneas de jefe — el Gran Maestre del Gremio (voz 2)

El jefe defiende SU explicación del Coso — «una patente robada de uno de nuestros hornos» — en entrada, cambio de fase y muerte (GDD §5). Diegéticas salvo la excepción marcada de nivel 3 (GDD §6).

| disparador | nivel | línea | cooldown sugerido |
|---|---|---|---|
| jefe:gm:entrada | 1 | «¡Alto! Ese Coso salió de MIS talleres. Modelo VPR-88. La documentación se quemó, lo cual demuestra que existía: ¿para qué iba a quemarse algo que no existe?» | rotación por run (1 de 3 en cada entrada) |
| jefe:gm:entrada | 1 | «¿Vienes por el Coso? Querrás decir el Horno Patentado N.º 1. Primero pasa sobre mí. Después, sobre el papeleo. El papeleo es peor.» | rotación por run |
| jefe:gm:entrada | 1 | «Tres desmontadores ahorcados por tocar el plástico sagrado. No porque crea en el plástico: porque el plástico es MÍO, y lo mío no se toca.» | rotación por run |
| jefe:gm:fase | 1 | «¿Crees que no oigo silbar tu caldera? ¡Yo INVENTÉ ese silbido! ¡Consta en la patente 12-B, junto al pitido del amanecer!» | rotación por run (cambio de fase) |
| jefe:gm:fase | 1 | «¡El "88:88" es el número de serie! ¡Llevo meses diciéndolo en la Junta y nadie me DA EL PREMIO!» | rotación por run |
| jefe:gm:fase:vida_baja | 3 | «¿En serio vas a jugar esa carta? Sí, tú. El del otro lado del cristal.» | meta, único (jefe con vida baja) |
| jefe:gm:muerte | 1 | «La patente… era robada… luego alguien… la tenía… luego yo… tenía razón…» | rotación por run (muerte del jefe) |
| jefe:gm:muerte | 1 | «Registrad mi derrota… en el formulario D-66… "Defunción por Litigio"… tres copias…» | rotación por run |
| jefe:gm:muerte | 1 | «Decidle a la Iglesia… que el Coso lleva mi sello… se lo puse anoche… con pegamento…» | rotación por run |
| jefe:gm:muerte | 2 | «Al menos yo tenía una explicación… La tuya, ¿cuál es? …Exacto. Eso pensaba.» | meta |

---

## Recuento y notas de implementación

- **Total: 70 líneas** — 60 del Narrador (voz 1) + 10 del Gran Maestre (voz 2). Dentro del rango 60-80; el vertical slice puede recortar a ~30 priorizando: combate genérico, Sobrecarga, Prototipo, victorias/derrotas, jefe completo.
- Distribución de niveles: **47 × nivel 1 · 19 × nivel 2 · 4 × nivel 3** — respeta el presupuesto (nivel 1 común, nivel 2 ocasional, nivel 3 rara y solo en momentos clave: primera Sobrecarga, mapa/jefes, derrotas repetidas, final de acto).
- Cada fila mapea 1:1 a una entrada de `src/data/narrator.ts` con `{ trigger, level, text, cooldown, weight, seenFlag }`. Los disparadores usan los eventos del GDD §6 (`onOverload`, `onPlayerDeath{count}`, `onCardExploded`, `onHoardGold`…).
- Pendiente para v2: variantes por época/creencia del personaje (§4.4), líneas para Autómata y Junta del Gremio, reacciones a mercenarios concretos, y banco de la Recaudadora como élite.
