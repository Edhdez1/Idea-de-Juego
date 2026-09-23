/**
 * Mapeo defId → key del sprite lateral APROBADO de 128 px (referencia
 * canónica; se muestra en el panel de unidad de la batalla).
 */
const SPRITE_KEYS: Record<string, string> = {
  ingeniera: 'ingeniera',
  aprendiz_explotado: 'aprendiz_explotado',
  golem_laton_defectuoso: 'golem_defectuoso',
  recaudador: 'recaudador',
  inquisidor_patentes: 'inquisidor_patentes',
  gran_maestre: 'gran_maestre',
  brayan: 'brayan',
};

export function spriteKeyDe(defId: string): string {
  return SPRITE_KEYS[defId] ?? defId;
}

export const SPRITE_FILES: { key: string; file: string }[] = [
  { key: 'ingeniera', file: 'assets/sprites/ingeniera.png' },
  { key: 'aprendiz_explotado', file: 'assets/sprites/aprendiz_explotado.png' },
  { key: 'golem_defectuoso', file: 'assets/sprites/golem_defectuoso.png' },
  { key: 'recaudador', file: 'assets/sprites/recaudador.png' },
  { key: 'inquisidor_patentes', file: 'assets/sprites/inquisidor_patentes.png' },
  { key: 'gran_maestre', file: 'assets/sprites/gran_maestre.png' },
  { key: 'brayan', file: 'assets/sprites/brayan.png' },
];

/** Paneles y retratos de la intro cinemática. */
export const INTRO_FILES: { key: string; file: string }[] = [
  { key: 'intro_1_amanecer', file: 'assets/intro/1_amanecer.webp' },
  { key: 'intro_2_cielo', file: 'assets/intro/2_cielo.webp' },
  { key: 'intro_3_crater', file: 'assets/intro/3_crater.webp' },
  { key: 'intro_4_facciones', file: 'assets/intro/4_facciones.webp' },
  { key: 'intro_5_goteras', file: 'assets/intro/5_goteras.webp' },
  { key: 'intro_6_heroes', file: 'assets/intro/6_heroes.webp' },
  { key: 'retrato_ingeniera', file: 'assets/intro/retrato_ingeniera.webp' },
  { key: 'retrato_clerigo', file: 'assets/intro/retrato_clerigo.webp' },
  { key: 'retrato_historiadora', file: 'assets/intro/retrato_historiadora.webp' },
  { key: 'retrato_reparador', file: 'assets/intro/retrato_reparador.webp' },
  { key: 'retrato_brayan', file: 'assets/intro/retrato_brayan.webp' },
];

/** Arte de las antiguas cartas, reutilizado como icono de habilidad (SkillDef.icon = card_<id>). */
export const CARD_ART_FILES: { key: string; file: string }[] = [
  'golpe_de_llave',
  'plancha_remachada',
  'motor_a_presion',
  'valvula_de_escape',
  'prototipo_inestable',
  'pistola_de_remaches',
  'turbina_de_taller',
].map((id) => ({ key: `card_${id}`, file: `assets/cards/${id}.png` }));
