/**
 * Enemigos del Acto 1: el Gremio (GDD §5).
 * Enemigos como instituciones, no ratas y slimes. Solo datos: la lógica
 * (turnos, intents, statuses) vive en src/core/. La sátira vive en los
 * nombres de los movimientos y el flavor.
 */

import type { EnemyDef } from '../../core/types';

export const APRENDIZ_EXPLOTADO: EnemyDef = {
  id: 'aprendiz_explotado',
  name: 'Aprendiz Explotado',
  hp: [16, 20],
  patron: 'aleatorio',
  flavor: 'Lleva catorce años siendo «el nuevo». El Gremio le paga en experiencia.',
  moves: [
    {
      id: 'horas_extra',
      name: 'Horas Extra (pago en exposición)',
      intent: 'attack',
      effects: [{ kind: 'attack', amount: 5 }],
    },
    {
      id: 'colapso_por_agotamiento',
      name: 'Colapso por Agotamiento',
      intent: 'attack',
      effects: [
        { kind: 'attack', amount: 7 },
        { kind: 'selfDamage', amount: 2 },
      ],
    },
  ],
};

export const GOLEM_LATON_DEFECTUOSO: EnemyDef = {
  id: 'golem_laton_defectuoso',
  name: 'Gólem de Latón Defectuoso',
  hp: [40, 46],
  patron: 'secuencial',
  flavor: 'Salió de fábrica con tres tornillos de menos. Nadie firmó el acta de entrega.',
  moves: [
    {
      id: 'prensazo_certificado',
      name: 'Prensazo (certificado por el Gremio)',
      intent: 'attack',
      effects: [{ kind: 'attack', amount: 12 }],
    },
    {
      id: 'remache_a_traicion',
      name: 'Remache a Traición',
      intent: 'attack',
      effects: [{ kind: 'attack', amount: 10 }],
    },
    {
      id: 'control_de_calidad_pendiente',
      name: 'Control de Calidad Pendiente',
      intent: 'unknown',
      effects: [{ kind: 'selfDamage', amount: 6 }],
    },
  ],
};

export const RECAUDADOR: EnemyDef = {
  id: 'recaudador',
  name: 'El Recaudador',
  hp: [32, 38],
  patron: 'secuencial',
  flavor: 'No es personal. Es interés compuesto.',
  moves: [
    {
      id: 'embargo_preventivo',
      name: 'Embargo Preventivo',
      intent: 'attack',
      effects: [{ kind: 'attack', amount: 8 }],
    },
    {
      id: 'interes_compuesto',
      name: 'Interés Compuesto',
      intent: 'buff',
      effects: [{ kind: 'applyStatus', status: 'strength', stacks: 2, to: 'self' }],
    },
  ],
};

export const INQUISIDOR_PATENTES: EnemyDef = {
  id: 'inquisidor_patentes',
  name: 'Inquisidor de Patentes',
  hp: [28, 34],
  patron: 'secuencial',
  flavor: 'Todo lo que construyas ya lo inventó el Gremio. Retroactivamente.',
  moves: [
    {
      id: 'auditoria_sorpresa',
      name: 'Auditoría Sorpresa',
      intent: 'debuff',
      effects: [{ kind: 'applyStatus', status: 'vulnerable', stacks: 2, to: 'player' }],
    },
    {
      id: 'multa_retroactiva',
      name: 'Multa Retroactiva',
      intent: 'attack',
      effects: [{ kind: 'attack', amount: 7 }],
    },
    {
      id: 'cese_y_desista',
      name: 'Carta de Cese y Desista',
      intent: 'attack',
      effects: [
        { kind: 'attack', amount: 5 },
        { kind: 'applyStatus', status: 'weak', stacks: 1, to: 'player' },
      ],
    },
  ],
};

/** Bestiario completo del Acto 1 para registrar de una vez. */
export const GREMIO_ENEMIES: EnemyDef[] = [
  APRENDIZ_EXPLOTADO,
  GOLEM_LATON_DEFECTUOSO,
  RECAUDADOR,
  INQUISIDOR_PATENTES,
];
