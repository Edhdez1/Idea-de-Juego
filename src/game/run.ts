/**
 * Estado de la run (mapa de nodos, mazo, oro, vida) y generador del mapa
 * del Acto 1. Este módulo NO importa Phaser: la generación es pura y
 * determinista (Rng/deriveSeed) y se testea en Node. La persistencia en
 * localStorage está aislada al final y protegida con try/catch.
 */

import { Rng, deriveSeed } from '../core';
import { MAZO_INICIAL_INGENIERA } from '../data/encounters/acto1';

// ---------- Tipos ----------

export type TipoNodo = 'combate' | 'elite' | 'taberna' | 'descanso' | 'jefe';

export interface NodoMapa {
  id: number;
  tipo: TipoNodo;
  fila: number;
  columna: number;
  /** Ids de nodos de la fila siguiente alcanzables desde este. */
  conexiones: number[];
  completado: boolean;
  /** Encuentro a lanzar (solo combate/élite/jefe). */
  encuentroId?: string;
}

export interface RunState {
  seed: number;
  hpActual: number;
  hpMax: number;
  oro: number;
  deck: string[];
  nodos: NodoMapa[];
  nodoActual: number | null;
  intro2Vista: boolean;
  primeraVictoria: boolean;
  /** Coherencia narrativa: el Narrador presenta el mapa solo una vez. */
  bienvenidaVista: boolean;
  /** Brayan se presenta en la primera visita; después, saludo corto. */
  tabernaVista: boolean;
}

// ---------- Constantes ----------

export const HP_MAX_INICIAL = 70;
export const ORO_INICIAL = 60;
/** Cura de la hoguera: 30% de la vida máxima, redondeado. */
export const FRACCION_DESCANSO = 0.3;

export const ORO_POR_VICTORIA: Record<TipoNodo, number> = {
  combate: 25,
  elite: 45,
  jefe: 70,
  taberna: 0,
  descanso: 0,
};

const ENCUENTROS_NORMALES = ['taller_embargado', 'visita_del_recaudador'] as const;
const ENCUENTRO_ELITE = 'auditoria_sorpresa';
const ENCUENTRO_JEFE = 'jefe_gran_maestre';

/** Filas de nodos normales (0..4); la fila 5 es el jefe. */
const FILAS_NORMALES = 5;

// ---------- Generador del mapa del Acto 1 ----------

/**
 * Genera 12-14 nodos en 6 filas (2-3 por fila + jefe arriba). Conexiones
 * solo hacia la fila siguiente, sin cruces (rangos contiguos monótonos),
 * todo alcanzable desde la fila 1. Exactamente 1 taberna y 1 descanso a
 * mitad de mapa (filas 2-3) y 1 élite en la fila 4.
 */
export function generarMapaActo1(seed: number): NodoMapa[] {
  const rng = new Rng(deriveSeed(seed, 'mapa'));

  // 2-3 nodos por fila normal; total 11-13 (+1 jefe = 12-14).
  const cuentas = Array.from({ length: FILAS_NORMALES }, () => 2 + rng.int(2));
  const total = (): number => cuentas.reduce((a, b) => a + b, 0);
  while (total() < 11) cuentas[rng.int(FILAS_NORMALES)] = 3;
  while (total() > 13) cuentas[rng.int(FILAS_NORMALES)] = 2;

  const nodos: NodoMapa[] = [];
  const porFila: NodoMapa[][] = [];
  for (let fila = 0; fila < FILAS_NORMALES; fila++) {
    const filaNodos: NodoMapa[] = [];
    for (let columna = 0; columna < cuentas[fila]!; columna++) {
      const nodo: NodoMapa = {
        id: nodos.length,
        tipo: 'combate',
        fila,
        columna,
        conexiones: [],
        completado: false,
      };
      nodos.push(nodo);
      filaNodos.push(nodo);
    }
    porFila.push(filaNodos);
  }
  const jefe: NodoMapa = {
    id: nodos.length,
    tipo: 'jefe',
    fila: FILAS_NORMALES,
    columna: 0,
    conexiones: [],
    completado: false,
    encuentroId: ENCUENTRO_JEFE,
  };
  nodos.push(jefe);
  porFila.push([jefe]);

  // Nodos especiales: taberna y descanso a mitad (una en fila 2, otro en
  // fila 3, orden al azar) y la élite vigilando la antesala del jefe (fila 4).
  const filaTaberna = 2 + rng.int(2);
  const filaDescanso = filaTaberna === 2 ? 3 : 2;
  rng.pick(porFila[filaTaberna]!).tipo = 'taberna';
  rng.pick(porFila[filaDescanso]!).tipo = 'descanso';
  const elite = rng.pick(porFila[4]!);
  elite.tipo = 'elite';
  elite.encuentroId = ENCUENTRO_ELITE;

  for (const nodo of nodos) {
    if (nodo.tipo === 'combate') nodo.encuentroId = rng.pick(ENCUENTROS_NORMALES);
  }

  // Conexiones sin cruces: cada nodo cubre un rango contiguo de la fila
  // siguiente y los rangos avanzan de forma monótona (comparten como mucho
  // el extremo). Así todo destino recibe al menos una entrada y todo origen
  // tiene al menos una salida.
  for (let fila = 0; fila < porFila.length - 1; fila++) {
    const origen = porFila[fila]!;
    const destino = porFila[fila + 1]!;
    let j = 0;
    for (let i = 0; i < origen.length; i++) {
      const nodo = origen[i]!;
      // A veces el siguiente origen arranca un destino más adelante
      // (el anterior ya cubrió el actual): más variedad, cero cruces.
      if (i > 0 && j < destino.length - 1 && rng.next() < 0.35) j += 1;
      nodo.conexiones.push(destino[j]!.id);
      const esUltimo = i === origen.length - 1;
      while (j < destino.length - 1 && (esUltimo || rng.next() < 0.4)) {
        j += 1;
        nodo.conexiones.push(destino[j]!.id);
      }
    }
  }

  return nodos;
}

// ---------- Ciclo de vida de la run ----------

export function crearRun(seed: number): RunState {
  return {
    seed,
    hpActual: HP_MAX_INICIAL,
    hpMax: HP_MAX_INICIAL,
    oro: ORO_INICIAL,
    deck: [...MAZO_INICIAL_INGENIERA],
    nodos: generarMapaActo1(seed),
    nodoActual: null,
    intro2Vista: false,
    primeraVictoria: false,
    bienvenidaVista: false,
    tabernaVista: false,
  };
}

/** Nodos a los que se puede viajar ahora mismo (fila 1 si aún no se pisó el mapa). */
export function nodosAlcanzables(run: RunState): number[] {
  if (run.nodoActual === null) {
    return run.nodos.filter((n) => n.fila === 0).map((n) => n.id);
  }
  return run.nodos[run.nodoActual]?.conexiones.slice() ?? [];
}

/** Sincroniza la vida tras el combate, marca el nodo y paga el botín. */
export function registrarVictoria(run: RunState, hpFinal: number): NodoMapa {
  const nodo = run.nodoActual !== null ? run.nodos[run.nodoActual] : undefined;
  if (!nodo) throw new Error('No hay nodo actual que completar');
  run.hpActual = Math.max(1, Math.min(run.hpMax, hpFinal));
  nodo.completado = true;
  run.oro += ORO_POR_VICTORIA[nodo.tipo];
  return nodo;
}

/** Hoguera: cura el 30% de la vida máxima (redondeado). Devuelve lo curado. */
export function descansar(run: RunState): number {
  const antes = run.hpActual;
  run.hpActual = Math.min(run.hpMax, run.hpActual + Math.round(run.hpMax * FRACCION_DESCANSO));
  return run.hpActual - antes;
}

// ---------- Run activa (singleton de sesión, sin Phaser) ----------

let runActual: RunState | null = null;

export function obtenerRun(): RunState | null {
  return runActual;
}

export function establecerRun(run: RunState | null): void {
  runActual = run;
}

// ---------- Persistencia (localStorage, siempre con try/catch) ----------

const CLAVE_RUN = 'coso:run';
const CLAVE_SEMILLA = 'coso:semilla';

export function guardarRun(run: RunState): void {
  try {
    localStorage.setItem(CLAVE_RUN, JSON.stringify(run));
  } catch {
    // almacenamiento no disponible: la run vive solo en memoria
  }
}

export function cargarRun(): RunState | null {
  try {
    const crudo = localStorage.getItem(CLAVE_RUN);
    if (!crudo) return null;
    const run = JSON.parse(crudo) as RunState;
    if (!Array.isArray(run.nodos) || !Array.isArray(run.deck)) return null;
    return run;
  } catch {
    return null;
  }
}

export function borrarRun(): void {
  establecerRun(null);
  try {
    localStorage.removeItem(CLAVE_RUN);
  } catch {
    // nada que borrar si no hay almacenamiento
  }
}

/**
 * Semilla para una run nueva SIN Date.now (regla del proyecto): un contador
 * persistido se incrementa y se hila con deriveSeed. Sin almacenamiento,
 * cae a la semilla del contador 1 (determinista, pero jugable).
 */
export function nuevaSemilla(): number {
  let contador = 1;
  try {
    contador = Number(localStorage.getItem(CLAVE_SEMILLA) ?? '0') + 1;
    localStorage.setItem(CLAVE_SEMILLA, String(contador));
  } catch {
    // sin almacenamiento: contador fijo
  }
  return deriveSeed(0x0c05e, `run${contador}`);
}
