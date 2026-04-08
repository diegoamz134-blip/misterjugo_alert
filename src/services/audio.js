// ─────────────────────────────────────────────────────────────────
//  SONIDOS PARA MOZOS
// ─────────────────────────────────────────────────────────────────

/**
 * Alerta FUERTE para mozos cuando el pedido está listo.
 * 5 tonos ascendentes con onda senoidal clara.
 */
export const playAlertSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playBeep = (startTime, freq, duration = 0.18) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const t = ctx.currentTime;
    playBeep(t,        880);
    playBeep(t + 0.22, 1100);
    playBeep(t + 0.44, 1320);
    playBeep(t + 0.66, 1100);
    playBeep(t + 0.88, 1320);
  } catch (e) {
    console.warn('Audio API no disponible:', e.message);
  }
};

/**
 * Vibración intensa para mozos (pedido listo)
 */
export const vibrateDevice = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([400, 150, 400, 150, 700]);
    }
  } catch (e) {}
};

// ─────────────────────────────────────────────────────────────────
//  SONIDOS PARA COCINA
// ─────────────────────────────────────────────────────────────────

/**
 * Alerta MUY FUERTE para cocina cuando llega un pedido nuevo.
 *
 * Diseñada para ambientes con ruido:
 *  - Onda cuadrada (square) → más agresiva y penetrante que sine
 *  - Ganancia máxima (0.9) → lo más alto posible sin distorsión
 *  - Patrón: 3 ráfagas de 3 pitidos, con pausa entre ráfagas
 *  - Total duración: ~2.5 segundos imposible de ignorar
 */
export const playKitchenOrderSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Compresor para maximizar el volumen percibido sin clipear
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 3;
    compressor.ratio.value = 20;
    compressor.attack.value = 0;
    compressor.release.value = 0.1;
    compressor.connect(ctx.destination);

    const playBurst = (startTime, freq, dur = 0.12) => {
      // Oscilador principal (square = duro y cortante)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.value = freq;
      gain1.gain.setValueAtTime(0.9, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
      osc1.connect(gain1);
      gain1.connect(compressor);
      osc1.start(startTime);
      osc1.stop(startTime + dur);

      // Segundo oscilador en armónico (refuerza la presencia)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.value = freq * 2;
      gain2.gain.setValueAtTime(0.4, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
      osc2.connect(gain2);
      gain2.connect(compressor);
      osc2.start(startTime);
      osc2.stop(startTime + dur);
    };

    // ── Ráfaga 1 ──
    const t = ctx.currentTime;
    playBurst(t + 0.00, 880);
    playBurst(t + 0.15, 1100);
    playBurst(t + 0.30, 880);

    // ── Ráfaga 2 (pausa 0.2s) ──
    playBurst(t + 0.65, 1100);
    playBurst(t + 0.80, 1320);
    playBurst(t + 0.95, 1100);

    // ── Ráfaga 3 (pausa 0.2s): más aguda, el toque final ──
    playBurst(t + 1.30, 1320);
    playBurst(t + 1.45, 1600);
    playBurst(t + 1.60, 1320);

  } catch (e) {
    console.warn('Audio API no disponible:', e.message);
  }
};

/**
 * Sonido suave de confirmación para mozos
 * (cuando cocina confirma que está cocinando)
 */
export const playSoftConfirmSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};
