// STUB del contrato: el agente del motor lo implementa. Todas son funciones puras.
import type { AiPlan, BattleState, DamagePreview, Pos, ReachTile, TacticsRegistry, Team, Tile, TimelineRef, UnitState } from './types';

const nope = (n: string): never => {
  throw new Error(`${n}: sin implementar`);
};

/** Casillas alcanzables por la unidad (incluye su casilla actual con cost 0). */
export function reachable(_s: BattleState, _unitId: string, _r: TacticsRegistry): ReachTile[] { return nope('reachable'); }
/** Casillas objetivo válidas para la habilidad desde la posición actual de la unidad. */
export function validTargets(_s: BattleState, _unitId: string, _skillId: string, _r: TacticsRegistry): Pos[] { return nope('validTargets'); }
/** Casillas afectadas si se usa la habilidad sobre `target`. */
export function areaOf(_s: BattleState, _unitId: string, _skillId: string, _target: Pos, _r: TacticsRegistry): Pos[] { return nope('areaOf'); }
/** Daño previsto (con desglose) sobre cada unidad del área. */
export function previewDamage(_s: BattleState, _unitId: string, _skillId: string, _target: Pos, _r: TacticsRegistry, _overclock?: boolean): DamagePreview[] { return nope('previewDamage'); }
/** Próximas n activaciones del Reloj de Vapor (unidades, mechas, pitidos). */
export function predictOrder(_s: BattleState, _n: number): TimelineRef[] { return nope('predictOrder'); }
/** Lo que haría la IA de esa unidad si nada cambia. */
export function forecast(_s: BattleState, _unitId: string, _r: TacticsRegistry): AiPlan | null { return nope('forecast'); }
/** Casillas que dañarán a `team` antes de su próximo turno (explosiones, Sobrecarga telegrafiada). */
export function dangerZone(_s: BattleState, _team: Team, _r: TacticsRegistry): Pos[] { return nope('dangerZone'); }
export function unitAt(_s: BattleState, _p: Pos): UnitState | undefined { return nope('unitAt'); }
export function tileAt(_s: BattleState, _p: Pos): Tile | undefined { return nope('tileAt'); }
/** Unidad del jugador cuyo turno está en curso. */
export function activeUnit(_s: BattleState): UnitState | undefined { return nope('activeUnit'); }
