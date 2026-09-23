import type { PrototypeDef, SkillDef, TacticsRegistry, TerrainDef, UnitDef } from './types';

/** Construye el registro de definiciones (unidades, habilidades, prototipos, terrenos). */
export function makeTacticsRegistry(defs: {
  units: UnitDef[];
  skills: SkillDef[];
  prototypes: PrototypeDef[];
  terrains: TerrainDef[];
}): TacticsRegistry {
  const idx = <T extends { id: string }>(list: T[], kind: string) => {
    const map = new Map(list.map((d) => [d.id, d]));
    return (id: string): T => {
      const d = map.get(id);
      if (!d) throw new Error(`${kind} desconocido: ${id}`);
      return d;
    };
  };
  return {
    unit: idx(defs.units, 'Unidad'),
    skill: idx(defs.skills, 'Habilidad'),
    prototype: idx(defs.prototypes, 'Prototipo'),
    terrain: idx(defs.terrains, 'Terreno'),
  };
}
