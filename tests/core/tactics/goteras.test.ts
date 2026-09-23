import { describe, expect, it } from 'vitest';
import type { BattleState, TacticalEvent } from '../../../src/core/tactics/types';
import { act, mkDef, ofType, start, unit } from './helpers';

function waitBeeps(s: BattleState, beeps: number) {
  const all: TacticalEvent[] = [];
  let st = s;
  while (st.beeps < beeps && st.phase === 'awaitingPlayer') {
    const r = act(st, { type: 'WAIT', facing: 'SE' });
    st = r.state;
    all.push(...r.events);
  }
  return { state: st, events: all };
}

describe('Goteras', () => {
  it('avisan un pitido antes y cambian de era cada everyBeeps pitidos', () => {
    const s = start(mkDef({ goteras: [{ pos: { x: 3, y: 3 }, cycle: ['medieval', 'steampunk'], everyBeeps: 2 }] })).state;
    expect(s.board.tiles[3 * 6 + 3]!.terrain).toBe('paja');
    const { state, events } = waitBeeps(s, 4);
    // Secuencia de eventos del Coso y la Gotera, en orden.
    const seq = events
      .filter((e) => e.type === 'CosoBeeped' || e.type === 'GoteraWarned' || e.type === 'GoteraShifted')
      .map((e) => (e.type === 'CosoBeeped' ? `pitido${e.beeps}` : e.type === 'GoteraWarned' ? `aviso:${e.next}` : `cambio:${e.from}>${e.to}`));
    expect(seq).toEqual([
      'pitido1',
      'aviso:steampunk',
      'pitido2',
      'cambio:medieval>steampunk',
      'pitido3',
      'aviso:medieval',
      'pitido4',
      'cambio:steampunk>medieval',
    ]);
    expect(state.board.tiles[3 * 6 + 3]!.terrain).toBe('paja');
    expect(ofType(events, 'GoteraShifted')[0]).toEqual({
      type: 'GoteraShifted',
      pos: { x: 3, y: 3 },
      from: 'medieval',
      to: 'steampunk',
      terrain: 'respiradero',
    });
  });

  it('con everyBeeps 1 el primer aviso sale al crear la batalla', () => {
    const { events } = start(mkDef({ goteras: [{ pos: { x: 3, y: 3 }, cycle: ['futurista', 'cyberpunk'], everyBeeps: 1 }] }));
    expect(ofType(events, 'GoteraWarned')).toEqual([{ type: 'GoteraWarned', pos: { x: 3, y: 3 }, next: 'cyberpunk' }]);
  });

  it('el terreno nuevo tiene efecto: el respiradero daña y sube la Presión al empezar turno', () => {
    const s = start(mkDef({ goteras: [{ pos: { x: 0, y: 0 }, cycle: ['medieval', 'steampunk'], everyBeeps: 1 }] })).state;
    const { state, events } = waitBeeps(s, 1);
    // Tras el pitido 1 la casilla del Probador es un respiradero; en su siguiente turno le afecta.
    const r = state.board.tiles[0]!.terrain === 'respiradero' ? act(state, { type: 'WAIT', facing: 'SE' }) : { state, events: [] };
    const all = [...events, ...r.events];
    const terr = ofType(all, 'Damaged').filter((d) => d.source === 'terrain');
    expect(terr.length).toBeGreaterThan(0);
    expect(terr[0]!.amount).toBe(2);
    expect(ofType(all, 'PressureChanged').length).toBeGreaterThan(0);
  });

  it('el neón vuelve vulnerable a quien empieza turno encima', () => {
    const s = start(mkDef({ terrain: ['nlllll', 'llllll', 'llllll', 'llllll', 'llllll', 'llllll'] }));
    const vul = ofType(s.events, 'StatusApplied');
    expect(vul).toEqual([{ type: 'StatusApplied', unitId: 'probador', status: 'vulnerable', stacks: 2 }]);
    expect(unit(s.state, 'probador').statuses.vulnerable).toBe(2);
    // Decae 1 al terminar su turno.
    const r = act(s.state, { type: 'MOVE', to: { x: 1, y: 0 } });
    const w = act(r.state, { type: 'WAIT', facing: 'SE' });
    expect(ofType(w.events, 'StatusTicked')[0]).toEqual({ type: 'StatusTicked', unitId: 'probador', status: 'vulnerable', stacks: 1 });
  });
});
