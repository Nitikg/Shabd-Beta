import { useCallback, useEffect, useRef, useState } from 'react';

type PlayOptions = {
  language: 'en' | 'hi';
};

type PlayResult = { ok: boolean; used: 'elevenlabs' | 'browser'; error?: string };

/* ------------------------------------------------------------------ */
/*  ElevenLabs TTS — primary path                                     */
/* ------------------------------------------------------------------ */

// Reusable audio element — avoids creating/destroying on every utterance
let sharedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!sharedAudio && typeof window !== 'undefined') {
    sharedAudio = new Audio();
  }
  return sharedAudio!;
}

async function speakWithElevenLabs(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return false;

    const blob = await res.blob();
    if (blob.size === 0) return false;

    const url = URL.createObjectURL(blob);
    const audio = getAudio();

    return new Promise<boolean>((resolve) => {
      audio.src = url;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.onended = null;
        audio.onerror = null;
      };

      audio.onended = () => {
        cleanup();
        resolve(true);
      };

      audio.onerror = () => {
        cleanup();
        resolve(false);
      };

      audio.play().catch(() => {
        cleanup();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

function stopElevenLabs() {
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Browser SpeechSynthesis — fallback                                */
/* ------------------------------------------------------------------ */

let voiceCache: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);

  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) {
    voiceCache = immediate;
    return Promise.resolve(immediate);
  }

  return new Promise((resolve) => {
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        const voices = window.speechSynthesis.getVoices();
        voiceCache = voices;
        resolve(voices);
      },
      { once: true }
    );
    window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

function selectVoice(voices: SpeechSynthesisVoice[], language: 'en' | 'hi'): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const checks: Array<(v: SpeechSynthesisVoice) => boolean> =
    language === 'hi'
      ? [
          (v) => v.name === 'Google हिन्दी',
          (v) => v.lang === 'hi-IN' && v.name.includes('Google'),
          (v) => v.lang.startsWith('hi'),
          (v) => v.name === 'Google UK English Female',
          (v) => v.lang.startsWith('en') && v.name.includes('Google'),
        ]
      : [
          (v) => v.name === 'Google UK English Female',
          (v) => v.lang === 'en-IN' && v.name.includes('Google'),
          (v) => v.lang === 'en-GB' && v.name.includes('Google'),
          (v) => v.lang.startsWith('en-') && v.name.includes('Google'),
          (v) => v.lang === 'en-IN',
        ];

  for (const check of checks) {
    const match = voices.find(check);
    if (match) return match;
  }

  return voices.find((v) => v.lang.startsWith(language === 'hi' ? 'hi' : 'en')) ?? null;
}

async function speakWithWebSpeech(text: string, language: 'en' | 'hi'): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('speechSynthesis' in window)) return false;

  const voices = voiceCache ?? (await loadVoices());
  const voice = selectVoice(voices, language);

  return new Promise<boolean>((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utter.rate = 0.85;
      utter.pitch = 1.1;
      utter.volume = 1.0;
      if (voice) utter.voice = voice;

      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      resolve(false);
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useVoiceOutput() {
  const [isPlaying, setIsPlaying] = useState(false);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    stopElevenLabs();
    if (typeof window !== 'undefined') {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
  }, []);

  // Preload browser voices as fallback
  useEffect(() => {
    loadVoices().catch(() => {});
  }, []);

  const play = useCallback(
    async (text: string, opts: PlayOptions): Promise<PlayResult> => {
      stop();
      stoppedRef.current = false;
      setIsPlaying(true);

      // Try ElevenLabs first
      const elOk = await speakWithElevenLabs(text);
      if (stoppedRef.current) {
        setIsPlaying(false);
        return { ok: false, used: 'elevenlabs', error: 'Stopped' };
      }
      if (elOk) {
        setIsPlaying(false);
        return { ok: true, used: 'elevenlabs' };
      }

      // Fallback to browser TTS
      const browserOk = await speakWithWebSpeech(text, opts.language);
      setIsPlaying(false);
      if (stoppedRef.current) {
        return { ok: false, used: 'browser', error: 'Stopped' };
      }
      if (!browserOk) {
        return {
          ok: false,
          used: 'browser',
          error: 'Speech synthesis is not available in this browser.',
        };
      }
      return { ok: true, used: 'browser' };
    },
    [stop]
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { isPlaying, play, stop };
}
