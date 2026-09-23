import Phaser from 'phaser';
import { BRIO_MAX, PRESSURE_MAX, PRESSURE_SWEET_SPOT } from '../core/shared/constants';
import type { BattleState, DamagePreview, UnitState } from '../core/tactics';
import { dur } from '../game/anim';
import { sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { batalla } from '../game/controladores/batalla';
import { asegurarPeon, COLOR_EQUIPO, COLOR_ESTADO, hex } from '../game/placeholders';
import { spriteKeyDe } from '../game/sprites';
import { entradaOrden, nombreCorto, textoObjetivo, textoPrevision, type LineaProvisional } from '../game/textosBatalla';
import { CajaDialogo } from '../ui/CajaDialogo';

export interface EntradaMenu {
  id: string;
  texto: string;
  habilitado: boolean;
  /** Texto secundario a la derecha (coste de brío). */
  extra?: string;
}

const ESTILO = { fontFamily: 'monospace', fontSize: '10px', color: '#f4e4c1' };
const ORO = '#e8c170';
const APAGADO = '#8a7a66';

const BARRA_W = 110;
const BARRA_X = GAME_WIDTH / 2 - BARRA_W / 2;

const NOMBRE_ESTADO: Record<string, string> = {
  vulnerable: 'Vulnerable',
  weak: 'Débil',
  poison: 'Veneno',
  strength: 'Fuerza',
};

/** Colores de la barra de turnos por tipo de entrada. */
const COLOR_ORDEN: Record<string, number> = {
  player: COLOR_EQUIPO.player,
  ally: COLOR_EQUIPO.ally,
  enemy: COLOR_EQUIPO.enemy,
  third: COLOR_EQUIPO.third,
  prototype: 0xff9a3c,
  clock: 0xc9a86a,
};

function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, w, h, 0x14100f, 0.86).setOrigin(0, 0).setStrokeStyle(1, 0x8a7350);
}

/**
 * Interfaz de la batalla en escena aparte (la cámara del tablero se arrastra
 * y tiembla; la interfaz no). Muestra: objetivo, manómetro de Presión y
 * pitidos del Coso, barra vertical del Reloj de Vapor, panel de unidad con el
 * sprite aprobado, menú de acciones, previsión de daño con desglose,
 * previsión enemiga «si nada cambia», avisos, diálogo y resultado.
 *
 * Solo pinta: las decisiones las toma Batalla (recibe 'batalla:menu' y
 * 'batalla:resultado' por game.events).
 */
export class BatallaHUDScene extends Phaser.Scene {
  private objetivoTxt!: Phaser.GameObjects.Text;
  private presionTxt!: Phaser.GameObjects.Text;
  private aguja!: Phaser.GameObjects.Rectangle;
  private zonaRoja!: Phaser.GameObjects.Rectangle;
  private pulso?: Phaser.Tweens.Tween;
  private pitidosTxt!: Phaser.GameObjects.Text;
  private orden!: Phaser.GameObjects.Container;
  private unidad!: Phaser.GameObjects.Container;
  private menu!: Phaser.GameObjects.Container;
  private prevision!: Phaser.GameObjects.Container;
  private enemigos!: Phaser.GameObjects.Container;
  private ayudaTxt!: Phaser.GameObjects.Text;
  private avisoTxt!: Phaser.GameObjects.Text;
  private bannerTxt!: Phaser.GameObjects.Text;
  private resultado?: Phaser.GameObjects.Container;
  private entradas: EntradaMenu[] = [];
  private textosMenu: Phaser.GameObjects.Text[] = [];
  private sel = 0;
  private presionVis = 0;

  constructor() {
    super('BatallaHUD');
  }

  create(): void {
    this.entradas = [];
    this.textosMenu = [];
    this.resultado = undefined;
    this.pulso = undefined;

    // Franja superior: nombre + objetivo | Presión | pitidos
    panel(this, 4, 4, GAME_WIDTH - 8, 28);
    this.objetivoTxt = this.add.text(10, 7, '', { ...ESTILO, fontSize: '9px', color: ORO, lineSpacing: 1 });
    this.add.text(BARRA_X - 6, 17, 'PRESIÓN', { ...ESTILO, fontSize: '9px', color: ORO }).setOrigin(1, 0.5);
    this.add.rectangle(BARRA_X, 17, BARRA_W, 8, 0x2a2027).setOrigin(0, 0.5).setStrokeStyle(1, 0xc9a86a);
    // Zona de caldera (bonus de vapor) y zona roja (Sobrecarga)
    const x4 = BARRA_X + (BARRA_W * PRESSURE_SWEET_SPOT) / PRESSURE_MAX;
    this.add.rectangle(x4, 17, BARRA_W * (8 - PRESSURE_SWEET_SPOT) / PRESSURE_MAX, 8, 0x6a5020).setOrigin(0, 0.5);
    this.zonaRoja = this.add.rectangle(BARRA_X + BARRA_W * 0.8, 17, BARRA_W * 0.2, 8, 0x8a2a1e).setOrigin(0, 0.5);
    for (let i = 1; i < PRESSURE_MAX; i++) this.add.rectangle(BARRA_X + (BARRA_W * i) / PRESSURE_MAX, 17, 1, 8, 0x1a1418, 0.6);
    this.aguja = this.add.rectangle(BARRA_X, 17, 3, 14, 0xf4e4c1).setOrigin(0.5);
    this.presionTxt = this.add.text(BARRA_X + BARRA_W + 6, 17, '', ESTILO).setOrigin(0, 0.5);
    this.pitidosTxt = this.add.text(GAME_WIDTH - 10, 17, '', { ...ESTILO, color: ORO }).setOrigin(1, 0.5);

    this.orden = this.add.container(0, 0);
    this.unidad = this.add.container(0, 0);
    this.menu = this.add.container(0, 0);
    this.prevision = this.add.container(0, 0);
    this.enemigos = this.add.container(0, 0);

    this.ayudaTxt = this.add
      .text(GAME_WIDTH / 2 - 8, 37, '', {
        ...ESTILO,
        fontSize: '9px',
        color: '#d8c8a8',
        backgroundColor: '#14100fcc',
        padding: { x: 4, y: 2 },
        align: 'center',
        wordWrap: { width: 270 },
      })
      .setOrigin(0.5, 0);
    this.avisoTxt = this.add
      .text(GAME_WIDTH / 2, 64, '', { ...ESTILO, fontSize: '11px', color: '#ffb0a0', backgroundColor: '#14100fdd', padding: { x: 6, y: 3 } })
      .setOrigin(0.5, 0)
      .setAlpha(0);
    this.bannerTxt = this.add
      .text(GAME_WIDTH / 2, 118, '', { fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold', color: '#ffe08a', stroke: '#1a1017', strokeThickness: 4 })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(50);

    this.game.events.emit('bhud:listo');
  }

  // ---------- Estado general ----------

  /** Refresca todo lo que se lee del estado. `presion` permite mostrar el valor animado. */
  refrescar(s: BattleState, opts: { unidadId?: string; presion?: number } = {}): void {
    const r = batalla.registry;
    const def = batalla.def;
    const objetivos = s.objectives.map((o, i) => `${(s.metObjectives ?? []).includes(i) ? '✓' : '▸'} ${textoObjetivo(o, s, r)}`);
    this.objetivoTxt.setText([def.name.toUpperCase(), ...objetivos].join('\n'));
    this.setPresion(opts.presion ?? s.pressure);
    this.pitidosTxt.setText(`COSO ${String(s.beeps).padStart(2, '0')} PIP`);
    this.pintarOrden(s);
    const u = s.units.find((x) => x.id === (opts.unidadId ?? s.turn?.unitId)) ?? s.units.find((x) => x.team === 'player');
    if (u) this.pintarUnidad(u, s);
    this.pintarEnemigos(s);
  }

  setPresion(p: number): void {
    this.presionVis = p;
    this.presionTxt.setText(`${p}/${PRESSURE_MAX}`);
    const destino = BARRA_X + (BARRA_W * Math.min(p, PRESSURE_MAX)) / PRESSURE_MAX;
    this.tweens.add({ targets: this.aguja, x: destino, duration: dur(150), ease: 'Quad.easeOut' });
    const peligro = p >= 8;
    if (peligro && !this.pulso) {
      this.pulso = this.tweens.add({ targets: this.zonaRoja, alpha: 0.35, duration: 220, yoyo: true, repeat: -1 });
    } else if (!peligro && this.pulso) {
      this.pulso.stop();
      this.pulso = undefined;
      this.zonaRoja.setAlpha(1);
    }
  }

  get presion(): number {
    return this.presionVis;
  }

  private pintarOrden(s: BattleState): void {
    this.orden.removeAll(true);
    const r = batalla.registry;
    const x = 4;
    const y = 50;
    this.orden.add(panel(this, x, y - 14, 84, 12 + 14 * 9));
    this.orden.add(this.add.text(x + 4, y - 12, 'RELOJ DE VAPOR', { ...ESTILO, fontSize: '8px', color: ORO }));
    const filas = [] as { texto: string; color: number; ahora: boolean }[];
    const act = s.turn ? s.units.find((u) => u.id === s.turn?.unitId) : undefined;
    if (act) filas.push({ texto: nombreCorto(act, r), color: COLOR_EQUIPO[act.team], ahora: true });
    for (const ref of batalla.orden(8)) {
      const e = entradaOrden(ref, s, r);
      filas.push({ texto: e.texto, color: COLOR_ORDEN[e.tipo] ?? 0x888888, ahora: false });
    }
    filas.slice(0, 9).forEach((f, i) => {
      const fy = y + i * 14;
      if (f.ahora) this.orden.add(this.add.rectangle(x + 2, fy - 1, 80, 13, 0x3a2e20).setOrigin(0, 0));
      this.orden.add(this.add.rectangle(x + 5, fy + 5, 6, 9, f.color).setStrokeStyle(1, 0x1a1418));
      this.orden.add(
        this.add.text(x + 12, fy, `${f.ahora ? '» ' : ''}${f.texto}`.slice(0, 13), {
          ...ESTILO,
          fontSize: '9px',
          color: f.ahora ? '#ffe08a' : '#d8c8a8',
        }),
      );
    });
  }

  private pintarUnidad(u: UnitState, s: BattleState): void {
    this.unidad.removeAll(true);
    const r = batalla.registry;
    const x = 4;
    const y = GAME_HEIGHT - 74;
    this.unidad.add(panel(this, x, y, 200, 70));
    this.unidad.add(this.add.rectangle(x + 6, y + 5, 60, 60, 0x241a20).setOrigin(0, 0).setStrokeStyle(1, 0x5a4a38));
    // Sprite aprobado de 128 px (referencia canónica) si existe; si no, el peón.
    const key = spriteKeyDe(u.defId);
    let img: Phaser.GameObjects.Image;
    let nombre = u.defId;
    try {
      nombre = r.unit(u.defId).name;
    } catch {
      // sin definición
    }
    if (this.textures.exists(key)) {
      img = this.add.image(x + 36, y + 64, key).setOrigin(0.5, 1);
      img.setScale(Math.min(58 / img.width, 58 / img.height));
    } else {
      img = this.add.image(x + 36, y + 60, asegurarPeon(this, u.team, nombreCorto(u, r)), 'SE').setOrigin(0.5, 1).setScale(1.2);
    }
    if (u.team === 'enemy' && this.textures.exists(key)) img.setFlipX(false);
    this.unidad.add(img);
    const tx = x + 72;
    this.unidad.add(
      this.add.text(tx, y + 4, nombre, { ...ESTILO, fontSize: '9px', color: `#${hex(COLOR_EQUIPO[u.team] | 0x404040)}`, wordWrap: { width: 124 }, lineSpacing: 0 }),
    );
    // Vida
    const hy = y + 32;
    this.unidad.add(this.add.text(tx, hy, 'VIDA', { ...ESTILO, fontSize: '8px', color: APAGADO }).setOrigin(0, 0.5));
    this.unidad.add(this.add.rectangle(tx + 26, hy, 70, 6, 0x2a2027).setOrigin(0, 0.5));
    const f = Math.max(0, u.hp / u.maxHp);
    this.unidad.add(this.add.rectangle(tx + 26, hy, 70 * f, 6, f > 0.5 ? 0x6fd06f : f > 0.25 ? 0xe0b040 : 0xd8463c).setOrigin(0, 0.5));
    this.unidad.add(this.add.text(tx + 100, hy, `${u.hp}/${u.maxHp}${u.block ? ` +${u.block}` : ''}`, { ...ESTILO, fontSize: '9px' }).setOrigin(0, 0.5));
    // Brío
    const by = y + 44;
    this.unidad.add(this.add.text(tx, by, 'BRÍO', { ...ESTILO, fontSize: '8px', color: APAGADO }).setOrigin(0, 0.5));
    for (let i = 0; i < BRIO_MAX; i++) {
      this.unidad.add(this.add.rectangle(tx + 30 + i * 11, by, 8, 6, i < u.brio ? 0xffb040 : 0x3a3030).setStrokeStyle(1, 0x1a1418));
    }
    // Estados
    const estados = Object.entries(u.statuses).filter(([, n]) => (n ?? 0) > 0);
    const txt = u.ko ? 'FUERA DE COMBATE' : u.removed ? 'BAJA ADMINISTRATIVA' : estados.map(([id, n]) => `${NOMBRE_ESTADO[id] ?? id} ${n}`).join(' · ');
    const color = estados[0] ? `#${hex(COLOR_ESTADO[estados[0][0]] ?? 0xd8c8a8)}` : '#d8c8a8';
    this.unidad.add(this.add.text(tx, y + 54, txt || (s.turn?.unitId === u.id ? 'Su turno' : ''), { ...ESTILO, fontSize: '9px', color: u.ko ? '#ff8070' : color }));
  }

  private pintarEnemigos(s: BattleState): void {
    this.enemigos.removeAll(true);
    if (s.phase !== 'awaitingPlayer') return;
    const r = batalla.registry;
    const planes = batalla.previsionEnemiga().slice(0, 5);
    if (planes.length === 0) return;
    const w = 168;
    const x = GAME_WIDTH - w - 4;
    const y = 36;
    this.enemigos.add(panel(this, x, y, w, 16 + planes.length * 12));
    this.enemigos.add(this.add.text(x + 4, y + 3, 'SI NADA CAMBIA…', { ...ESTILO, fontSize: '8px', color: ORO }));
    planes.forEach((p, i) => {
      this.enemigos.add(this.add.text(x + 4, y + 14 + i * 12, textoPrevision(p, s, r).slice(0, 30), { ...ESTILO, fontSize: '9px', color: '#ffb0a0' }));
    });
  }

  // ---------- Menú de acciones ----------

  mostrarMenu(titulo: string, entradas: EntradaMenu[]): void {
    this.menu.removeAll(true);
    this.entradas = entradas;
    this.textosMenu = [];
    const w = 164;
    const alto = 18 + entradas.length * 14;
    const x = GAME_WIDTH - w - 4;
    const y = GAME_HEIGHT - alto - 4;
    this.menu.add(panel(this, x, y, w, alto));
    this.menu.add(this.add.text(x + 6, y + 4, titulo.slice(0, 32), { ...ESTILO, fontSize: '8px', color: ORO }));
    entradas.forEach((e, i) => {
      const t = this.add
        .text(x + 8, y + 16 + i * 14, e.texto, { ...ESTILO, fontSize: '10px', color: e.habilitado ? '#f4e4c1' : '#6a5e50' })
        .setInteractive({ useHandCursor: e.habilitado });
      t.on('pointerover', () => this.seleccionar(i));
      t.on('pointerdown', () => this.elegir(i));
      this.menu.add(t);
      this.textosMenu.push(t);
      if (e.extra) {
        this.menu.add(
          this.add.text(x + w - 6, y + 16 + i * 14, e.extra, { ...ESTILO, fontSize: '9px', color: e.habilitado ? '#ffb040' : '#6a5e50' }).setOrigin(1, 0),
        );
      }
    });
    const primero = entradas.findIndex((e) => e.habilitado);
    this.seleccionar(primero < 0 ? 0 : primero);
  }

  ocultarMenu(): void {
    this.menu.removeAll(true);
    this.entradas = [];
    this.textosMenu = [];
  }

  get menuAbierto(): boolean {
    return this.entradas.length > 0;
  }

  /** Mueve la selección saltando entradas deshabilitadas. */
  menuMover(d: number): void {
    const n = this.entradas.length;
    if (n === 0) return;
    let i = this.sel;
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (this.entradas[i]?.habilitado) break;
    }
    this.seleccionar(i);
  }

  menuConfirmar(): void {
    this.elegir(this.sel);
  }

  private seleccionar(i: number): void {
    this.sel = i;
    this.textosMenu.forEach((t, k) => {
      const e = this.entradas[k];
      if (!e) return;
      const marcado = k === i && e.habilitado;
      t.setText(`${marcado ? '▸ ' : '  '}${e.texto}`);
      t.setColor(!e.habilitado ? '#6a5e50' : marcado ? '#ffe08a' : '#f4e4c1');
    });
  }

  private elegir(i: number): void {
    const e = this.entradas[i];
    if (!e || !e.habilitado) return;
    sonar(this, 'sfx_click');
    this.game.events.emit('batalla:menu', e.id);
  }

  // ---------- Previsión de daño ----------

  mostrarPrevision(titulo: string, previews: DamagePreview[], s: BattleState, nota: string): void {
    this.prevision.removeAll(true);
    const r = batalla.registry;
    const w = 212;
    const lineas: { texto: string; color: string }[] = [];
    for (const p of previews.slice(0, 4)) {
      const u = s.units.find((x) => x.id === p.unitId);
      const nombre = u ? nombreCorto(u, r) : p.unitId;
      const aliado = u?.team === 'player' || u?.team === 'ally';
      lineas.push({
        texto: `${nombre}: -${p.amount}${p.blocked ? ` (bloq ${p.blocked})` : ''}${p.ko ? '  ¡KO!' : ''}${aliado ? '  ¡ALIADO!' : ''}`,
        color: aliado ? '#ffb0a0' : '#f4e4c1',
      });
      const desglose = p.breakdown.map((m) => `${m.label} ${m.add ? (m.value >= 0 ? '+' : '') + m.value : '×' + m.value}`).join(' · ');
      if (desglose) lineas.push({ texto: `  ${desglose}`, color: '#a09080' });
    }
    if (previews.length === 0) lineas.push({ texto: 'Sin daño directo', color: '#a09080' });
    const alto = 28 + lineas.length * 11;
    const x = 210;
    const y = GAME_HEIGHT - alto - 4;
    this.prevision.add(panel(this, x, y, w, alto));
    this.prevision.add(this.add.text(x + 6, y + 4, titulo, { ...ESTILO, color: ORO, fontSize: '9px' }));
    lineas.forEach((l, i) => {
      this.prevision.add(this.add.text(x + 6, y + 16 + i * 11, l.texto, { ...ESTILO, fontSize: '9px', color: l.color, wordWrap: { width: w - 10 } }));
    });
    this.prevision.add(this.add.text(x + 6, y + alto - 12, nota, { ...ESTILO, fontSize: '8px', color: '#9ec8ff' }));
  }

  ocultarPrevision(): void {
    this.prevision.removeAll(true);
  }

  // ---------- Mensajes ----------

  ayuda(texto: string): void {
    this.ayudaTxt.setText(texto).setVisible(texto.length > 0);
  }

  aviso(texto: string): void {
    this.avisoTxt.setText(texto).setAlpha(1);
    this.tweens.killTweensOf(this.avisoTxt);
    this.tweens.add({ targets: this.avisoTxt, alpha: 0, delay: 1800, duration: 400 });
  }

  /** Letrero grande y breve (nombre de habilidad, ¡Sobrecarga!...). Resuelve al terminar. */
  banner(texto: string, color = '#ffe08a'): Promise<void> {
    this.bannerTxt.setText(texto).setColor(color).setAlpha(1).setScale(0.8);
    this.tweens.killTweensOf(this.bannerTxt);
    const d = dur(700);
    if (d <= 0) {
      this.bannerTxt.setAlpha(0);
      return Promise.resolve();
    }
    this.tweens.add({ targets: this.bannerTxt, scale: 1, duration: 120, ease: 'Back.easeOut' });
    return new Promise((res) => {
      this.tweens.add({ targets: this.bannerTxt, alpha: 0, delay: d, duration: 250, onComplete: () => res() });
    });
  }

  /** Diálogo modal; resuelve al cerrarse (en modo test, al instante). */
  dialogo(lineas: LineaProvisional[], saltar: boolean): Promise<void> {
    if (saltar || lineas.length === 0) return Promise.resolve();
    return new Promise((res) => new CajaDialogo(this, lineas, () => res()));
  }

  // ---------- Resultado ----------

  mostrarResultado(resultado: 'victory' | 'defeat', battleId = ''): void {
    this.ocultarMenu();
    this.ocultarPrevision();
    this.ayuda('');
    this.resultado?.destroy();
    const c = this.add.container(0, 0).setDepth(100);
    this.resultado = c;
    c.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d0a0c, 0.72).setInteractive());
    c.add(panel(this, GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 70, 300, 140));
    const victoria = resultado === 'victory';
    c.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, victoria ? '¡VICTORIA!' : 'DERROTA', {
          fontFamily: 'monospace',
          fontSize: '22px',
          fontStyle: 'bold',
          color: victoria ? '#ffe08a' : '#ff8070',
        })
        .setOrigin(0.5),
    );
    const texto = victoria
      ? battleId === 'prologo_taller'
        ? 'Fin del Prólogo.\nEl taller queda atrás; la pirámide, delante.\n(El Capítulo 1 continuará…)'
        : 'Batalla ganada.\nEl Gremio tendrá que buscarse otro taller.'
      : 'El Gremio cobra la cuota.\nNadie borra tu partida: puedes reintentarlo.';
    c.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, texto, { ...ESTILO, align: 'center', lineSpacing: 3 }).setOrigin(0.5));
    const botones: { id: string; texto: string }[] = victoria
      ? [{ id: 'menu', texto: '[ VOLVER AL MENÚ ]' }]
      : [
          { id: 'reintentar', texto: '[ REINTENTAR ]' },
          { id: 'menu', texto: '[ VOLVER AL MENÚ ]' },
        ];
    botones.forEach((b, i) => {
      const x = GAME_WIDTH / 2 + (botones.length === 1 ? 0 : i === 0 ? -70 : 70);
      const t = this.add
        .text(x, GAME_HEIGHT / 2 + 45, b.texto, { ...ESTILO, fontSize: '11px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#ffe08a'));
      t.on('pointerout', () => t.setColor('#f4e4c1'));
      t.on('pointerdown', () => {
        sonar(this, 'sfx_click');
        this.game.events.emit('batalla:resultado', b.id);
      });
      c.add(t);
    });
    sonar(this, victoria ? 'sfx_victoria' : 'sfx_derrota');
  }
}
