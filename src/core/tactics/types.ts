/**
 * Tipos del motor táctico (RPG táctico político, tablero isométrico con alturas).
 *
 * CONTRATO entre el motor de reglas y la capa visual: la UI solo lee
 * BattleState, envía TacticalIntent y anima TacticalEvent[]. Nada de este
 * módulo importa Phaser (tests/core/architecture.test.ts lo vigila).
 *
 * Coordenadas: x crece hacia abajo-derecha (SE) y y hacia abajo-izquierda (SW)
 * en pantalla. El tablero es fila a fila: índice = y * w + x.
 */

import type { RngState } from '../rng';
import type { StatusId } from '../shared/constants';

export type { StatusId };

export interface Pos {
  x: number;
  y: number;
}

/** Orientaciones en el tablero isométrico. +x = SE, -x = NW, +y = SW, -y = NE. */
export type Dir = 'NE' | 'SE' | 'SW' | 'NW';

export type Team = 'player' | 'ally' | 'enemy' | 'third';

export type Era = 'medieval' | 'steampunk' | 'futurista' | 'cyberpunk';

// ---------- Tablero ----------

export interface TerrainDef {
  id: string;
  name: string;
  /** Coste de entrar en la casilla; Infinity = impasable. */
  moveCost: number;
  /** Efecto al empezar el turno de una unidad encima. */
  onTurnStart?: { damage?: number; pressure?: number; status?: { id: StatusId; stacks: number } };
  /** Salto extra de quien empieza su movimiento encima (antigravedad). */
  jumpBonus?: number;
  /** Anula el daño por caída al aterrizar encima (paja). */
  cushionsFall?: boolean;
  /** Empujar a alguien aquí lo saca de la batalla (canal): «baja administrativa». */
  pushedInto?: 'removeFromBattle';
  /** La casilla es de una era (Gotera). */
  era?: Era;
  /** Color de placeholder (0xRRGGBB) mientras no haya arte. */
  color: number;
  /** La loseta tiene animación (agua, vapor...). */
  animated?: boolean;
}

export interface Tile {
  /** Altura en niveles (0..6). */
  h: number;
  terrain: string;
  /** Casilla interactuable: 'valvula' | 'archivador' | 'puerta' ... */
  interact?: string;
}

export interface Board {
  w: number;
  h: number;
  /** Fila a fila: tiles[y * w + x]. */
  tiles: Tile[];
}

// ---------- Unidades y habilidades ----------

export type AiProfile = 'agresivo' | 'cobarde' | 'guardian' | 'kamikaze' | 'jefe' | 'inmovil';

export interface UnitDef {
  id: string;
  name: string;
  hp: number;
  atk: number;
  def: number;
  /** Carga del Reloj de Vapor por tick (más = actúa más a menudo). */
  speed: number;
  move: number;
  jump: number;
  /** Ids de habilidades; la primera es el ataque básico (coste 0). */
  skills: string[];
  ai?: AiProfile;
  /** Clave de textura/animaciones (manifiesto de assets). */
  sprite: string;
  /** Hablante para barks/diálogo (registro de hablantes). */
  speaker?: string;
  traits?: string[];
  immunities?: 'push'[];
}

export interface UnitState {
  /** Id único en la batalla (p.ej. 'ingeniera', 'aprendiz_explotado#2'). */
  id: string;
  defId: string;
  team: Team;
  pos: Pos;
  facing: Dir;
  hp: number;
  maxHp: number;
  /** Blindaje: absorbe daño; caduca al empezar el siguiente turno propio. */
  block: number;
  /** Recurso de habilidades (máx. BRIO_MAX); +1 al empezar cada turno propio. */
  brio: number;
  statuses: Partial<Record<StatusId, number>>;
  ko: boolean;
  /** Retirado de la batalla por un canal (no cuenta como KO para la IA). */
  removed?: boolean;
}

export type AreaShape = 'single' | 'cross' | 'diamond' | 'line';

export type TacticalEffect =
  | { kind: 'damage'; power: number; times?: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'block'; amount: number }
  | { kind: 'status'; status: StatusId; stacks: number }
  | { kind: 'push'; distance: number }
  | { kind: 'pressure'; amount: number }
  /** Válvula: baja la Presión a 0 y da blindaje por punto purgado. */
  | { kind: 'vent'; blockPerPoint: number }
  | { kind: 'placePrototype'; prototypeId: string }
  /** Retrasa el turno del objetivo (resta CT). */
  | { kind: 'delay'; ct: number };

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  flavor?: string;
  /** Coste en brío (0 = ataque básico). */
  cost: number;
  /** Le afecta la caldera: ×PRESSURE_DAMAGE_BONUS con Presión ≥ PRESSURE_SWEET_SPOT. */
  steam?: boolean;
  /** Admite Sobremarcha (ex Overclock): +2 Presión antes, efectos numéricos ×2. */
  overclock?: boolean;
  range: { min: number; max: number; maxDh?: number; highGroundBonus?: boolean };
  area: { shape: AreaShape; radius: number };
  target: 'hostile' | 'friendly' | 'tile' | 'self';
  effects: TacticalEffect[];
  /** Clave de icono (arte de cartas reutilizado). */
  icon?: string;
}

export interface PrototypeDef {
  id: string;
  name: string;
  /** Activaciones antes de explotar. */
  fuse: number;
  speed: number;
  area: { shape: AreaShape; radius: number };
  damage: number;
  pressure: number;
  /** Las explosiones empujan hacia fuera 1 casilla. */
  pushOut: boolean;
  /** Si explota, la batalla se pierde (la Desmontadora del Gran Maestre). */
  onExplode?: 'defeat';
  sprite: string;
}

export interface PrototypeState {
  id: string;
  defId: string;
  pos: Pos;
  owner: string;
  remaining: number;
}

export interface GoteraDef {
  pos: Pos;
  /** Ciclo de eras; cada `everyBeeps` pitidos avanza una. */
  cycle: Era[];
  everyBeeps: number;
}

export interface GoteraState extends GoteraDef {
  index: number;
}

// ---------- Reloj de Vapor (CTB) ----------

export type TimelineRef =
  | { kind: 'unit'; id: string }
  | { kind: 'prototype'; id: string }
  | { kind: 'clock'; id: 'coso' };

export interface TimelineEntry {
  ref: TimelineRef;
  ct: number;
  speed: number;
}

// ---------- Batallas ----------

export type Objective =
  | { kind: 'rout' }
  | { kind: 'defeat'; unitIds: string[] }
  | { kind: 'survive'; beeps: number }
  | { kind: 'reach'; tiles: Pos[] }
  | { kind: 'interact'; tile: Pos };

export type DefeatCondition =
  | { kind: 'partyWiped' }
  | { kind: 'unitDown'; unitId: string }
  | { kind: 'beepLimit'; beeps: number };

export type TriggerWhen =
  | { kind: 'start' }
  | { kind: 'hpBelow'; unitId: string; pct: number }
  | { kind: 'beep'; n: number };

export interface BattleTrigger {
  when: TriggerWhen;
  /** Id de guion de diálogo que la UI reproduce. */
  script: string;
}

/** Ambiente visual declarado por la batalla (pilar «Mundo vivo»). */
export interface Ambiente {
  emitters: { kind: 'vapor' | 'chispas' | 'polvo' | 'hollin'; at?: Pos; rate?: number }[];
  props: { sprite: string; pos: Pos; animated: boolean }[];
  parallax: string;
}

export interface BattleDef {
  id: string;
  name: string;
  /** Alturas por fila: un dígito 0-6 por casilla. */
  heights: string[];
  /** Terreno por fila: un carácter por casilla, resuelto con `legend`. */
  terrain: string[];
  legend: Record<string, string>;
  interactables?: { pos: Pos; id: string }[];
  goteras?: GoteraDef[];
  /** Casillas de despliegue del grupo del jugador (en orden del roster). */
  deploy: Pos[];
  units: { defId: string; team: Team; pos: Pos; facing: Dir; id?: string }[];
  prototypes?: { defId: string; pos: Pos }[];
  objectives: Objective[];
  defeat: DefeatCondition[];
  triggers?: BattleTrigger[];
  ambiente: Ambiente;
  music?: string;
}

export interface BattleState {
  id: string;
  board: Board;
  units: UnitState[];
  prototypes: PrototypeState[];
  goteras: GoteraState[];
  timeline: TimelineEntry[];
  /** Turno en curso de una unidad del jugador (null si la batalla terminó). */
  turn: { unitId: string; moved: boolean; acted: boolean; origin: Pos; originFacing: Dir } | null;
  pressure: number;
  beeps: number;
  activations: number;
  phase: 'awaitingPlayer' | 'victory' | 'defeat';
  objectives: Objective[];
  defeat: DefeatCondition[];
  triggers: BattleTrigger[];
  firedTriggers: number[];
  /** Interactuables usados. */
  interacted: string[];
  campaignFlags: string[];
  rng: RngState;
  nextId: number;
}

// ---------- Intents (UI → motor) ----------

export type TacticalIntent =
  | { type: 'MOVE'; to: Pos }
  | { type: 'UNDO_MOVE' }
  | { type: 'ACT'; skillId: string; target: Pos; overclock?: boolean }
  | { type: 'INTERACT'; tile: Pos }
  /** Cierra el turno; el motor resuelve IA, mechas y reloj hasta el próximo turno del jugador. */
  | { type: 'WAIT'; facing: Dir };

// ---------- Eventos (motor → UI) ----------

export interface DamageMod {
  label: string;
  /** Multiplicador (o suma si `add`). */
  value: number;
  add?: boolean;
}

export type DamageSource = 'attack' | 'overload' | 'explosion' | 'poison' | 'fall' | 'collision' | 'terrain';

export type TacticalEvent =
  | { type: 'TurnStarted'; ref: TimelineRef }
  | { type: 'UnitMoved'; unitId: string; path: Pos[] }
  | { type: 'MoveUndone'; unitId: string; to: Pos }
  | { type: 'Faced'; unitId: string; dir: Dir }
  | { type: 'SkillUsed'; unitId: string; skillId: string; target: Pos; area: Pos[]; overclock: boolean }
  | { type: 'Damaged'; unitId: string; amount: number; blocked: number; source: DamageSource; breakdown?: DamageMod[] }
  | { type: 'Healed'; unitId: string; amount: number }
  | { type: 'BlockGained'; unitId: string; amount: number }
  | { type: 'StatusApplied'; unitId: string; status: StatusId; stacks: number }
  | { type: 'StatusTicked'; unitId: string; status: StatusId; stacks: number }
  | { type: 'Pushed'; unitId: string; from: Pos; to: Pos; hit?: 'wall' | 'unit' | 'edge'; otherId?: string }
  | { type: 'Fell'; unitId: string; levels: number }
  | { type: 'UnitKO'; unitId: string }
  | { type: 'UnitRemoved'; unitId: string }
  | { type: 'BrioChanged'; unitId: string; brio: number }
  | { type: 'PressureChanged'; from: number; to: number }
  | { type: 'Overload'; damage: number; hit: string[] }
  | { type: 'PrototypePlaced'; id: string; defId: string; pos: Pos; fuse: number }
  | { type: 'FuseTicked'; id: string; remaining: number }
  | { type: 'PrototypeExploded'; id: string; pos: Pos; area: Pos[] }
  | { type: 'PrototypePushed'; id: string; from: Pos; to: Pos }
  | { type: 'GoteraWarned'; pos: Pos; next: Era }
  | { type: 'GoteraShifted'; pos: Pos; from: Era; to: Era; terrain: string }
  | { type: 'CosoBeeped'; beeps: number }
  | { type: 'Interacted'; unitId: string; tile: Pos; id: string }
  | { type: 'Dialogue'; script: string }
  | { type: 'ObjectiveMet'; index: number }
  | { type: 'BattleEnded'; result: 'victory' | 'defeat' };

// ---------- Consultas ----------

export interface ReachTile {
  pos: Pos;
  cost: number;
  path: Pos[];
}

export interface DamagePreview {
  unitId: string;
  amount: number;
  blocked: number;
  breakdown: DamageMod[];
  ko: boolean;
}

/** Lo que haría la IA de una unidad «si nada cambia». */
export interface AiPlan {
  unitId: string;
  moveTo: Pos;
  skillId: string | null;
  target: Pos | null;
  area: Pos[];
}

export interface TacticsRegistry {
  unit(id: string): UnitDef;
  skill(id: string): SkillDef;
  prototype(id: string): PrototypeDef;
  terrain(id: string): TerrainDef;
}

export interface RosterEntry {
  defId: string;
  /** Vida actual si viene herido de antes (por defecto: completa). */
  hp?: number;
}
