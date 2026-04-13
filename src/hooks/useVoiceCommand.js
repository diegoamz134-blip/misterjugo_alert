import { useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { confirmCookingForArea, markReadyForArea, markPaseForArea, resetTableForArea } from '../services/firebase';

// ── Plugin nativo (solo se carga si está disponible) ─────────────
let SpeechRecognitionPlugin = null;
const loadNativePlugin = async () => {
  if (SpeechRecognitionPlugin) return SpeechRecognitionPlugin;
  try {
    const mod = await import('@capacitor-community/speech-recognition');
    SpeechRecognitionPlugin = mod.SpeechRecognition;
    return SpeechRecognitionPlugin;
  } catch (e) {
    return null;
  }
};

// ── Diccionario de números en español ───────────────────────────
const NUMBER_WORDS = {
  'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
  'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
  'dieciseis': 16, 'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18,
  'diecinueve': 19, 'veinte': 20, 'veintiuno': 21, 'veintidos': 22,
  'veintidós': 22, 'veintitres': 23, 'veintitrés': 23, 'veinticuatro': 24,
  'veinticinco': 25, 'veintiseis': 26, 'veintiséis': 26, 'veintisiete': 27,
  'veintiocho': 28, 'veintinueve': 29, 'treinta': 30,
  'treinta y uno': 31, 'treinta y dos': 32, 'treinta y tres': 33,
  'treinta y cuatro': 34, 'treinta y cinco': 35, 'treinta y seis': 36,
  'treinta y siete': 37, 'treinta y ocho': 38, 'treinta y nueve': 39,
  'cuarenta': 40,
};

const wordToNumber = (text) => {
  const direct = parseInt(text, 10);
  if (!isNaN(direct)) return direct;
  return NUMBER_WORDS[text.toLowerCase().trim()] || null;
};

const extractTableNumber = (text) => {
  const mesaMatch = text.match(/mesa\s+([a-záéíóúüñ\d\s]+?)(?:\s+(?:list|recib|confirm|cancel|terminad|empez|preparand|pase)|$)/i);
  if (mesaMatch) {
    const raw = mesaMatch[1].trim();
    const num = wordToNumber(raw);
    if (num) return num;
    const multiMatch = raw.match(/(\w+)\s+y\s+(\w+)/);
    if (multiMatch) {
      const num2 = NUMBER_WORDS[`${multiMatch[1]} y ${multiMatch[2]}`.toLowerCase()];
      if (num2) return num2;
    }
  }
  const numMatch = text.match(/\b(\d+)\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  for (const w of text.toLowerCase().split(/\s+/)) {
    const n = NUMBER_WORDS[w];
    if (n) return n;
  }
  return null;
};

const speak = (text) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = navigator.language || 'es';
    utt.rate = 1.0;
    utt.volume = 1;
    window.speechSynthesis.speak(utt);
  } catch (e) {}
};

// Idiomas web fallback
const LANG_FALLBACKS = ['es-ES', 'es-US', 'es', 'en-US'];

// ── Hook principal ───────────────────────────────────────────────
export const useVoiceCommand = (area = 'cocina') => {
  const [listening, setListening]   = useState(false);
  const [feedback, setFeedback]     = useState(null);
  const recognitionRef              = useRef(null);
  const feedbackTimerRef            = useRef(null);
  const areaRef                     = useRef(area);
  areaRef.current = area;

  const isNative = Capacitor.isNativePlatform();
  const hasWebSpeech = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Siempre soportado en nativo (plugin), o si hay Web Speech API
  const isSupported = isNative || hasWebSpeech;

  const showFeedback = useCallback((type, text) => {
    setFeedback({ type, text });
    clearTimeout(feedbackTimerRef.current);
    if (type !== 'info') {
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 4000);
    }
  }, []);

  const parseAndExecute = useCallback(async (transcript) => {
    const text = transcript.toLowerCase();
    const isLista    = /list[ao]|terminad[ao]/.test(text);
    const isPase     = /pase|parcial/.test(text);
    const isRecibida = /recibid[ao]|aceptad[ao]|confirm|preparand|empez/.test(text);
    const isCancelar = /cancel[ae]r?|quitar?|borrar?/.test(text);
    const forceJugo  = /jugo|jugos|bebida|vaso/.test(text);
    const effectiveArea = forceJugo ? 'jugo' : areaRef.current;
    const tableNumber = extractTableNumber(text);

    if (!tableNumber || tableNumber < 1 || tableNumber > 40) {
      showFeedback('error', `No entendí la mesa. Escuché: "${transcript}"`);
      speak('No entendí el número de mesa.');
      return;
    }

    try {
      if (isPase) {
        await markPaseForArea(tableNumber, effectiveArea);
        showFeedback('success', `🔔 Mesa ${tableNumber} — Pase parcial`);
        speak(`Mesa ${tableNumber}, pase.`);
      } else if (isLista) {
        await markReadyForArea(tableNumber, effectiveArea);
        showFeedback('success', `✅ Mesa ${tableNumber} marcada como lista`);
        speak(`Mesa ${tableNumber}, lista.`);
      } else if (isRecibida) {
        await confirmCookingForArea(tableNumber, effectiveArea);
        showFeedback('success', `🔥 Mesa ${tableNumber} en preparación`);
        speak(`Mesa ${tableNumber}, recibida.`);
      } else if (isCancelar) {
        await resetTableForArea(tableNumber, effectiveArea);
        showFeedback('success', `↩️ Mesa ${tableNumber} cancelada`);
        speak(`Mesa ${tableNumber}, cancelada.`);
      } else {
        showFeedback('error', `No entendí la acción. Escuché: "${transcript}"`);
        speak('Di lista, pase, recibida o cancelar.');
      }
    } catch (e) {
      showFeedback('error', 'Error al actualizar. Intenta de nuevo.');
      speak('Hubo un error.');
    }
  }, [showFeedback]);

  // ═══════════════════════════════════════════════════════════════
  // NATIVO: Usa @capacitor-community/speech-recognition
  // ═══════════════════════════════════════════════════════════════
  const startNative = useCallback(async () => {
    try {
      const SR = await loadNativePlugin();
      if (!SR) {
        showFeedback('error', 'Plugin de voz no disponible.');
        return;
      }

      // Pedir permiso si no lo tiene
      const { speechRecognition } = await SR.checkPermissions();
      if (speechRecognition !== 'granted') {
        const result = await SR.requestPermissions();
        if (result.speechRecognition !== 'granted') {
          showFeedback('error', 'Permiso de micrófono denegado. Actívalo en Ajustes.');
          return;
        }
      }

      setListening(true);
      showFeedback('info', '🎤 Escuchando... habla ahora');

      // Escuchar resultados parciales
      const listener = await SR.addListener('partialResults', (data) => {
        // data.matches es un array de transcripciones posibles
        if (data.matches && data.matches.length > 0) {
          const best = data.matches[0];
          if (best && best.trim().length > 0) {
            showFeedback('info', `🎤 "${best}"`);
          }
        }
      });

      await SR.start({
        language: 'es-ES',
        maxResults: 3,
        popup: false,          // No mostrar el popup nativo de Google
        partialResults: true,
      });

      // Esperar resultado final
      // El plugin emite 'partialResults' y cuando termina, devuelve el resultado
      // Usamos un listener de fin
      const endListener = await SR.addListener('listeningState', async (state) => {
        if (state.status === 'stopped') {
          setListening(false);
          listener.remove();
          endListener.remove();
        }
      });

      // Timeout: detener después de 8 segundos si no dice nada
      setTimeout(async () => {
        try {
          const result = await SR.stop();
          setListening(false);
          listener.remove();
          endListener.remove();

          if (result && result.matches && result.matches.length > 0 && result.matches[0].trim()) {
            parseAndExecute(result.matches[0]);
          } else {
            showFeedback('error', 'No se detectó voz. Toca e intenta de nuevo.');
          }
        } catch (e) {
          setListening(false);
        }
      }, 8000);

    } catch (e) {
      setListening(false);
      showFeedback('error', `Error de micrófono: ${e.message || 'desconocido'}`);
    }
  }, [showFeedback, parseAndExecute]);

  const stopNative = useCallback(async () => {
    try {
      const SR = await loadNativePlugin();
      if (SR) {
        const result = await SR.stop();
        if (result && result.matches && result.matches.length > 0 && result.matches[0].trim()) {
          parseAndExecute(result.matches[0]);
        }
      }
    } catch (e) {}
    setListening(false);
  }, [parseAndExecute]);

  // ═══════════════════════════════════════════════════════════════
  // WEB: Usa Web Speech API (solo Chrome)
  // ═══════════════════════════════════════════════════════════════
  const launchWebRecognition = useCallback((langIndex = 0) => {
    const lang = LANG_FALLBACKS[langIndex] || 'es';
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      showFeedback('info', '🎤 Escuchando... habla ahora');
    };

    recognition.onresult = (event) => {
      const transcripts = Array.from(event.results[0]).map((r) => r.transcript);
      parseAndExecute(transcripts[0]);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'no-speech') {
        showFeedback('error', 'No se detectó voz. Toca el botón e intenta de nuevo.');
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        showFeedback('error', 'Permiso de micrófono denegado. Revísalo en el navegador.');
      } else if (event.error === 'network') {
        const nextIndex = langIndex + 1;
        if (nextIndex < LANG_FALLBACKS.length) {
          launchWebRecognition(nextIndex);
        } else {
          showFeedback('error', 'No hay conexión al servicio de voz. Verifica internet.');
        }
      } else if (event.error === 'audio-capture') {
        showFeedback('error', 'No se detectó micrófono en el dispositivo.');
      } else {
        showFeedback('error', `Error de voz: ${event.error}. Intenta de nuevo.`);
      }
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setListening(false);
      showFeedback('error', 'No se pudo iniciar el micrófono. Intenta de nuevo.');
    }
  }, [showFeedback, parseAndExecute]);

  // ═══════════════════════════════════════════════════════════════
  // API pública
  // ═══════════════════════════════════════════════════════════════
  const startListening = useCallback(() => {
    if (!isSupported || listening) return;
    if (isNative) {
      startNative();
    } else {
      launchWebRecognition(0);
    }
  }, [isSupported, listening, isNative, startNative, launchWebRecognition]);

  const stopListening = useCallback(() => {
    if (isNative) {
      stopNative();
    } else {
      try { recognitionRef.current?.stop(); } catch (e) {}
      setListening(false);
    }
  }, [isNative, stopNative]);

  return { listening, feedback, isSupported, startListening, stopListening };
};
