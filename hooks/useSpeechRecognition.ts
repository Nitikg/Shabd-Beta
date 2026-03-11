import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(language: 'en' | 'hi') {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  const supported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);
  const langCode = language === 'hi' ? 'hi-IN' : 'en-IN';

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  };

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langCode;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (e) => {
      const msg =
        e.error === 'not-allowed'
          ? 'Microphone permission was blocked.'
          : e.error === 'no-speech'
            ? "I couldn't hear anything."
            : 'Something went wrong with the microphone.';
      setError(msg);
      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();
    };

    recognition.onresult = (event) => {
      clearSilenceTimer();
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += text;
        else interim += text;
      }
      if (interim) setInterimTranscript(interim.trim());
      if (finalText) setTranscript((prev) => `${prev} ${finalText}`.trim());

      silenceTimerRef.current = window.setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }, 2000);
    };

    try {
      recognition.start();
    } catch {
      setError('Unable to start listening.');
    }
  }, [langCode]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  return {
    supported,
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    error
  };
}

