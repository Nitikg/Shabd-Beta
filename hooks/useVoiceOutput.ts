import { useCallback, useEffect, useState } from 'react';

type PlayOptions = {
  language: 'en' | 'hi';
};

type PlayResult = { ok: boolean; used: 'browser'; error?: string };

// Module-level cache — voices load once, reused across calls
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
    // Safety fallback — some browsers never fire voiceschanged
    window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

function selectVoice(voices: SpeechSynthesisVoice[], language: 'en' | 'hi'): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  // Prefer Google neural voices — noticeably warmer than system/Microsoft defaults.
  // Priority order matters: most to least preferred.
  const checks: Array<(v: SpeechSynthesisVoice) => boolean> =
    language === 'hi'
      ? [
          (v) => v.name === 'Google हिन्दी',
          (v) => v.lang === 'hi-IN' && v.name.includes('Google'),
          (v) => v.lang.startsWith('hi'),
          // Hinglish fallback: warm English voice reads Roman Hindi words fine
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
      utter.rate = 0.85;  // slightly slower — children process speech more slowly than adults
      utter.pitch = 1.1;  // slightly higher — sounds more animated and friendly
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

export function useVoiceOutput() {
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
  }, []);

  // Preload voices on mount so the first utterance isn't delayed by voice discovery
  useEffect(() => {
    loadVoices().catch(() => {});
  }, []);

  const play = useCallback(
    async (text: string, opts: PlayOptions) => {
      stop();
      setIsPlaying(true);
      const ok = await speakWithWebSpeech(text, opts.language);
      setIsPlaying(false);
      if (!ok) {
        return {
          ok: false,
          used: 'browser',
          error: 'Browser speech synthesis is not available.'
        } satisfies PlayResult;
      }
      return { ok: true, used: 'browser' } satisfies PlayResult;
    },
    [stop]
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { isPlaying, play, stop };
}
