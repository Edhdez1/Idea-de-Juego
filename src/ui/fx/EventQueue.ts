type Handler<E> = (ev: E) => Promise<void> | void;

/**
 * Cola secuencial de animaciones (patrón Event Queue): el core ya resolvió
 * la lógica al instante; aquí solo se dosifica la presentación.
 * `bloqueado` indica a la escena que no acepte input mientras se anima.
 * Genérica: sirve para TacticalEvent (batalla) y para cualquier otro flujo.
 */
export class EventQueue<E> {
  bloqueado = false;

  private cola: E[] = [];
  private procesando = false;

  constructor(
    private handler: Handler<E>,
    private onIdle: () => void,
  ) {}

  get pendientes(): number {
    return this.cola.length + (this.procesando ? 1 : 0);
  }

  encolar(events: E[], bloquearInput = false): void {
    this.cola.push(...events);
    if (bloquearInput) this.bloqueado = true;
    void this.procesar();
  }

  private async procesar(): Promise<void> {
    if (this.procesando) return;
    this.procesando = true;
    while (this.cola.length > 0) {
      const ev = this.cola.shift();
      if (ev === undefined) continue;
      try {
        await this.handler(ev);
      } catch (e) {
        // Una animación rota nunca debe colgar la batalla: se registra y se sigue.
        console.warn('Fallo animando evento', ev, e);
      }
    }
    this.procesando = false;
    this.bloqueado = false;
    this.onIdle();
  }
}
