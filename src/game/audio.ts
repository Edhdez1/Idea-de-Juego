import Phaser from 'phaser';

/**
 * Audio con fallback silencioso: si el archivo no cargó (o el navegador
 * bloquea el sonido) el juego sigue exactamente igual. JAMÁS romper por
 * un asset ausente.
 */

/** Archivos de audio (cargados en Preload con loaderror → warn). */
export const AUDIO_FILES: { key: string; file: string }[] = [
  { key: 'musica_taberna', file: 'assets/audio/musica_taberna.ogg' },
  { key: 'musica_combate', file: 'assets/audio/musica_combate.ogg' },
  { key: 'sfx_carta', file: 'assets/audio/sfx_carta.wav' },
  { key: 'sfx_robo', file: 'assets/audio/sfx_robo.wav' },
  { key: 'sfx_golpe', file: 'assets/audio/sfx_golpe.wav' },
  { key: 'sfx_bloqueo', file: 'assets/audio/sfx_bloqueo.wav' },
  { key: 'sfx_explosion', file: 'assets/audio/sfx_explosion.wav' },
  { key: 'sfx_click', file: 'assets/audio/sfx_click.wav' },
  { key: 'sfx_victoria', file: 'assets/audio/sfx_victoria.wav' },
  { key: 'sfx_derrota', file: 'assets/audio/sfx_derrota.wav' },
  { key: 'sfx_oro', file: 'assets/audio/sfx_oro.wav' },
];

/** Pista de música en curso (el sound manager es global al juego). */
let musicaActual: Phaser.Sound.BaseSound | null = null;
let musicaKey = '';

function disponible(scene: Phaser.Scene, key: string): boolean {
  return Boolean(scene.sound) && scene.cache.audio.exists(key);
}

/** Efecto de sonido puntual; no hace nada si la key no está en cache. */
export function sonar(
  scene: Phaser.Scene,
  key: string,
  config?: Phaser.Types.Sound.SoundConfig,
): void {
  try {
    if (!disponible(scene, key)) return;
    scene.sound.play(key, config);
  } catch {
    // el audio es opcional: nunca rompe el juego
  }
}

/** Música en loop; si la misma pista ya suena, no la reinicia. */
export function musica(
  scene: Phaser.Scene,
  key: string,
  config?: Phaser.Types.Sound.SoundConfig,
): void {
  try {
    if (!disponible(scene, key)) return;
    if (musicaActual && musicaKey === key && musicaActual.isPlaying) return;
    detenerMusica();
    musicaActual = scene.sound.add(key, { loop: true, ...config });
    musicaKey = key;
    musicaActual.play();
  } catch {
    // el audio es opcional: nunca rompe el juego
  }
}

export function detenerMusica(): void {
  try {
    musicaActual?.stop();
    musicaActual?.destroy();
  } catch {
    // ya estaba destruida
  }
  musicaActual = null;
  musicaKey = '';
}
