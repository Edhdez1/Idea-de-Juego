/**
 * Textos de presentación de la batalla (sin Phaser): nombres cortos,
 * objetivos, orden de turnos y líneas provisionales de diálogo hasta que
 * llegue el sistema de guiones.
 */

import type { AiPlan, BattleState, Objective, TacticsRegistry, TimelineRef, UnitState } from '../core/tactics';

/** «La Ingeniera Desahuciada» → «Ingeniera»; «aprendiz_explotado#2» → «Aprendiz 2». */
export function nombreCorto(u: Pick<UnitState, 'id' | 'defId'>, r: TacticsRegistry): string {
  let base: string;
  try {
    base = r.unit(u.defId).name;
  } catch {
    base = u.defId;
  }
  const palabras = base.split(/\s+/).filter((p) => !/^(el|la|los|las)$/i.test(p));
  const primera = palabras[0] ?? base;
  const n = u.id.split('#')[1];
  return n ? `${primera} ${n}` : primera;
}

export function textoObjetivo(o: Objective, s: BattleState, r: TacticsRegistry): string {
  switch (o.kind) {
    case 'rout':
      return 'Derrota a todos los enemigos';
    case 'defeat':
      return `Derrota a ${o.unitIds
        .map((id) => {
          const u = s.units.find((x) => x.id === id);
          return u ? nombreCorto(u, r) : id;
        })
        .join(', ')}`;
    case 'survive':
      return `Aguanta ${o.beeps} pitidos del Coso (${Math.min(s.beeps, o.beeps)}/${o.beeps})`;
    case 'reach': {
      const t = o.tiles[0];
      const tile = t ? s.board.tiles[t.y * s.board.w + t.x] : undefined;
      if (tile?.terrain === 'puerta' || tile?.interact === 'puerta') return 'Llega a la puerta del taller';
      return `Llega a ${o.tiles.map((p) => `(${p.x},${p.y})`).join(' o ')}`;
    }
    case 'interact':
      return `Usa el mecanismo de (${o.tile.x},${o.tile.y})`;
  }
}

export interface EntradaOrden {
  texto: string;
  /** 'unit' con equipo, 'prototype' o 'clock'. */
  tipo: 'player' | 'ally' | 'enemy' | 'third' | 'prototype' | 'clock';
  ref: TimelineRef;
}

export function entradaOrden(ref: TimelineRef, s: BattleState, r: TacticsRegistry): EntradaOrden {
  switch (ref.kind) {
    case 'unit': {
      const u = s.units.find((x) => x.id === ref.id);
      return { texto: u ? nombreCorto(u, r) : ref.id, tipo: u?.team ?? 'enemy', ref };
    }
    case 'prototype': {
      const p = s.prototypes.find((x) => x.id === ref.id);
      return { texto: p ? `Mecha ${p.remaining}` : 'Mecha', tipo: 'prototype', ref };
    }
    case 'clock':
      return { texto: 'Coso: ¡pip!', tipo: 'clock', ref };
  }
}

/** «Aprendiz → Ingeniera (Golpe)» para la previsión «si nada cambia». */
export function textoPrevision(p: AiPlan, s: BattleState, r: TacticsRegistry): string {
  const u = s.units.find((x) => x.id === p.unitId);
  const quien = u ? nombreCorto(u, r) : p.unitId;
  if (!p.skillId || !p.target) return `${quien}: se mueve`;
  const t = p.target;
  const victima = s.units.find((x) => !x.ko && !x.removed && x.pos.x === t.x && x.pos.y === t.y);
  let habilidad = p.skillId;
  try {
    habilidad = r.skill(p.skillId).name;
  } catch {
    // id tal cual
  }
  return victima ? `${quien} → ${nombreCorto(victima, r)}: ${habilidad}` : `${quien}: ${habilidad}`;
}

export interface LineaProvisional {
  nombre: string;
  color: string;
  texto: string;
  retrato?: string;
}

const NARRADOR = { nombre: 'EL NARRADOR', color: '#e8c170' };
const INGENIERA = { nombre: 'LA INGENIERA', color: '#9ec8ff', retrato: 'retrato_ingeniera' };

/**
 * Líneas provisionales por id de guion (el sistema de diálogo llega después).
 * Cualquier guion sin entrada muestra una línea del Narrador con su id.
 */
const LINEAS: Record<string, LineaProvisional[]> = {
  b0_inicio: [
    { ...NARRADOR, texto: 'El Gremio ha embargado el taller. Con todo dentro. Incluida la Ingeniera.' },
    { ...INGENIERA, texto: 'La puerta está ahí mismo. Nadie me cobra la cuota de salida.' },
  ],
  b0_ingeniera_herida: [{ ...INGENIERA, texto: 'Esto no venía en el contrato de alquiler.' }],
  b0_primer_cambio_de_era: [
    { ...NARRADOR, texto: 'La Gotera escupe otra época sobre el suelo. Nadie ha pedido permiso al ayuntamiento.' },
  ],
};

export function lineasDeGuion(script: string): LineaProvisional[] {
  return LINEAS[script] ?? [{ ...NARRADOR, texto: `(Guion «${script}» pendiente de escribir.)` }];
}

export const NOMBRE_ERA: Record<string, string> = {
  medieval: 'medieval',
  steampunk: 'steampunk',
  futurista: 'futurista',
  cyberpunk: 'cyberpunk',
};
