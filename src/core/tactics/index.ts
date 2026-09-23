/**
 * API pública del motor táctico (contrato con la capa visual).
 *
 *   createBattle(def, opts) → { state, events }
 *   dispatch(state, intent, registry) → { state, events }   (lanza Error si el intent es inválido)
 *   Consultas puras: reachable, validTargets, areaOf, previewDamage,
 *   predictOrder, forecast, dangerZone, unitAt, tileAt.
 */

export * from './types';
export { makeTacticsRegistry } from './registry';
export { createBattle, dispatch } from './battle';
export {
  reachable,
  validTargets,
  areaOf,
  previewDamage,
  predictOrder,
  forecast,
  dangerZone,
  unitAt,
  tileAt,
  activeUnit,
} from './queries';
