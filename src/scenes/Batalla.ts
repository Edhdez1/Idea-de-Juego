import Phaser from 'phaser';
import type { BattleDef, BattleState, Board, Dir, Pos, SkillDef, TacticalEvent, TacticalIntent, UnitState } from '../core/tactics';
import { dur } from '../game/anim';
import { detenerMusica, musica, sonar } from '../game/audio';
import { batalla } from '../game/controladores/batalla';
import { asegurarPrototipo, generarPlaceholders } from '../game/placeholders';
import { conectarBatalla, marcarListo, MODO_TEST, registrarAviso, SEMILLA_TEST } from '../game/test-hooks';
import { lineasDeGuion, nombreCorto, NOMBRE_ERA } from '../game/textosBatalla';
import { DamageNumbers } from '../ui/fx/DamageNumbers';
import { EventQueue } from '../ui/fx/EventQueue';
import { CAPA, deltaDeDir, dirFromDelta } from '../ui/iso/proyeccion';
import { TableroIso } from '../ui/iso/TableroIso';
import { UnidadVista } from '../ui/iso/UnidadVista';
import { Ambiente } from '../ui/vivo/Ambiente';
import { esperar } from '../ui/vivo/tiempo';
import type { BatallaHUDScene, EntradaMenu } from './BatallaHUD';

export interface BatallaInit {
  battleId?: string;
  seed?: number;
  /** Reintento tras derrota: misma batalla, misma semilla. */
  reintento?: boolean;
}

type Modo = 'bloqueado' | 'menu' | 'habilidades' | 'mover' | 'objetivo' | 'interactuar' | 'orientar' | 'fin';

interface VistaProto {
  spr: Phaser.GameObjects.Sprite;
  txt: Phaser.GameObjects.Text;
  pos: Pos;
}

const PROFUNDIDAD_NUMEROS = 6000;
const DIRS: Dir[] = ['NE', 'SE', 'SW', 'NW'];
const NOMBRE_DIR: Record<Dir, string> = { NE: 'Noreste (arriba-dcha)', SE: 'Sureste (abajo-dcha)', SW: 'Suroeste (abajo-izq)', NW: 'Noroeste (arriba-izq)' };

const posEq = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;
const manhattan = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Escena de batalla táctica: tablero isométrico con alturas, unidades vivas,
 * ambiente animado y la cola de eventos que convierte cada TacticalEvent en
 * una animación. El motor ya resolvió todo al instante; aquí se dosifica.
 *
 * Entrada: clic/tap y teclado (flechas = cursor, Z = confirmar, X = cancelar,
 * C = Sobremarcha, WASD o arrastrar = cámara). La interfaz vive en BatallaHUD.
 */
export class BatallaScene extends Phaser.Scene {
  private init_: BatallaInit = {};
  private tablero!: TableroIso;
  private unidades = new Map<string, UnidadVista>();
  private protos = new Map<string, VistaProto>();
  private vida = new Map<string, { hp: number; block: number; max: number }>();
  private boardVis!: Board;
  private queue!: EventQueue<TacticalEvent>;
  private numeros!: DamageNumbers;
  private hud!: BatallaHUDScene;
  private modo: Modo = 'bloqueado';
  private cursor: Pos = { x: 0, y: 0 };
  private skill?: SkillDef;
  private sobremarcha = false;
  private objetivo?: Pos;
  private facingTmp: Dir = 'SE';
  private ultimoGolpe?: Dir;
  private arrastre?: { x: number; y: number; sx: number; sy: number; activo: boolean };
  private teclasCam?: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  constructor() {
    super('Batalla');
  }

  init(data: BatallaInit): void {
    this.init_ = data ?? {};
  }

  create(): void {
    this.unidades = new Map();
    this.protos = new Map();
    this.vida = new Map();
    this.modo = 'bloqueado';
    this.skill = undefined;
    this.objetivo = undefined;
    this.sobremarcha = false;
    marcarListo(false);

    const eventos = this.init_.reintento
      ? batalla.reintentar()
      : batalla.iniciar({ battleId: this.init_.battleId ?? 'prologo_taller', seed: this.init_.seed ?? SEMILLA_TEST });
    const s = batalla.getState();
    const def = batalla.def;
    batalla.onInvalid = (msg) => {
      registrarAviso(msg);
      this.hud?.aviso(msg);
    };

    this.add.rectangle(0, 0, 4000, 4000, 0x1a1017).setScrollFactor(0).setDepth(-20000);
    generarPlaceholders(this, {
      terrenos: [...new Set(s.board.tiles.map((t) => t.terrain))].map((id) => batalla.registry.terrain(id)),
    });
    this.boardVis = structuredClone(s.board);
    this.tablero = new TableroIso(this, this.boardVis, (id) => batalla.registry.terrain(id));
    // Se destruye solo al apagarse la escena.
    new Ambiente(this, def.ambiente, { suelo: this.tablero, semilla: 0xc050 });
    this.numeros = new DamageNumbers(this, PROFUNDIDAD_NUMEROS);
    this.crearUnidadesIniciales(def, s);
    this.pintarGoteras(s);

    const cam = this.cameras.main;
    const b = this.tablero.bounds(200);
    cam.setBounds(b.x, b.y, b.width, b.height);
    const b0 = this.tablero.bounds(0);
    cam.centerOn(b0.x + b0.width / 2, b0.y + b0.height / 2 + 10);

    this.queue = new EventQueue<TacticalEvent>(
      (ev) => this.animar(ev),
      () => this.alTerminarCola(),
    );

    this.configurarEntrada();
    musica(this, 'musica_combate', { volume: 0.4 });

    this.game.events.on('batalla:menu', this.alElegirMenu, this);
    this.game.events.on('batalla:resultado', this.alElegirResultado, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('batalla:menu', this.alElegirMenu, this);
      this.game.events.off('batalla:resultado', this.alElegirResultado, this);
      this.game.events.off('bhud:listo');
      detenerMusica();
      this.scene.stop('BatallaHUD');
    });

    conectarBatalla({ dispatch: (i) => this.enviar(i), autoTurn: () => this.auto() });

    // La interfaz va en escena aparte; se arranca la cola cuando está lista.
    this.game.events.once('bhud:listo', () => {
      this.hud = this.scene.get('BatallaHUD') as BatallaHUDScene;
      this.hud.refrescar(s, { presion: 0 });
      this.queue.encolar(eventos, true);
    });
    this.scene.launch('BatallaHUD');
  }

  override update(_t: number, delta: number): void {
    if (!this.teclasCam) return;
    const v = (delta / 1000) * 220;
    const cam = this.cameras.main;
    if (this.teclasCam.A.isDown) cam.scrollX -= v;
    if (this.teclasCam.D.isDown) cam.scrollX += v;
    if (this.teclasCam.W.isDown) cam.scrollY -= v;
    if (this.teclasCam.S.isDown) cam.scrollY += v;
  }

  // ---------- Montaje ----------

  /** Reconstruye la colocación inicial (antes de las primeras activaciones) para animarlas desde ahí. */
  private crearUnidadesIniciales(def: BattleDef, s: BattleState): void {
    const roster = batalla.datosInicio?.roster ?? [];
    const cuenta = new Map<string, number>();
    const inicial = new Map<string, { pos: Pos; facing?: Dir }>();
    const id = (defId: string) => {
      const n = (cuenta.get(defId) ?? 0) + 1;
      cuenta.set(defId, n);
      return n === 1 ? defId : `${defId}#${n}`;
    };
    roster.forEach((e, i) => {
      const p = def.deploy[i];
      if (p) inicial.set(id(e.defId), { pos: p });
    });
    for (const u of def.units) inicial.set(u.id ?? id(u.defId), { pos: u.pos, facing: u.facing });

    for (const u of s.units) {
      const ini = inicial.get(u.id);
      const pos = ini?.pos ?? u.pos;
      const esJugador = u.team === 'player';
      const facing = esJugador ? u.facing : (ini?.facing ?? u.facing);
      const hp = inicial.has(u.id) ? (esJugador ? u.hp : u.maxHp) : u.hp;
      this.crearVista(u, pos, facing, hp);
    }
  }

  private crearVista(u: UnitState, pos: Pos, facing: Dir, hp: number): UnidadVista {
    const r = batalla.registry;
    const def = r.unit(u.defId);
    const v = new UnidadVista(this, this.tablero, {
      id: u.id,
      sprite: def.sprite,
      team: u.team,
      nombre: nombreCorto(u, r),
      pos,
      facing,
      hp,
      maxHp: u.maxHp,
    });
    this.unidades.set(u.id, v);
    this.vida.set(u.id, { hp, block: 0, max: u.maxHp });
    return v;
  }

  private pintarGoteras(s: BattleState): void {
    if (s.goteras.length > 0) this.tablero.showOverlay('gotera', s.goteras.map((g) => g.pos));
  }

  // ---------- Sincronización con el estado final ----------

  /** Tras la cola, todo se ajusta al estado del motor (red de seguridad visual). */
  private sincronizar(): void {
    const s = batalla.getState();
    this.boardVis = structuredClone(s.board);
    this.tablero.actualizar(this.boardVis);
    for (const u of s.units) {
      let v = this.unidades.get(u.id);
      if (!v) v = this.crearVista(u, u.pos, u.facing, u.hp);
      if (!posEq(v.pos, u.pos)) v.setPos(u.pos);
      if (v.facing !== u.facing) v.setFacing(u.facing);
      void v.setHp(u.hp, u.maxHp, u.block);
      this.vida.set(u.id, { hp: u.hp, block: u.block, max: u.maxHp });
      v.setEstados(u.statuses);
      v.setActiva(s.turn?.unitId === u.id);
      if (u.removed) v.cont.setVisible(false);
      else if (u.ko && v.personaje.estadoActual !== 'ko') void v.ko();
    }
    // Prototipos
    const vivos = new Set(s.prototypes.map((p) => p.id));
    for (const [id, pv] of this.protos) {
      if (!vivos.has(id)) {
        pv.spr.destroy();
        pv.txt.destroy();
        this.protos.delete(id);
      }
    }
    for (const p of s.prototypes) {
      const pv = this.protos.get(p.id) ?? this.crearProto(p.id, p.defId, p.pos, p.remaining);
      if (!posEq(pv.pos, p.pos)) this.moverProto(pv, p.pos);
      pv.txt.setText(String(p.remaining));
    }
    this.tablero.clearOverlay('gotera');
    this.pintarGoteras(s);
  }

  private alTerminarCola(): void {
    const s = batalla.getState();
    this.sincronizar();
    this.hud.refrescar(s, { presion: s.pressure });
    this.tablero.clearOverlay('area');
    if (s.phase !== 'awaitingPlayer') {
      this.modo = 'fin';
      this.tablero.clearOverlays();
      this.pintarGoteras(s);
      this.hud.mostrarResultado(s.phase, batalla.def.id);
      marcarListo(true);
      return;
    }
    const u = this.activa();
    if (u) {
      this.cursor = { ...u.pos };
      this.enfocar(u.pos, true);
    }
    this.abrirMenu();
    marcarListo(true);
  }

  private activa(): UnitState | undefined {
    const s = batalla.getState();
    return s.turn ? s.units.find((u) => u.id === s.turn?.unitId) : undefined;
  }

  // ---------- Intents ----------

  private enviar(intent: TacticalIntent): void {
    const eventos = batalla.dispatch(intent);
    if (eventos.length === 0) {
      // Inválido: el aviso ya salió por onInvalid; se vuelve al menú.
      if (this.modo !== 'fin' && !this.queue.bloqueado) this.abrirMenu();
      return;
    }
    marcarListo(false);
    this.hud.ocultarMenu();
    this.hud.ocultarPrevision();
    this.hud.ayuda('');
    this.tablero.clearOverlay('move');
    this.tablero.clearOverlay('attack');
    this.tablero.clearOverlay('path');
    this.modo = 'bloqueado';
    this.queue.encolar(eventos, true);
  }

  private auto(): void {
    const eventos = batalla.autoTurno();
    if (eventos.length === 0) return;
    marcarListo(false);
    this.hud.ocultarMenu();
    this.hud.ocultarPrevision();
    this.hud.ayuda('');
    this.tablero.clearOverlays();
    this.modo = 'bloqueado';
    this.queue.encolar(eventos, true);
  }

  // ---------- Menús y modos ----------

  private abrirMenu(): void {
    const s = batalla.getState();
    const u = this.activa();
    if (!u || !s.turn) return;
    const r = batalla.registry;
    const def = r.unit(u.defId);
    this.modo = 'menu';
    this.skill = undefined;
    this.objetivo = undefined;
    this.sobremarcha = false;
    this.tablero.clearOverlay('move');
    this.tablero.clearOverlay('attack');
    this.tablero.clearOverlay('area');
    this.tablero.clearOverlay('path');
    this.pintarPeligro();
    this.hud.ocultarPrevision();
    this.hud.refrescar(s);
    const basica = def.skills[0];
    const entradas: EntradaMenu[] = [
      { id: 'mover', texto: 'Mover', habilitado: !s.turn.moved },
      ...(s.turn.moved && !s.turn.acted ? [{ id: 'deshacer', texto: 'Deshacer movimiento', habilitado: true }] : []),
      { id: `skill:${basica}`, texto: basica ? r.skill(basica).name.slice(0, 24) : 'Atacar', habilitado: !s.turn.acted && !!basica },
      { id: 'habilidades', texto: 'Habilidades ▸', habilitado: !s.turn.acted && def.skills.length > 1 },
      { id: 'interactuar', texto: 'Interactuar', habilitado: !s.turn.acted && this.interactuables(u).length > 0 },
      { id: 'esperar', texto: 'Esperar', habilitado: true },
      { id: 'auto', texto: 'Auto (IA)', habilitado: true },
    ];
    this.hud.mostrarMenu(`${nombreCorto(u, r).toUpperCase()} · BRÍO ${u.brio}`, entradas);
    this.hud.ayuda('Elige una acción · clic en una unidad para verla · arrastra o WASD para mover la cámara');
    this.tablero.setCursor(u.pos);
  }

  private abrirHabilidades(): void {
    const u = this.activa();
    if (!u) return;
    const r = batalla.registry;
    this.modo = 'habilidades';
    const skills = r.unit(u.defId).skills.slice(1);
    const entradas: EntradaMenu[] = skills.map((id) => {
      const sk = r.skill(id);
      return { id: `skill:${id}`, texto: `${sk.name.slice(0, 17)}${sk.overclock ? '*' : ''}`, habilitado: sk.cost <= u.brio, extra: `${sk.cost}` };
    });
    entradas.push({ id: 'volver', texto: '‹ Volver', habilitado: true });
    this.hud.mostrarMenu(`HABILIDADES · BRÍO ${u.brio}  (* Sobremarcha)`, entradas);
    this.hud.ayuda('El número es el coste en brío');
  }

  private entrarMover(): void {
    const u = this.activa();
    if (!u) return;
    this.modo = 'mover';
    const destinos = batalla.reachable(u.id).filter((t) => !posEq(t.pos, u.pos));
    this.tablero.showOverlay('move', destinos.map((t) => t.pos));
    this.hud.mostrarMenu('MOVER', [{ id: 'volver', texto: '‹ Cancelar', habilitado: true }]);
    this.hud.ayuda('Clic en una casilla azul (o flechas + Z) · X: cancelar');
  }

  private entrarObjetivo(skillId: string): void {
    const u = this.activa();
    if (!u) return;
    const sk = batalla.registry.skill(skillId);
    this.modo = 'objetivo';
    this.skill = sk;
    this.objetivo = undefined;
    const validos = batalla.validTargets(u.id, skillId);
    this.tablero.clearOverlay('move');
    this.tablero.showOverlay('attack', validos);
    if (validos.length === 1 && validos[0]) this.elegirObjetivo(validos[0]);
    else this.menuObjetivo();
    this.hud.ayuda(
      validos.length === 0
        ? 'No hay objetivos al alcance desde aquí · X: volver'
        : `Elige objetivo (rojo) · clic otra vez o Z: confirmar${sk.overclock ? ' · C: Sobremarcha' : ''} · X: cancelar`,
    );
  }

  private menuObjetivo(): void {
    const sk = this.skill;
    if (!sk) return;
    const entradas: EntradaMenu[] = [{ id: 'confirmar', texto: 'Confirmar', habilitado: !!this.objetivo }];
    if (sk.overclock) entradas.push({ id: 'sobremarcha', texto: `Sobremarcha: ${this.sobremarcha ? 'SÍ' : 'NO'}`, habilitado: true, extra: '+2 P' });
    entradas.push({ id: 'volver', texto: '‹ Cancelar', habilitado: true });
    this.hud.mostrarMenu(`${sk.name.toUpperCase().slice(0, 18)} · ${sk.cost} BRÍO`, entradas);
  }

  private elegirObjetivo(p: Pos): void {
    const u = this.activa();
    const sk = this.skill;
    if (!u || !sk) return;
    this.objetivo = { ...p };
    this.cursor = { ...p };
    this.tablero.setCursor(p);
    this.tablero.showOverlay('area', batalla.areaOf(u.id, sk.id, p), { pulso: false });
    this.mostrarPrevision();
    this.menuObjetivo();
  }

  private mostrarPrevision(): void {
    const u = this.activa();
    const sk = this.skill;
    if (!u || !sk || !this.objetivo) return;
    const prev = batalla.preview(u.id, sk.id, this.objetivo, this.sobremarcha);
    this.hud.mostrarPrevision(
      `${sk.name}${this.sobremarcha ? ' + SOBREMARCHA' : ''}`,
      prev,
      batalla.getState(),
      'Clic otra vez o Z: confirmar · X: cancelar',
    );
  }

  private confirmarObjetivo(): void {
    const sk = this.skill;
    if (!sk || !this.objetivo) return;
    this.enviar({ type: 'ACT', skillId: sk.id, target: this.objetivo, ...(this.sobremarcha ? { overclock: true } : {}) });
  }

  private interactuables(u: UnitState): Pos[] {
    const s = batalla.getState();
    const out: Pos[] = [];
    s.board.tiles.forEach((t, i) => {
      if (!t.interact) return;
      const p = { x: i % s.board.w, y: Math.floor(i / s.board.w) };
      if (manhattan(p, u.pos) <= 1) out.push(p);
    });
    return out;
  }

  private entrarInteractuar(): void {
    const u = this.activa();
    if (!u) return;
    const c = this.interactuables(u);
    if (c.length === 1 && c[0]) {
      this.enviar({ type: 'INTERACT', tile: c[0] });
      return;
    }
    this.modo = 'interactuar';
    this.tablero.showOverlay('area', c);
    this.hud.mostrarMenu('INTERACTUAR', [{ id: 'volver', texto: '‹ Cancelar', habilitado: true }]);
    this.hud.ayuda('Clic en la casilla del mecanismo · X: cancelar');
  }

  private entrarOrientar(): void {
    const u = this.activa();
    if (!u) return;
    this.modo = 'orientar';
    this.facingTmp = u.facing;
    this.tablero.clearOverlay('move');
    this.tablero.clearOverlay('attack');
    this.mostrarOrientacion();
    this.hud.mostrarMenu('ORIENTACIÓN FINAL', [
      ...DIRS.map((d) => ({ id: `dir:${d}`, texto: NOMBRE_DIR[d], habilitado: true })),
      { id: 'volver', texto: '‹ Cancelar', habilitado: true },
    ]);
    this.hud.ayuda('Hacia dónde mira al esperar (la espalda recibe ×1,5) · flechas + Z o clic en una casilla');
  }

  private mostrarOrientacion(): void {
    const u = this.activa();
    if (!u) return;
    this.unidades.get(u.id)?.setFacing(this.facingTmp);
    const d = deltaDeDir(this.facingTmp);
    this.tablero.showOverlay('path', [{ x: u.pos.x + d.x, y: u.pos.y + d.y }], { pulso: true });
  }

  private cancelar(): void {
    switch (this.modo) {
      case 'orientar': {
        const u = this.activa();
        if (u) this.unidades.get(u.id)?.setFacing(u.facing);
        this.abrirMenu();
        break;
      }
      case 'habilidades':
      case 'mover':
      case 'objetivo':
      case 'interactuar':
        this.abrirMenu();
        break;
      default:
        break;
    }
  }

  private alElegirMenu(id: string): void {
    if (this.modo === 'bloqueado' || this.modo === 'fin') return;
    if (id === 'volver') return this.cancelar();
    if (id === 'mover') return this.entrarMover();
    if (id === 'deshacer') return this.enviar({ type: 'UNDO_MOVE' });
    if (id === 'habilidades') return this.abrirHabilidades();
    if (id === 'interactuar') return this.entrarInteractuar();
    if (id === 'esperar') return this.entrarOrientar();
    if (id === 'auto') return this.auto();
    if (id === 'confirmar') return this.confirmarObjetivo();
    if (id === 'sobremarcha') {
      this.sobremarcha = !this.sobremarcha;
      this.menuObjetivo();
      this.mostrarPrevision();
      return;
    }
    if (id.startsWith('skill:')) return this.entrarObjetivo(id.slice(6));
    if (id.startsWith('dir:')) return this.enviar({ type: 'WAIT', facing: id.slice(4) as Dir });
  }

  private alElegirResultado(id: string): void {
    if (id === 'reintentar') this.scene.restart({ reintento: true });
    else {
      this.scene.stop('BatallaHUD');
      this.scene.start('MainMenu');
    }
  }

  // ---------- Entrada ----------

  private configurarEntrada(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cam = this.cameras.main;
      this.arrastre = { x: p.x, y: p.y, sx: cam.scrollX, sy: cam.scrollY, activo: false };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.arrastre && p.isDown) {
        const dx = p.x - this.arrastre.x;
        const dy = p.y - this.arrastre.y;
        if (!this.arrastre.activo && Math.hypot(dx, dy) > 6) this.arrastre.activo = true;
        if (this.arrastre.activo) {
          this.cameras.main.setScroll(this.arrastre.sx - dx, this.arrastre.sy - dy);
          return;
        }
      }
      const t = this.tablero.worldToTile(p);
      if (t) this.alPasar(t);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const arrastrando = this.arrastre?.activo;
      this.arrastre = undefined;
      if (arrastrando) return;
      const t = this.tablero.worldToTile(p);
      if (t) this.alPulsar(t);
    });

    const kb = this.input.keyboard;
    if (!kb) return;
    this.teclasCam = kb.addKeys('W,A,S,D', false) as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    kb.on('keydown', (e: KeyboardEvent) => this.tecla(e.key));
  }

  private tecla(key: string): void {
    const k = key.toLowerCase();
    if (this.modo === 'bloqueado' || this.modo === 'fin') return;
    const confirmar = k === 'z' || k === 'enter' || k === ' ';
    const cancelar = k === 'x' || k === 'escape' || k === 'backspace';
    const flechas: Record<string, Dir> = { arrowup: 'NE', arrowright: 'SE', arrowdown: 'SW', arrowleft: 'NW' };
    if (cancelar) return this.cancelar();
    if (this.modo === 'menu' || this.modo === 'habilidades') {
      if (k === 'arrowup') this.hud.menuMover(-1);
      else if (k === 'arrowdown') this.hud.menuMover(1);
      else if (confirmar) this.hud.menuConfirmar();
      return;
    }
    if (this.modo === 'objetivo' && k === 'c' && this.skill?.overclock) {
      this.alElegirMenu('sobremarcha');
      return;
    }
    if (this.modo === 'objetivo' && confirmar && this.objetivo && posEq(this.cursor, this.objetivo)) {
      this.confirmarObjetivo();
      return;
    }
    const dir = flechas[k];
    if (this.modo === 'orientar') {
      if (dir) {
        this.facingTmp = dir;
        this.mostrarOrientacion();
      } else if (confirmar) this.enviar({ type: 'WAIT', facing: this.facingTmp });
      return;
    }
    if (dir) {
      const d = deltaDeDir(dir);
      const s = batalla.getState();
      const n = { x: Phaser.Math.Clamp(this.cursor.x + d.x, 0, s.board.w - 1), y: Phaser.Math.Clamp(this.cursor.y + d.y, 0, s.board.h - 1) };
      this.alPasar(n);
      this.enfocar(n, true);
    } else if (confirmar) this.alPulsar(this.cursor);
  }

  private alPasar(t: Pos): void {
    this.cursor = { ...t };
    if (this.modo === 'bloqueado' || this.modo === 'fin') return;
    this.tablero.setCursor(t);
    const u = this.activa();
    if (!u) return;
    if (this.modo === 'mover') {
      const destino = batalla.reachable(u.id).find((r) => posEq(r.pos, t));
      if (destino) this.tablero.showOverlay('path', destino.path.slice(1));
      else this.tablero.clearOverlay('path');
    } else if (this.modo === 'objetivo' && this.skill && !this.objetivo) {
      const valido = batalla.validTargets(u.id, this.skill.id).some((p) => posEq(p, t));
      if (valido) this.tablero.showOverlay('area', batalla.areaOf(u.id, this.skill.id, t), { pulso: false });
      else this.tablero.clearOverlay('area');
    } else if (this.modo === 'orientar' && !posEq(t, u.pos)) {
      const d = dirFromDelta(t.x - u.pos.x, t.y - u.pos.y);
      if (d !== this.facingTmp) {
        this.facingTmp = d;
        this.mostrarOrientacion();
      }
    }
  }

  private alPulsar(t: Pos): void {
    const u = this.activa();
    if (!u || this.modo === 'bloqueado' || this.modo === 'fin') return;
    const s = batalla.getState();
    switch (this.modo) {
      case 'menu':
      case 'habilidades': {
        const otra = s.units.find((x) => !x.removed && posEq(x.pos, t));
        if (otra) {
          this.hud.refrescar(s, { unidadId: otra.id });
          if (otra.id === u.id) this.abrirMenu();
        }
        return;
      }
      case 'mover':
        if (batalla.reachable(u.id).some((r) => posEq(r.pos, t) && !posEq(r.pos, u.pos))) this.enviar({ type: 'MOVE', to: t });
        return;
      case 'objetivo': {
        if (!this.skill) return;
        const valido = batalla.validTargets(u.id, this.skill.id).some((p) => posEq(p, t));
        if (!valido) return;
        if (this.objetivo && posEq(this.objetivo, t)) this.confirmarObjetivo();
        else this.elegirObjetivo(t);
        return;
      }
      case 'interactuar':
        if (this.interactuables(u).some((p) => posEq(p, t))) this.enviar({ type: 'INTERACT', tile: t });
        return;
      case 'orientar':
        if (!posEq(t, u.pos)) this.facingTmp = dirFromDelta(t.x - u.pos.x, t.y - u.pos.y);
        this.enviar({ type: 'WAIT', facing: this.facingTmp });
        return;
    }
  }

  /** Mueve la cámara para que la casilla quede visible (suave). */
  private enfocar(p: Pos, soloSiFuera = false): void {
    const w = this.tablero.tileToWorld(p);
    const cam = this.cameras.main;
    if (soloSiFuera) {
      const vx = w.x - cam.scrollX;
      const vy = w.y - cam.scrollY;
      if (vx > 110 && vx < cam.width - 120 && vy > 110 && vy < cam.height - 90) return;
    }
    if (dur(1) === 0) cam.centerOn(w.x, w.y);
    else cam.pan(w.x, w.y, dur(260), 'Sine.easeInOut');
  }

  private pintarPeligro(): void {
    const s = batalla.getState();
    if (s.phase !== 'awaitingPlayer') return this.tablero.clearOverlay('danger');
    const zonas = [...batalla.peligro(), ...batalla.previsionEnemiga().flatMap((p) => p.area)];
    const unicas = new Map(zonas.map((p) => [`${p.x},${p.y}`, p]));
    this.tablero.showOverlay('danger', [...unicas.values()]);
  }

  // ---------- Prototipos ----------

  private crearProto(id: string, defId: string, pos: Pos, fuse: number): VistaProto {
    let key = asegurarPrototipo(this);
    try {
      const sprite = batalla.registry.prototype(defId).sprite;
      if (this.textures.exists(sprite)) key = sprite;
    } catch {
      // sin definición: relleno
    }
    const w = this.tablero.tileToWorld(pos);
    const spr = this.add.sprite(w.x, w.y + 2, key).setOrigin(0.5, 1);
    if (key === 'ph_prototipo') {
      if (!this.anims.exists('ph_prototipo_loop')) {
        this.anims.create({ key: 'ph_prototipo_loop', frames: [{ key, frame: 'a' }, { key, frame: 'b' }], frameRate: 6, repeat: -1 });
      }
      spr.play('ph_prototipo_loop');
    }
    const txt = this.add
      .text(w.x, w.y - 30, String(fuse), { fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#ffe08a', stroke: '#1a1017', strokeThickness: 3 })
      .setOrigin(0.5);
    const pv = { spr, txt, pos: { ...pos } };
    this.profundidadProto(pv);
    this.protos.set(id, pv);
    return pv;
  }

  private profundidadProto(pv: VistaProto): void {
    const d = this.tablero.depthAt(pv.pos, CAPA.prop);
    pv.spr.setDepth(d);
    pv.txt.setDepth(d + 0.2);
  }

  private moverProto(pv: VistaProto, to: Pos): void {
    pv.pos = { ...to };
    const w = this.tablero.tileToWorld(to);
    pv.spr.setPosition(w.x, w.y + 2);
    pv.txt.setPosition(w.x, w.y - 30);
    this.profundidadProto(pv);
  }

  // ---------- Eventos → animaciones ----------

  private flotar(p: Pos, texto: string, color: string): void {
    const w = this.tablero.tileToWorld(p);
    this.numeros.mostrar(w.x - texto.length * 3.5, w.y - 60, texto, color);
  }

  private flotarSobre(id: string, texto: string, color: string, dy = 0): void {
    const v = this.unidades.get(id);
    if (!v) return;
    const c = v.cabeza;
    this.numeros.mostrar(c.x - texto.length * 3.5, c.y + dy, texto, color);
  }

  private async animar(ev: TacticalEvent): Promise<void> {
    const s = batalla.getState();
    switch (ev.type) {
      case 'TurnStarted': {
        this.tablero.clearOverlay('area');
        for (const v of this.unidades.values()) v.setActiva(false);
        if (ev.ref.kind === 'unit') {
          const v = this.unidades.get(ev.ref.id);
          if (v) {
            v.setActiva(true);
            this.enfocar(v.pos, true);
            this.hud.refrescar(s, { unidadId: ev.ref.id, presion: this.hud.presion });
          }
          await esperar(this, 120);
        } else if (ev.ref.kind === 'prototype') {
          const pv = this.protos.get(ev.ref.id);
          if (pv) this.tweens.add({ targets: pv.spr, scale: 1.25, duration: dur(90), yoyo: true });
          await esperar(this, 120);
        }
        return;
      }
      case 'UnitMoved':
        await this.unidades.get(ev.unitId)?.moverPorCamino(ev.path);
        return;
      case 'MoveUndone':
        this.unidades.get(ev.unitId)?.setPos(ev.to);
        return;
      case 'Faced':
        this.unidades.get(ev.unitId)?.setFacing(ev.dir);
        return;
      case 'SkillUsed': {
        const v = this.unidades.get(ev.unitId);
        let nombre = ev.skillId;
        try {
          nombre = batalla.registry.skill(ev.skillId).name;
        } catch {
          // id tal cual
        }
        this.tablero.showOverlay('area', ev.area, { pulso: false });
        void this.hud.banner(ev.overclock ? `${nombre} · ¡SOBREMARCHA!` : nombre, ev.overclock ? '#ffb040' : '#ffe08a');
        if (v && !posEq(v.pos, ev.target)) {
          this.ultimoGolpe = dirFromDelta(ev.target.x - v.pos.x, ev.target.y - v.pos.y);
          await v.atacar(this.ultimoGolpe);
        } else {
          this.ultimoGolpe = undefined;
          await esperar(this, 200);
        }
        return;
      }
      case 'Damaged': {
        const v = this.unidades.get(ev.unitId);
        const vida = this.vida.get(ev.unitId);
        if (!v || !vida) return;
        vida.hp = Math.max(0, vida.hp - ev.amount);
        vida.block = Math.max(0, vida.block - ev.blocked);
        const color = ev.source === 'poison' ? '#8fe05a' : '#ff6a5a';
        this.flotarSobre(ev.unitId, `-${ev.amount}`, color);
        if (ev.blocked > 0) this.flotarSobre(ev.unitId, `bloq ${ev.blocked}`, '#9ec8ff', 14);
        sonar(this, ev.amount > 0 ? 'sfx_golpe' : 'sfx_bloqueo');
        const hp = v.setHp(vida.hp, vida.max, vida.block);
        if (ev.source === 'poison' || ev.source === 'terrain') await hp;
        else await Promise.all([v.recibirGolpe(ev.source === 'attack' ? this.ultimoGolpe : undefined), hp]);
        return;
      }
      case 'Healed': {
        const v = this.unidades.get(ev.unitId);
        const vida = this.vida.get(ev.unitId);
        if (!v || !vida) return;
        vida.hp = Math.min(vida.max, vida.hp + ev.amount);
        this.flotarSobre(ev.unitId, `+${ev.amount}`, '#8fe05a');
        await v.setHp(vida.hp, vida.max, vida.block);
        return;
      }
      case 'BlockGained': {
        const v = this.unidades.get(ev.unitId);
        const vida = this.vida.get(ev.unitId);
        if (!v || !vida) return;
        vida.block += ev.amount;
        this.flotarSobre(ev.unitId, `+${ev.amount} blindaje`, '#9ec8ff');
        sonar(this, 'sfx_bloqueo');
        await v.setHp(vida.hp, vida.max, vida.block);
        return;
      }
      case 'StatusApplied': {
        this.flotarSobre(ev.unitId, `${ev.status} ${ev.stacks}`, '#e0b040', -12);
        const u = s.units.find((x) => x.id === ev.unitId);
        if (u) this.unidades.get(ev.unitId)?.setEstados(u.statuses);
        await esperar(this, 150);
        return;
      }
      case 'StatusTicked':
        return;
      case 'Pushed': {
        const v = this.unidades.get(ev.unitId);
        if (!v) return;
        const dir = posEq(ev.from, ev.to) ? this.ultimoGolpe : dirFromDelta(ev.to.x - ev.from.x, ev.to.y - ev.from.y);
        if (ev.hit) sonar(this, 'sfx_golpe');
        await v.empujada(ev.to, { hit: ev.hit, dir });
        return;
      }
      case 'Fell':
        this.flotarSobre(ev.unitId, `¡caída! ${ev.levels}`, '#e0b040', -12);
        await this.unidades.get(ev.unitId)?.aterrizar(ev.levels);
        return;
      case 'UnitKO':
        await this.unidades.get(ev.unitId)?.ko();
        return;
      case 'UnitRemoved':
        this.flotarSobre(ev.unitId, '¡Baja administrativa!', '#9ec8ff', -12);
        await this.unidades.get(ev.unitId)?.retirada();
        return;
      case 'BrioChanged':
        return;
      case 'PressureChanged':
        this.hud.setPresion(ev.to);
        await esperar(this, 120);
        return;
      case 'Overload':
        sonar(this, 'sfx_explosion');
        if (dur(1) > 0) {
          this.cameras.main.flash(dur(160), 255, 220, 180);
          this.cameras.main.shake(dur(320), 0.014);
        }
        await this.hud.banner('¡SOBRECARGA!', '#ff8060');
        return;
      case 'PrototypePlaced':
        if (!this.protos.has(ev.id)) this.crearProto(ev.id, ev.defId, ev.pos, ev.fuse);
        await esperar(this, 150);
        return;
      case 'FuseTicked': {
        const pv = this.protos.get(ev.id);
        if (!pv) return;
        pv.txt.setText(String(ev.remaining)).setColor(ev.remaining <= 1 ? '#ff6a5a' : '#ffe08a');
        this.tweens.add({ targets: pv.txt, scale: 1.5, duration: dur(120), yoyo: true });
        await esperar(this, 160);
        return;
      }
      case 'PrototypeExploded': {
        const pv = this.protos.get(ev.id);
        this.tablero.showOverlay('area', ev.area, { pulso: false });
        sonar(this, 'sfx_explosion');
        if (dur(1) > 0) {
          this.cameras.main.flash(dur(140), 255, 200, 120);
          this.cameras.main.shake(dur(260), 0.012);
          const w = this.tablero.tileToWorld(ev.pos);
          const boom = this.add
            .particles(w.x, w.y - 8, 'fx_punto', {
              speed: { min: 60, max: 160 },
              lifespan: 500,
              scale: { start: 2, end: 0 },
              tint: [0xffd27a, 0xff9a3c, 0xfff4c8],
              blendMode: Phaser.BlendModes.ADD,
              emitting: false,
            })
            .setDepth(PROFUNDIDAD_NUMEROS - 1);
          boom.explode(30);
          this.time.delayedCall(700, () => boom.destroy());
        }
        if (pv) {
          pv.spr.destroy();
          pv.txt.destroy();
          this.protos.delete(ev.id);
        }
        await esperar(this, 250);
        return;
      }
      case 'PrototypePushed': {
        const pv = this.protos.get(ev.id);
        if (pv) this.moverProto(pv, ev.to);
        await esperar(this, 120);
        return;
      }
      case 'GoteraWarned':
        this.flotar(ev.pos, `Gotera → ${NOMBRE_ERA[ev.next] ?? ev.next}`, '#3cffc8');
        await esperar(this, 200);
        return;
      case 'GoteraShifted': {
        const i = ev.pos.y * this.boardVis.w + ev.pos.x;
        const t = this.boardVis.tiles[i];
        if (t) this.boardVis.tiles[i] = { ...t, terrain: ev.terrain };
        this.tablero.actualizar(this.boardVis);
        this.flotar(ev.pos, `¡Era ${NOMBRE_ERA[ev.to] ?? ev.to}!`, '#3cffc8');
        if (dur(1) > 0) this.cameras.main.flash(dur(120), 60, 255, 200);
        await esperar(this, 300);
        return;
      }
      case 'CosoBeeped':
        this.hud.refrescar({ ...s, beeps: ev.beeps }, { presion: this.hud.presion });
        void this.hud.banner('¡PIP!', '#c9a86a');
        await esperar(this, 150);
        return;
      case 'Interacted':
        this.flotar(ev.tile, ev.id === 'valvula' ? '¡Válvula abierta!' : ev.id === 'puerta' ? '¡Puerta!' : ev.id, '#ffe08a');
        await esperar(this, 250);
        return;
      case 'Dialogue':
        await this.hud.dialogo(lineasDeGuion(ev.script), MODO_TEST);
        return;
      case 'ObjectiveMet':
        await this.hud.banner('¡Objetivo cumplido!', '#8fe05a');
        return;
      case 'BattleEnded':
        return;
    }
  }
}
