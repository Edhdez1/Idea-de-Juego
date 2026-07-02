import type { GameEvent } from '../../core';

type Handler = (ev: GameEvent) => Promise<void> | void;

/**
 * Cola secuencial de animaciones (patrón Event Queue): el core ya resolvió
 * la lógica al instante; aquí solo se dosifica la presentación.
 * `bloqueado` indica a la escena que no acepte input (turno enemigo).
 */
export class EventQueue {
  bloqueado = false;

  private cola: GameEvent[] = [];
  private procesando = false;

  constructor(
    private handler: Handler,
    private onIdle: () => void,
  ) {}

  encolar(events: GameEvent[], bloquearInput = false): void {
    this.cola.push(...events);
    if (bloquearInput) this.bloqueado = true;
    void this.procesar();
  }

  private async procesar(): Promise<void> {
    if (this.procesando) return;
    this.procesando = true;
    while (this.cola.length > 0) {
      const ev = this.cola.shift();
      if (ev) await this.handler(ev);
    }
    this.procesando = false;
    this.bloqueado = false;
    this.onIdle();
  }
}
