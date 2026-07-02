/**
 * Encuentros del Acto 1 (el Gremio) y mazo inicial de la Ingeniera.
 * Solo datos: sin Phaser (test de arquitectura) y sin lógica.
 */

export interface EncounterDef {
  id: string;
  name: string;
  /** Ids de EnemyDef en orden de slots (izquierda a derecha). */
  enemies: string[];
}

export const ACTO1_ENCOUNTERS: EncounterDef[] = [
  {
    id: 'taller_embargado',
    name: 'El Taller Embargado',
    enemies: ['aprendiz_explotado', 'golem_laton_defectuoso'],
  },
  {
    id: 'visita_del_recaudador',
    name: 'Visita del Recaudador',
    enemies: ['recaudador'],
  },
  {
    id: 'auditoria_sorpresa',
    name: 'Auditoría Sorpresa',
    enemies: ['inquisidor_patentes', 'aprendiz_explotado'],
  },
];

/** 12 cartas: 5 golpes, 4 planchas y una de cada especial. */
export const MAZO_INICIAL_INGENIERA: string[] = [
  ...Array<string>(5).fill('golpe_de_llave'),
  ...Array<string>(4).fill('plancha_remachada'),
  'motor_a_presion',
  'pistola_de_remaches',
  'valvula_de_escape',
];
