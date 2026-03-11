import { useCallback, useEffect, useRef, useState } from 'react';

type PlayOptions = {
  language: 'en' | 'hi';
};

type PlayResult = { ok: boolean; used: 'browser'; error?: string };

async function speakWithWebSpeech(text: string, language: 'en' | 'hi'): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('speechSynthesis' in window)) return false;

  return new Promise<boolean>((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utter.rate = 0.9;
      utter.pitch = 1.05;

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

