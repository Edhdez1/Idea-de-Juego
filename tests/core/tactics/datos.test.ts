import { describe, expect, it } from 'vitest';
import { createBattle } from '../../../src/core/tactics/battle';
import { ERA_TERRAIN } from '../../../src/core/tactics/goteras';
import { reachable } from '../../../src/core/tactics/queries';
import { BATTLES, HEROES, HERO_UNITS, PROTOTYPES, SKILLS, TACTICS_REGISTRY as R, TERRAINS, UNITS } from '../../../src/data/tactico';
import { autoBattle } from './autobattle';

describe('datos tácticos: coherencia', () => {
  it('ids únicos y referencias válidas', () => {
    for (const list of [UNITS, SKILLS, PROTOTYPES, TERRAINS]) {
      const ids = list.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    for (const u of UNITS) {
      expect(u.skills.length, u.id).toBeGreaterThan(0);
      for (const sk of u.skills) expect(() => R.skill(sk), `${u.id} → ${sk}`).not.toThrow();
      expect(R.skill(u.skills[0]!).cost, `${u.id}: el básico cuesta 0`).toBe(0);
    }
    for (const s of SKILLS)
      for (const e of s.effects) if (e.kind === 'placePrototype') expect(() => R.prototype(e.prototypeId)).not.toThrow();
    for (const t of Object.values(ERA_TERRAIN)) expect(() => R.terrain(t)).not.toThrow();
  });

  it('el roster de héroes está en orden y existe', () => {
    expect(HEROES).toEqual(['ingeniera', 'clerigo', 'historiadora', 'reparador']);
    expect(HERO_UNITS.map((u) => u.id)).toEqual(HEROES);
  });

  it('las habilidades heredadas de las cartas usan su arte como icono', () => {
    for (const id of ['golpe_de_llave', 'motor_a_presion', 'valvula_de_escape', 'prototipo_inestable', 'pistola_de_remaches', 'plancha_remachada', 'turbina_de_taller']) {
      expect(R.skill(id).icon).toBe(`card_${id}`);
    }
    expect(R.skill('motor_a_presion')).toMatchObject({ steam: true, overclock: true });
    expect(R.prototype('prototipo_inestable').fuse).toBe(3);
    expect(R.prototype('desmontadora').onExplode).toBe('defeat');
    expect(R.unit('cobrador_cuotas').sprite).toBe('recaudador');
  });

  for (const def of Object.values(BATTLES)) {
    it(`${def.id}: se construye con uno y con todos los héroes y declara ambiente`, () => {
      expect(def.ambiente.parallax).toBe('parallax_piramide');
      expect(def.ambiente.emitters.length + def.ambiente.props.length).toBeGreaterThan(0);
      for (const roster of [['ingeniera'], HEROES.slice(0, def.deploy.length)]) {
        const { state } = createBattle(def, { roster: roster.map((defId) => ({ defId })), seed: 1, registry: R });
        expect(state.phase).toBe('awaitingPlayer');
        expect(state.turn).not.toBeNull();
      }
    });
  }
});

describe('batallas jugables', () => {
  it('prueba_smoke: la Ingeniera empieza y llega a pegar al enemigo', () => {
    const { state } = createBattle(BATTLES.prueba_smoke!, { roster: [{ defId: 'ingeniera' }], seed: 1, registry: R });
    expect(state.turn!.unitId).toBe('ingeniera');
    const enemy = state.units.find((u) => u.team === 'enemy')!;
    const adj = reachable(state, 'ingeniera', R).some((t) => Math.abs(t.pos.x - enemy.pos.x) + Math.abs(t.pos.y - enemy.pos.y) === 1);
    expect(adj).toBe(true);
    expect(autoBattle(BATTLES.prueba_smoke!, ['ingeniera'], 1).state.phase).toBe('victory');
  });

  it('B0 «Taller Embargado»: se gana con una partida automática (solo la Ingeniera y con los cuatro)', () => {
    const solo = autoBattle(BATTLES.prologo_taller!, ['ingeniera'], 1);
    expect(solo.state.phase).toBe('victory');
    expect(solo.state.units.find((u) => u.id === 'ingeniera')!.pos).toEqual({ x: 7, y: 0 });
    expect(autoBattle(BATTLES.prologo_taller!, HEROES, 1).state.phase).toBe('victory');
  });

  it('B0 dispara el diálogo de inicio y tiene una Gotera y respiraderos', () => {
    const { events, state } = createBattle(BATTLES.prologo_taller!, { roster: [{ defId: 'ingeniera' }], seed: 1, registry: R });
    expect(events).toContainEqual({ type: 'Dialogue', script: 'b0_inicio' });
    expect(state.goteras).toHaveLength(1);
    expect(state.board.tiles.some((t) => t.terrain === 'respiradero')).toBe(true);
  });
});
