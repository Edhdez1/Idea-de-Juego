/**
 * Guión de la intro cinemática (formato Darkest Dungeon: paneles ilustrados
 * con paneo lento + narrador). Solo datos; la escena vive en scenes/Intro.ts.
 */

export type HablanteId =
  | 'narrador'
  | 'ingeniera'
  | 'clerigo'
  | 'historiadora'
  | 'reparador'
  | 'brayan';

export interface LineaIntro {
  hablante: HablanteId;
  texto: string;
}

export interface PanelIntro {
  /** Key de textura del panel (cargado en Preload). */
  key: string;
  /** Zoom Ken Burns: de → a, durante toda la vida del panel. */
  zoom: { from: number; to: number };
  lineas: LineaIntro[];
}

export const HABLANTES: Record<HablanteId, { nombre: string; color: string; retrato?: string }> = {
  narrador: { nombre: 'El Narrador', color: '#e8c170' },
  ingeniera: { nombre: 'La Ingeniera', color: '#ff9a5c', retrato: 'retrato_ingeniera' },
  clerigo: { nombre: 'El Clérigo del Vapor Bendito', color: '#8ad0ff', retrato: 'retrato_clerigo' },
  historiadora: { nombre: 'La Historiadora Varada', color: '#b8e88a', retrato: 'retrato_historiadora' },
  reparador: { nombre: 'El Reparador No Autorizado', color: '#e88ad0', retrato: 'retrato_reparador' },
  brayan: { nombre: 'El Primo Brayan', color: '#ffd27a', retrato: 'retrato_brayan' },
};

/**
 * PARTE I — «La Caída del Coso»: toda la historia, se reproduce al abrir
 * el juego y termina en la placa del título.
 */
export const PANELES_PARTE1: PanelIntro[] = [
  {
    key: 'intro_1_amanecer',
    zoom: { from: 1.0, to: 1.12 },
    lineas: [
      { hablante: 'narrador', texto: 'Vaporcracia era un reino perfectamente normal.' },
      { hablante: 'narrador', texto: 'Castillos con calderas. Impuestos con intereses. Miseria con sello oficial.' },
      { hablante: 'narrador', texto: 'Nada — absolutamente nada — interesante había pasado aquí en trescientos años.' },
    ],
  },
  {
    key: 'intro_2_cielo',
    zoom: { from: 1.15, to: 1.0 },
    lineas: [
      { hablante: 'narrador', texto: 'Hasta que un martes, a las 6:47 de la mañana...' },
      { hablante: 'narrador', texto: '...el cielo se abrió.' },
      { hablante: 'narrador', texto: 'No para revelar un dios. Ni un cometa. Ni el fin de los tiempos. Ojalá.' },
    ],
  },
  {
    key: 'intro_3_crater',
    zoom: { from: 1.0, to: 1.15 },
    lineas: [
      { hablante: 'narrador', texto: 'Cayó... el Coso.' },
      { hablante: 'narrador', texto: 'Pitaba tres veces al amanecer. Su pantalla recitaba la profecía: 88:88.' },
      { hablante: 'narrador', texto: 'Y freía sin aceite. Lo cual aquí es, técnica y legalmente, un milagro.' },
      { hablante: 'narrador', texto: 'Yo sé exactamente lo que es. No pienso decírselo a nadie. Esto es lo más divertido que ha pasado en siglos.' },
    ],
  },
  {
    key: 'intro_4_facciones',
    zoom: { from: 1.12, to: 1.0 },
    lineas: [
      { hablante: 'narrador', texto: 'El Gremio declaró: «es una patente robada de uno de nuestros hornos, obviamente».' },
      { hablante: 'narrador', texto: 'La Iglesia lo proclamó: «el Santo Horno que Fríe Sin Pecado». El aceite es pecado desde el martes. Hubo cónclave.' },
      { hablante: 'narrador', texto: 'Y la Corona, tras un exhaustivo análisis heráldico... decidió coronarlo rey.' },
      { hablante: 'narrador', texto: 'Nadie preguntó qué era. Todos decidieron qué debía ser. Muy típico de ustedes.' },
    ],
  },
  {
    key: 'intro_5_goteras',
    zoom: { from: 1.0, to: 1.1 },
    lineas: [
      { hablante: 'narrador', texto: 'Ah, y el Coso no vino solo: su caída agujereó el tiempo.' },
      { hablante: 'narrador', texto: 'Desde entonces llueven anacronismos — gente de otras épocas, palabras que aún no existen, acentos de ciudades sin fundar.' },
      { hablante: 'narrador', texto: 'La burocracia ya tiene un formulario para eso. La cola da la vuelta a la catedral.' },
    ],
  },
];

/**
 * PARTE II — «Los Cuatro»: se reproduce UNA sola vez, tras las primeras
 * victorias de la run, cuando los caminos de los héroes se cruzan.
 */
export const PANELES_PARTE2: PanelIntro[] = [
  {
    key: 'intro_6_heroes',
    zoom: { from: 1.08, to: 1.0 },
    lineas: [
      { hablante: 'narrador', texto: 'Sobreviviste a los matones del Gremio. Enhorabuena: ya llamaste la atención equivocada.' },
      { hablante: 'narrador', texto: 'Y no eres la única alma con malas ideas: entre los caídos, los estafados y los desahuciados... otros tres también suben la pirámide hacia el Coso.' },
      { hablante: 'ingeniera', texto: '¡Avemaría pues! Yo NO construí esa vaina... pero si resulta que vale plata, la patente es mía, ¿oyó, home?' },
      { hablante: 'clerigo', texto: 'La Freidora da, mare, y la Freidora quita el aceite. Y el diezmo... el diezmo lo recojo yo, ¿va?' },
      { hablante: 'historiadora', texto: 'Es un electrodoméstico de cocina. Calienta aire y lo hace circular. ¿Por qué aplauden? No... no aplaudan.' },
      { hablante: 'reparador', texto: 'Tranqui, papi. Yo la rooteo, le meto firmware pirata, y el reino entero paga suscripción. Plan Bendito.' },
      { hablante: 'brayan', texto: '¡Bros! ¿Suben la pirámide? Tengo cartas, pociones y un dealcito en— ¿a dónde van? ¡MI TABERNA QUEDA DE CAMINO!' },
      { hablante: 'narrador', texto: 'Y ese es Brayan. Es de aquí — su madre lo confirma a gritos. Le comprarás cosas igualmente. Todos lo hacen.' },
      { hablante: 'narrador', texto: 'Sus razones son igual de malas. De momento cada quien va por su cuenta... pero la pirámide es estrecha, y arriba solo cabe una verdad.' },
    ],
  },
];

/** Compatibilidad: la intro completa (para la versión compartible). */
export const PANELES_INTRO: PanelIntro[] = [...PANELES_PARTE1, ...PANELES_PARTE2];
