/** Posiciones del abanico inferior de la mano. Función pura (testeable). */

export interface CardSlot {
  x: number;
  y: number;
}

export function layoutMano(cantidad: number, anchoPantalla: number, yBase: number): CardSlot[] {
  if (cantidad <= 0) return [];
  const paso = Math.min(64, (anchoPantalla - 200) / Math.max(1, cantidad - 1));
  const ancho = paso * (cantidad - 1);
  const x0 = anchoPantalla / 2 - ancho / 2;
  const slots: CardSlot[] = [];
  for (let i = 0; i < cantidad; i++) {
    // leve curva: las puntas del abanico bajan un poco
    const t = cantidad === 1 ? 0 : i / (cantidad - 1) - 0.5;
    slots.push({ x: x0 + paso * i, y: yBase + Math.abs(t) * 10 });
  }
  return slots;
}
