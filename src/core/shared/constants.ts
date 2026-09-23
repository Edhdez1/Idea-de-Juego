/**
 * Constantes de reglas compartidas (heredadas de la alfa de cartas y
 * reutilizadas por el motor táctico). Sin dependencias.
 */

export type StatusId = 'vulnerable' | 'weak' | 'poison' | 'strength';

/** Presión de Vapor del campo: 0..PRESSURE_MAX. */
export const PRESSURE_MAX = 10;
/** A partir de aquí, las habilidades de vapor pegan más. */
export const PRESSURE_SWEET_SPOT = 4;
export const PRESSURE_DAMAGE_BONUS = 1.25;
/** Sobrecarga: daño a TODAS las unidades del tablero. */
export const OVERLOAD_DAMAGE = 8;

export const WEAK_MULTIPLIER = 0.75;
export const VULNERABLE_MULTIPLIER = 1.5;

/** Sobremarcha (ex Overclock): Presión añadida antes de resolver. */
export const OVERCLOCK_PRESSURE = 2;
/** Daño mínimo de una explosión de Prototipo. */
export const FUSE_EXPLOSION_MIN = 6;

// ---------- Táctico ----------

/** Reloj de Vapor: una entrada actúa al llegar a CT_READY. */
export const CT_READY = 100;
/** CT residual al terminar turno sin mover / sin actuar (premia Esperar). */
export const CT_WAIT_BONUS = 20;
/** Velocidad del reloj del Coso (pitidos). */
export const COSO_CLOCK_SPEED = 10;
export const BRIO_MAX = 5;
/** Daño de choque al ser empujado contra algo. */
export const COLLISION_DAMAGE = 3;
/** Daño por nivel de caída por encima del primero. */
export const FALL_DAMAGE_PER_LEVEL = 3;
/** Bonus/malus de daño por nivel de altura (±, tope ±3 niveles). */
export const HEIGHT_DAMAGE_PER_LEVEL = 0.1;
export const FLANK_MULTIPLIER = 1.25;
export const BACK_MULTIPLIER = 1.5;
/** Tope de activaciones seguidas sin volver al jugador (guardarraíl). */
export const MAX_ACTIVATIONS_PER_WAIT = 500;
