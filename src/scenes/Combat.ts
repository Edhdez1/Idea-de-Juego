import Phaser from 'phaser';
import {
  deriveSeed,
  type CardTarget,
  type EnemyIntentView,
  type GameEvent,
  type Intent,
} from '../core';
import { dur } from '../game/anim';
import { detenerMusica, musica, sonar } from '../game/audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/constants';
import { controller } from '../game/controller';
import { borrarRun, guardarRun, obtenerRun, registrarVictoria } from '../game/run';
import { crearUnidad } from '../game/sprites';
import { conectarEscenaDeCombate } from '../game/test-hooks';
import { CajaDialogo } from '../ui/CajaDialogo';
import { CardSprite } from '../ui/CardSprite';
import { layoutMano } from '../ui/HandLayout';
import { DamageNumbers } from '../ui/fx/DamageNumbers';
import { EventQueue } from '../ui/fx/EventQueue';

interface CombatInitData {
  encounterId: string;
  seed: number;
}

interface VistaUnidad {
  cont: Phaser.GameObjects.Container;
  hpTxt: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
  bloqueTxt: Phaser.GameObjects.Text;
  statusTxt: Phaser.GameObjects.Text;
  intentTxt?: Phaser.GameObjects.Text;
}

const SUELO_Y = 204;
const MANO_Y = 336;

export class CombatScene extends Phaser.Scene {
  private encounterId = 'taller_embargado';
  private seed = 20260702;

  private heroe!: VistaUnidad;
  private enemigos: VistaUnidad[] = [];
  private cartas: CardSprite[] = [];
  private numeros!: DamageNumbers;
  private cola!: EventQueue;
  private avisoTxt!: Phaser.GameObjects.Text;

  /** Carta seleccionada esperando objetivo/confirmación. */
  private seleccion: { index: number; overclock: boolean } | null = null;
  private faseJefeDicha = false;
  private botonesOc: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('Combat');
  }

  init(data: Partial<CombatInitData>): void {
    if (data.encounterId) this.encounterId = data.encounterId;
    if (data.seed !== undefined) this.seed = data.seed;
    this.faseJefeDicha = false;
  }

  create(): void {
    // Dentro de una run, el combate arranca con SU mazo y SU vida actual;
    // suelto (MODO_TEST / smoke) cae al mazo inicial con 70 de vida.
    const run = obtenerRun();
    if (run) {
      controller.newCombat(this.encounterId, this.seed, {
        deck: run.deck,
        playerHp: run.hpActual,
        playerMaxHp: run.hpMax,
      });
    } else {
      controller.newCombat(this.encounterId, this.seed);
    }
    controller.onInvalid = (msg) => this.mostrarAviso(msg);

    musica(this, 'musica_combate', { volume: 0.4 });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => detenerMusica());

    // Fondo del encuentro (pixel art 320×180 a escala 2) con velo para legibilidad
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x241a20);
    if (this.textures.exists('bg_taller_gremio')) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_taller_gremio').setScale(2);
      // velo superior (intents/HUD) e inferior (nombres, barras y mano)
      this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH, 60, 0x1a1017, 0.55);
      this.add.rectangle(
        GAME_WIDTH / 2,
        (SUELO_Y + GAME_HEIGHT) / 2 + 4,
        GAME_WIDTH,
        GAME_HEIGHT - SUELO_Y,
        0x1a1017,
        0.72,
      );
    }
    this.add.rectangle(GAME_WIDTH / 2, SUELO_Y + 2, GAME_WIDTH, 2, 0x4a3a30);

    this.numeros = new DamageNumbers(this);
    this.cola = new EventQueue(
      (ev) => this.animarEvento(ev),
      () => this.alTerminarCola(),
    );

    this.construirUnidades();
    this.reconstruirMano();

    if (this.scene.isActive('HUD')) {
      this.game.events.emit('hud:refresh');
    } else {
      this.scene.launch('HUD');
    }

    this.avisoTxt = this.add
      .text(GAME_WIDTH / 2, 60, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ff8a5c' })
      .setOrigin(0.5)
      .setDepth(600)
      .setAlpha(0);

    // Tap fuera de todo = cancelar selección
    this.input.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, sobre: Phaser.GameObjects.GameObject[]) => {
        if (sobre.length === 0) this.deseleccionar();
      },
    );

    const alFinDeTurno = (): void => {
      if (!this.cola.bloqueado) this.despachar({ type: 'END_TURN' });
    };
    this.game.events.on('combat:endturn', alFinDeTurno);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('combat:endturn', alFinDeTurno);
    });

    conectarEscenaDeCombate((intent) => this.despachar(intent));

    // El Gran Maestre defiende su explicación del Coso en persona
    if (this.encounterId === 'jefe_gran_maestre') {
      new CajaDialogo(this, [
        {
          nombre: 'El Gran Maestre del Gremio',
          color: '#ffd27a',
          texto:
            '¿Una desahuciada en MI distrito? El Coso es propiedad del Gremio: modelo VPR-88. La documentación se quemó... lo cual demuestra que existía.',
        },
        {
          nombre: 'El Narrador',
          color: '#e8c170',
          texto: 'Prepárate. Los abogados de este señor golpean primero y facturan después.',
        },
      ]);
    }
  }

  // ---------- construcción de vistas ----------

  private construirUnidades(): void {
    const s = controller.getState();

    this.heroe = this.crearVista(118, 'ingeniera', 'La Ingeniera', undefined);
    this.enemigos = s.enemies.map((e, i) => {
      const x = s.enemies.length === 1 ? 478 : 412 + i * 132;
      return this.crearVista(x, e.defId, e.name, i);
    });
    this.refrescarUnidades();
  }

  private crearVista(x: number, defId: string, nombre: string, slot?: number): VistaUnidad {
    const cont = crearUnidad(this, x, SUELO_Y, defId, nombre);

    this.add
      .text(x, SUELO_Y + 8, nombre, { fontFamily: 'monospace', fontSize: '7px', color: '#c9a86a' })
      .setOrigin(0.5, 0);
    this.add.rectangle(x, SUELO_Y + 22, 84, 7, 0x2a2027).setStrokeStyle(1, 0x4a3a30);
    const hpBar = this.add.rectangle(x - 41, SUELO_Y + 22, 82, 5, 0x9a3a2e).setOrigin(0, 0.5);
    const hpTxt = this.add
      .text(x, SUELO_Y + 31, '', { fontFamily: 'monospace', fontSize: '9px', color: '#f4e4c1' })
      .setOrigin(0.5, 0);
    const bloqueTxt = this.add
      .text(x - 50, SUELO_Y + 22, '', { fontFamily: 'monospace', fontSize: '10px', color: '#7ab8e8' })
      .setOrigin(1, 0.5);
    const statusTxt = this.add
      .text(x, SUELO_Y + 43, '', { fontFamily: 'monospace', fontSize: '8px', color: '#b88ae8' })
      .setOrigin(0.5, 0);

    let intentTxt: Phaser.GameObjects.Text | undefined;
    if (slot !== undefined) {
      // El intent flota justo encima del sprite, sea cual sea su altura
      const alturaSprite = cont.height > 0 ? cont.height : 128;
      intentTxt = this.add
        .text(x, SUELO_Y - alturaSprite - 6, '', {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ff8a5c',
        })
        .setOrigin(0.5, 1);
      cont.setInteractive({ useHandCursor: true });
      cont.on('pointerdown', () => this.tapEnemigo(slot));
    }

    return { cont, hpTxt, hpBar, bloqueTxt, statusTxt, intentTxt };
  }

  private textoIntent(v: EnemyIntentView): string {
    switch (v.intent) {
      case 'attack': {
        const veces = v.times && v.times > 1 ? `x${v.times}` : '';
        return `ATQ ${v.damage ?? '?'}${veces}`;
      }
      case 'defend':
        return 'DEF';
      case 'buff':
        return 'MEJORA';
      case 'debuff':
        return 'MALDICE';
      default:
        return '???';
    }
  }

  private refrescarUnidades(): void {
    const s = controller.getState();

    const pintar = (vista: VistaUnidad, hp: number, maxHp: number, block: number, statuses: Record<string, number | undefined>): void => {
      vista.hpTxt.setText(`${hp}/${maxHp}`);
      vista.hpBar.width = Math.max(0, (82 * hp) / maxHp);
      vista.bloqueTxt.setText(block > 0 ? `[${block}]` : '');
      const st = Object.entries(statuses)
        .filter(([, n]) => (n ?? 0) > 0)
        .map(([id, n]) => `${id.slice(0, 3).toUpperCase()} ${n}`)
        .join('  ');
      vista.statusTxt.setText(st);
    };

    pintar(this.heroe, s.player.hp, s.player.maxHp, s.player.block, s.player.statuses);
    s.enemies.forEach((e, i) => {
      const vista = this.enemigos[i];
      if (!vista) return;
      pintar(vista, e.hp, e.maxHp, e.block, e.statuses);
      vista.intentTxt?.setText(e.hp > 0 ? this.textoIntent(e.nextMove) : '');
      if (e.hp <= 0) {
        vista.cont.disableInteractive();
        vista.hpBar.width = 0;
      }
    });
  }

  private reconstruirMano(): void {
    for (const c of this.cartas) c.destroy();
    this.cartas = [];
    this.deseleccionar();

    const s = controller.getState();
    const slots = layoutMano(s.hand.length, GAME_WIDTH, MANO_Y);
    s.hand.forEach((inst, i) => {
      const def = controller.registry.get(inst.defId);
      const carta = new CardSprite(this, def, inst, i);
      const slot = slots[i];
      if (slot) carta.fijarBase(slot.x, slot.y);
      carta.setJugable(def.cost <= s.energy && s.phase === 'player');
      carta.on('pointerdown', () => this.tapCarta(i));
      this.cartas.push(carta);
    });
  }

  // ---------- input tap-tap ----------

  private tapCarta(index: number): void {
    if (this.cola.bloqueado) return;
    const s = controller.getState();
    const inst = s.hand[index];
    if (!inst) return;
    const def = controller.registry.get(inst.defId);

    // Segundo tap sobre la carta seleccionada sin objetivo: jugarla
    if (this.seleccion?.index === index && def.target !== 'enemy') {
      this.despachar({ type: 'PLAY_CARD', handIndex: index, overclock: this.seleccion.overclock });
      return;
    }

    this.deseleccionar();
    this.seleccion = { index, overclock: false };
    this.cartas[index]?.setSeleccionada(true);
    if (def.target === 'enemy') this.resaltarEnemigos(true);
    if (def.keywords?.includes('overclock')) this.mostrarBotonesOverclock(index, def.target);
  }

  private tapEnemigo(slot: number): void {
    if (this.cola.bloqueado || !this.seleccion) return;
    const s = controller.getState();
    const inst = s.hand[this.seleccion.index];
    if (!inst) return;
    const def = controller.registry.get(inst.defId);
    if (def.target !== 'enemy') return;
    this.despachar({
      type: 'PLAY_CARD',
      handIndex: this.seleccion.index,
      targetSlot: slot,
      overclock: this.seleccion.overclock,
    });
  }

  private mostrarBotonesOverclock(index: number, target: CardTarget): void {
    const carta = this.cartas[index];
    if (!carta) return;
    const estilo = { fontFamily: 'monospace', fontSize: '10px', color: '#1a1017', backgroundColor: '#e8c170', padding: { x: 4, y: 2 } };
    const normal = this.add
      .text(carta.x - 28, carta.y - 96, 'JUGAR', estilo)
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });
    const oc = this.add
      .text(carta.x + 30, carta.y - 96, 'OC +2', { ...estilo, backgroundColor: '#ff8a5c' })
      .setOrigin(0.5)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });

    const elegir = (overclock: boolean): void => {
      if (!this.seleccion) return;
      this.seleccion.overclock = overclock;
      if (target === 'enemy') {
        // queda armada: falta elegir enemigo
        normal.destroy();
        oc.destroy();
        this.botonesOc = [];
      } else {
        this.despachar({ type: 'PLAY_CARD', handIndex: this.seleccion.index, overclock });
      }
    };
    normal.on('pointerdown', () => elegir(false));
    oc.on('pointerdown', () => elegir(true));
    this.botonesOc = [normal, oc];
  }

  private resaltarEnemigos(on: boolean): void {
    const s = controller.getState();
    this.enemigos.forEach((vista, i) => {
      const spr = vista.cont.getData('sprite') as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
      const vivo = (s.enemies[i]?.hp ?? 0) > 0;
      if ('setTint' in spr) {
        if (on && vivo) spr.setTint(0xffd27a);
        else spr.clearTint();
      }
    });
  }

  private deseleccionar(): void {
    if (this.seleccion !== null) this.cartas[this.seleccion.index]?.setSeleccionada(false);
    this.seleccion = null;
    this.resaltarEnemigos(false);
    for (const b of this.botonesOc) b.destroy();
    this.botonesOc = [];
  }

  private mostrarAviso(mensaje: string): void {
    this.avisoTxt.setText(mensaje).setAlpha(1);
    this.tweens.add({ targets: this.avisoTxt, alpha: 0, delay: dur(900), duration: dur(300) });
  }

  // ---------- despacho y animación ----------

  private despachar(intent: Intent): void {
    const bloquear = intent.type === 'END_TURN';
    const events = controller.dispatch(intent);
    this.deseleccionar();
    if (events.length === 0) return; // jugada inválida: el aviso ya se mostró
    if (bloquear) this.game.events.emit('hud:bloqueo', true);
    this.cola.encolar(events, bloquear);
  }

  private alTerminarCola(): void {
    this.refrescarUnidades();
    this.reconstruirMano();
    this.game.events.emit('hud:refresh');
    this.game.events.emit('hud:bloqueo', false);
  }

  private espera(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(dur(ms), () => res()));
  }

  private golpe(vista: VistaUnidad, cantidad: number, bloqueado: number, color = '#ff5a3c'): Promise<void> {
    const spr = vista.cont.getData('sprite') as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    if ('setTint' in spr && 'tintMode' in spr) {
      // Hit-flash blanco (Phaser 4: tint en modo FILL)
      spr.setTint(0xffffff);
      spr.tintMode = Phaser.TintModes.FILL;
      this.time.delayedCall(dur(70), () => {
        spr.clearTint();
        spr.tintMode = Phaser.TintModes.MULTIPLY;
      });
    }
    this.tweens.add({
      targets: vista.cont,
      x: vista.cont.x + (vista.cont.x < GAME_WIDTH / 2 ? -10 : 10),
      duration: dur(70),
      yoyo: true,
      ease: 'Back.easeOut',
    });
    if (cantidad > 0) this.numeros.mostrar(vista.cont.x, SUELO_Y - 110, `-${cantidad}`, color);
    if (bloqueado > 0) this.numeros.mostrar(vista.cont.x + 26, SUELO_Y - 96, `(${bloqueado})`, '#7ab8e8');
    return this.espera(160);
  }

  private async animarEvento(ev: GameEvent): Promise<void> {
    switch (ev.type) {
      case 'CardPlayed': {
        sonar(this, 'sfx_carta');
        return;
      }
      case 'DamageDealt': {
        sonar(this, 'sfx_golpe');
        const vista = this.enemigos[ev.targetSlot];
        if (vista) await this.golpe(vista, ev.amount, ev.blocked);
        this.refrescarUnidades();
        if (this.encounterId === 'jefe_gran_maestre' && !this.faseJefeDicha) {
          const jefe = controller.getState().enemies[0];
          if (jefe && jefe.hp > 0 && jefe.hp < jefe.maxHp * 0.45) {
            this.faseJefeDicha = true;
            new CajaDialogo(this, [
              {
                nombre: 'El Gran Maestre del Gremio',
                color: '#ffd27a',
                texto: '¡¿Dónde está mi SELLO DE URGENCIA?! ¡Esto es un atropello sin cita previa!',
              },
            ]);
          }
        }
        return;
      }
      case 'PlayerDamaged': {
        sonar(this, 'sfx_golpe');
        await this.golpe(this.heroe, ev.amount, ev.blocked, ev.source === 'poison' ? '#8ae87a' : '#ff5a3c');
        this.refrescarUnidades();
        return;
      }
      case 'BlockGained': {
        sonar(this, 'sfx_bloqueo');
        const vista = ev.who === 'player' ? this.heroe : this.enemigos[ev.who];
        if (vista) this.numeros.mostrar(vista.cont.x, SUELO_Y - 110, `+${ev.amount}`, '#7ab8e8');
        this.refrescarUnidades();
        return this.espera(120);
      }
      case 'StatusApplied': {
        const vista = ev.who === 'player' ? this.heroe : this.enemigos[ev.who];
        if (vista) this.numeros.mostrar(vista.cont.x, SUELO_Y - 96, `${ev.status} +${ev.stacks}`, '#b88ae8');
        this.refrescarUnidades();
        return this.espera(120);
      }
      case 'CardsDrawn': {
        sonar(this, 'sfx_robo');
        this.reconstruirMano();
        // entrada con stagger desde abajo
        this.cartas.forEach((c, i) => {
          const destinoY = c.y;
          c.setY(destinoY + 70).setAlpha(0);
          this.tweens.add({
            targets: c,
            y: destinoY,
            alpha: 1,
            duration: dur(160),
            delay: dur(i * 50),
            ease: 'Back.easeOut',
          });
        });
        return this.espera(160 + this.cartas.length * 50);
      }
      case 'HandDiscarded': {
        for (const c of this.cartas) {
          this.tweens.add({ targets: c, y: c.y + 70, alpha: 0, duration: dur(140), ease: 'Quad.easeIn' });
        }
        return this.espera(160);
      }
      case 'PressureChanged': {
        this.game.events.emit('hud:refresh');
        return this.espera(60);
      }
      case 'Overload': {
        sonar(this, 'sfx_explosion');
        this.cameras.main.flash(dur(120), 255, 240, 220);
        this.cameras.main.shake(dur(200), 0.012);
        this.numeros.mostrar(this.heroe.cont.x, SUELO_Y - 120, `-${ev.damage}`, '#ffb347');
        for (const vista of this.enemigos) {
          this.numeros.mostrar(vista.cont.x, SUELO_Y - 120, `-${ev.damage}`, '#ffb347');
        }
        this.refrescarUnidades();
        return this.espera(350);
      }
      case 'CardExploded': {
        sonar(this, 'sfx_explosion');
        this.cameras.main.shake(dur(160), 0.01);
        this.numeros.mostrar(this.heroe.cont.x, SUELO_Y - 120, `-${ev.damage}`, '#ff5a3c');
        this.refrescarUnidades();
        return this.espera(250);
      }
      case 'EnemyTurnStarted': {
        const vista = this.enemigos[ev.slot];
        if (vista) {
          this.tweens.add({
            targets: vista.cont,
            x: vista.cont.x - 14,
            duration: dur(110),
            yoyo: true,
            ease: 'Quad.easeOut',
          });
        }
        return this.espera(180);
      }
      case 'EnemyIntentChanged': {
        this.refrescarUnidades();
        return;
      }
      case 'EnemyDied': {
        const vista = this.enemigos[ev.slot];
        if (vista) {
          this.tweens.add({ targets: vista.cont, alpha: 0, y: vista.cont.y + 8, duration: dur(220) });
        }
        return this.espera(240);
      }
      case 'EnergyChanged':
      case 'TurnStarted':
      case 'DeckReshuffled':
      case 'StatusTicked': {
        this.game.events.emit('hud:refresh');
        this.refrescarUnidades();
        return;
      }
      case 'CombatEnded': {
        await this.espera(300);
        this.mostrarFinal(ev.result);
        return;
      }
      default:
        return;
    }
  }

  private mostrarFinal(resultado: 'victory' | 'defeat'): void {
    sonar(this, resultado === 'victory' ? 'sfx_victoria' : 'sfx_derrota');

    // Dentro de una run el combate desemboca en el loop completo:
    // victoria → botín (o final de acto tras el jefe); derrota → game over.
    const run = obtenerRun();
    if (run && run.nodoActual !== null) {
      this.scene.stop('HUD');
      if (resultado === 'victory') {
        const nodo = registrarVictoria(run, controller.getState().player.hp);
        guardarRun(run);
        if (nodo.tipo === 'jefe') this.scene.start('Victory');
        else this.scene.start('Reward', { nodoId: nodo.id });
      } else {
        borrarRun();
        this.scene.start('GameOver');
      }
      return;
    }

    // Combate suelto (MODO_TEST): panel simple con reintento.
    const linea =
      resultado === 'victory'
        ? '«Enhorabuena. El Gremio enviará la factura por daños.»'
        : '«El informe dirá "error del operario". El operario eras tú.»';
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x120c10, 0.78)
      .setDepth(900);
    this.add
      .text(GAME_WIDTH / 2, 140, resultado === 'victory' ? 'VICTORIA' : 'DERROTA', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: resultado === 'victory' ? '#e8c170' : '#ff5a3c',
      })
      .setOrigin(0.5)
      .setDepth(901);
    this.add
      .text(GAME_WIDTH / 2, 180, `${linea}\n— el Narrador`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#a08662',
        align: 'center',
        wordWrap: { width: 400 },
      })
      .setOrigin(0.5)
      .setDepth(901);
    const boton = this.add
      .text(GAME_WIDTH / 2, 240, '[ OTRA RUN ]', { fontFamily: 'monospace', fontSize: '14px', color: '#e8c170' })
      .setOrigin(0.5)
      .setDepth(901)
      .setInteractive({ useHandCursor: true });
    boton.on('pointerdown', () => {
      this.scene.restart({
        encounterId: this.encounterId,
        seed: deriveSeed(this.seed, 'next'),
      } satisfies CombatInitData);
    });
  }
}
