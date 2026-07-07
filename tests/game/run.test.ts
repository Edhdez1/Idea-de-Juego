import { describe, expect, it } from 'vitest';
import {
  HP_MAX_INICIAL,
  ORO_INICIAL,
  crearRun,
  descansar,
  generarMapaActo1,
  nodosAlcanzables,
  registrarVictoria,
  type NodoMapa,
} from '../../src/game/run';
import { MAZO_INICIAL_INGENIERA } from '../../src/data/encounters/acto1';

const SEMILLAS = [1, 42, 20260707, -13, 999_999, 0x5eed];

function porFila(nodos: NodoMapa[]): Map<number, NodoMapa[]> {
  const filas = new Map<number, NodoMapa[]>();
  for (const nodo of nodos) {
    const fila = filas.get(nodo.fila) ?? [];
    fila.push(nodo);
    filas.set(nodo.fila, fila);
  }
  return filas;
}

describe('generarMapaActo1', () => {
  it('es determinista: la misma semilla produce el mismo mapa', () => {
    for (const seed of SEMILLAS) {
      expect(generarMapaActo1(seed)).toEqual(generarMapaActo1(seed));
    }
  });

  it('semillas distintas producen mapas distintos', () => {
    expect(generarMapaActo1(1)).not.toEqual(generarMapaActo1(2));
  });

  it('estructura: 12-14 nodos en 6 filas, 2-3 por fila y jefe arriba', () => {
    for (const seed of SEMILLAS) {
      const nodos = generarMapaActo1(seed);
      expect(nodos.length).toBeGreaterThanOrEqual(12);
      expect(nodos.length).toBeLessThanOrEqual(14);

      const filas = porFila(nodos);
      expect(filas.size).toBe(6);
      for (let f = 0; f < 5; f++) {
        const fila = filas.get(f)!;
        expect(fila.length).toBeGreaterThanOrEqual(2);
        expect(fila.length).toBeLessThanOrEqual(3);
      }
      // La primera fila es todo combate; la última, solo el jefe.
      expect(filas.get(0)!.every((n) => n.tipo === 'combate')).toBe(true);
      const cima = filas.get(5)!;
      expect(cima).toHaveLength(1);
      expect(cima[0]!.tipo).toBe('jefe');
      expect(cima[0]!.encuentroId).toBe('jefe_gran_maestre');
    }
  });

  it('hay exactamente 1 taberna y 1 descanso a mitad, y 1 élite', () => {
    for (const seed of SEMILLAS) {
      const nodos = generarMapaActo1(seed);
      const tabernas = nodos.filter((n) => n.tipo === 'taberna');
      const descansos = nodos.filter((n) => n.tipo === 'descanso');
      const elites = nodos.filter((n) => n.tipo === 'elite');
      expect(tabernas).toHaveLength(1);
      expect(descansos).toHaveLength(1);
      expect(elites).toHaveLength(1);
      expect([2, 3]).toContain(tabernas[0]!.fila);
      expect([2, 3]).toContain(descansos[0]!.fila);
      expect(elites[0]!.encuentroId).toBe('auditoria_sorpresa');
    }
  });

  it('todo nodo de combate/élite/jefe lleva encuentro asignado', () => {
    for (const seed of SEMILLAS) {
      for (const nodo of generarMapaActo1(seed)) {
        if (nodo.tipo === 'combate' || nodo.tipo === 'elite' || nodo.tipo === 'jefe') {
          expect(nodo.encuentroId, `nodo ${nodo.id} sin encuentro`).toBeTruthy();
        } else {
          expect(nodo.encuentroId).toBeUndefined();
        }
      }
    }
  });

  it('las conexiones van solo a la fila siguiente', () => {
    for (const seed of SEMILLAS) {
      const nodos = generarMapaActo1(seed);
      for (const nodo of nodos) {
        for (const destinoId of nodo.conexiones) {
          expect(nodos[destinoId]!.fila).toBe(nodo.fila + 1);
        }
        if (nodo.tipo !== 'jefe') {
          expect(nodo.conexiones.length).toBeGreaterThan(0);
        } else {
          expect(nodo.conexiones).toHaveLength(0);
        }
      }
    }
  });

  it('todos los nodos son alcanzables desde la primera fila', () => {
    for (const seed of SEMILLAS) {
      const nodos = generarMapaActo1(seed);
      const visitados = new Set<number>();
      const frontera = nodos.filter((n) => n.fila === 0).map((n) => n.id);
      while (frontera.length > 0) {
        const id = frontera.pop()!;
        if (visitados.has(id)) continue;
        visitados.add(id);
        frontera.push(...nodos[id]!.conexiones);
      }
      expect(visitados.size).toBe(nodos.length);
    }
  });

  it('los caminos no se cruzan entre filas', () => {
    for (const seed of SEMILLAS) {
      const nodos = generarMapaActo1(seed);
      // Dos aristas (a→b) y (c→d) entre las mismas filas se cruzan si
      // a está a la izquierda de c pero b cae a la derecha de d.
      const aristas = nodos.flatMap((n) =>
        n.conexiones.map((destinoId) => ({
          fila: n.fila,
          desde: n.columna,
          hasta: nodos[destinoId]!.columna,
        })),
      );
      for (const a of aristas) {
        for (const b of aristas) {
          if (a.fila !== b.fila) continue;
          const cruzan = a.desde < b.desde && a.hasta > b.hasta;
          expect(cruzan, `cruce en fila ${a.fila} (semilla ${seed})`).toBe(false);
        }
      }
    }
  });
});

describe('RunState', () => {
  it('crearRun arranca con 70 hp, 60 de oro y el mazo inicial', () => {
    const run = crearRun(42);
    expect(run.hpActual).toBe(HP_MAX_INICIAL);
    expect(run.hpMax).toBe(70);
    expect(run.oro).toBe(ORO_INICIAL);
    expect(run.deck).toEqual(MAZO_INICIAL_INGENIERA);
    expect(run.nodoActual).toBeNull();
    expect(run.intro2Vista).toBe(false);
    expect(run.primeraVictoria).toBe(false);
  });

  it('nodosAlcanzables: primera fila al inicio, conexiones después', () => {
    const run = crearRun(42);
    const primeraFila = run.nodos.filter((n) => n.fila === 0).map((n) => n.id);
    expect(nodosAlcanzables(run)).toEqual(primeraFila);
    run.nodoActual = primeraFila[0]!;
    expect(nodosAlcanzables(run)).toEqual(run.nodos[primeraFila[0]!]!.conexiones);
  });

  it('registrarVictoria sincroniza hp, marca el nodo y paga el botín', () => {
    const run = crearRun(42);
    run.nodoActual = run.nodos.find((n) => n.fila === 0)!.id;
    const nodo = registrarVictoria(run, 31);
    expect(run.hpActual).toBe(31);
    expect(nodo.completado).toBe(true);
    expect(run.oro).toBe(ORO_INICIAL + 25);
  });

  it('descansar cura el 30% del hpMax redondeado, sin pasarse del máximo', () => {
    const run = crearRun(42);
    run.hpActual = 20;
    expect(descansar(run)).toBe(21); // round(70 * 0.3)
    expect(run.hpActual).toBe(41);
    run.hpActual = 65;
    expect(descansar(run)).toBe(5); // tope en hpMax
    expect(run.hpActual).toBe(70);
  });
});
