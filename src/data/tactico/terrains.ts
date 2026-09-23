/**
 * Terrenos del tablero táctico. Solo datos: las reglas viven en src/core/tactics.
 * Los cuatro terrenos de era (paja, respiradero, antigravedad, neón) son los
 * que materializan las Goteras (ver ERA_TERRAIN en core/tactics/goteras.ts).
 */

import type { TerrainDef } from '../../core/tactics/types';

export const TERRAINS: TerrainDef[] = [
  { id: 'losa', name: 'Losa del Taller', moveCost: 1, color: 0x6e6a64 },
  { id: 'tarima', name: 'Tarima Crujiente', moveCost: 1, color: 0x8a6440 },
  { id: 'chatarra', name: 'Chatarra Embargada', moveCost: 2, color: 0x5a4a3a },
  { id: 'muro', name: 'Pared Maestra (no tocar, es de carga)', moveCost: Infinity, color: 0x3a3230 },
  {
    id: 'canal',
    name: 'Canal de Desagüe',
    moveCost: Infinity,
    pushedInto: 'removeFromBattle',
    color: 0x2e5a7a,
    animated: true,
  },
  { id: 'puerta', name: 'Puerta del Taller', moveCost: 1, color: 0xb08a3a },
  // ---- Terrenos de era (Goteras) ----
  { id: 'paja', name: 'Paja Medieval', moveCost: 1, cushionsFall: true, era: 'medieval', color: 0xc8a850 },
  {
    id: 'respiradero',
    name: 'Respiradero de Vapor',
    moveCost: 1,
    onTurnStart: { damage: 2, pressure: 1 },
    era: 'steampunk',
    color: 0x9a5a3a,
    animated: true,
  },
  { id: 'antigravedad', name: 'Placa Antigravedad', moveCost: 1, jumpBonus: 2, era: 'futurista', color: 0x7ab8d8, animated: true },
  {
    id: 'neon',
    name: 'Charco de Neón',
    moveCost: 1,
    onTurnStart: { status: { id: 'vulnerable', stacks: 2 } },
    era: 'cyberpunk',
    color: 0xd84aa8,
    animated: true,
  },
];
