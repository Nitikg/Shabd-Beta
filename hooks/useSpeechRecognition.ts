import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

/* ------------------------------------------------------------------ */
/*  Platform detection                                                 */
/* ------------------------------------------------------------------ */

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Web Speech API works reliably on Android Chrome and desktop Chrome.
 *  On iOS (Safari + Chrome) it's unreliable — use Deepgram instead. */
function shouldUseDeepgram(): boolean {
  return isIOS() || !getSpeechRecognitionCtor();
}

/* ------------------------------------------------------------------ */
/*  Deepgram path — record audio via MediaRecorder, send to /api/stt  */
/* ------------------------------------------------------------------ */

function createDeepgramRecorder(
  language: string,
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onError: (msg: string) => void,
  onEnd: () => void,
) {
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let silenceTimer: number | null = null;
  let maxTimer: number | null = null;
  let analyser: AnalyserNode | null = null;
  let animFrameId: number | null = null;
  let audioContext: AudioContext | null = null;
  let stopped = false;
  let analyserWorking = false;

  const SILENCE_THRESHOLD = 15; // RMS level below which we consider silence
  const SILENCE_DURATION = 2000; // ms of silence before auto-stop
  const MAX_RECORDING_DURATION = 10000; // hard cap — 10 seconds

  function clearTimers() {
    if (silenceTimer) window.clearTimeout(silenceTimer);
    silenceTimer = null;
    if (maxTimer) window.clearTimeout(maxTimer);
    maxTimer = null;
  }

  function stopRecording() {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  async function start() {
    stopped = false;
    chunks = [];

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError('Microphone permission was blocked.');
      onEnd();
      return;
    }

    // Try to set up AudioContext for silence detection.
    // On iOS, AudioContext created outside a user gesture is suspended
    // and cannot be resumed — in that case we skip analyser-based silence
    // detection and rely on a max recording timer instead.
    try {
      audioContext = new AudioContext();

      // Attempt to resume — required on iOS but will fail without user gesture
      if (audioContext.state === 'suspended') {
        await audioContext.resume().catch(() => {});
      }

      if (audioContext.state === 'running') {
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserWorking = true;
      } else {
        // AudioContext couldn't resume (iOS without user gesture) — close it
        audioContext.close().catch(() => {});
        audioContext = null;
      }
    } catch {
      // AudioContext not available — proceed without it
      audioContext = null;
    }

    // Pick a supported mime type — order matters for cross-platform
    // iOS Safari: supports audio/mp4, NOT audio/webm
    // Android Chrome: supports audio/webm;codecs=opus
    // Desktop Chrome: supports both
    const mimeOptions = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      '',
    ];
    const mimeType = mimeOptions.find((m) =>
      m === '' || MediaRecorder.isTypeSupported(m)
    ) || '';

    try {
      mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      onError('Something went wrong with the microphone.');
      stream.getTracks().forEach((t) => t.stop());
      onEnd();
      return;
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      clearTimers();

      // Release mic immediately
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
      }

      if (chunks.length === 0) {
        onEnd();
        return;
      }

      onInterim('Processing...');

      const actualMime = mediaRecorder?.mimeType || 'audio/mp4';
      const ext = actualMime.includes('webm') ? 'webm'
        : actualMime.includes('ogg') ? 'ogg'
        : actualMime.includes('aac') ? 'aac'
        : 'mp4';
      const blob = new Blob(chunks, { type: actualMime });
      const formData = new FormData();
      formData.append('audio', blob, `recording.${ext}`);
      formData.append('language', language);

      try {
        const res = await fetch('/api/stt', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('STT request failed');
        const data = await res.json();
        const text = (data.transcript || '').trim();
        if (text) {
          onFinal(text);
        } else {
          onError("I couldn't hear anything.");
        }
      } catch {
        onError('Something went wrong with speech recognition.');
      }
      onEnd();
    };

    mediaRecorder.onerror = () => {
      onError('Something went wrong with the microphone.');
      onEnd();
    };

    mediaRecorder.start(250); // collect in 250ms chunks

    // Always set a hard max recording timer (safety net on all platforms,
    // primary stop mechanism on iOS where analyser doesn't work)
    maxTimer = window.setTimeout(() => {
      stopRecording();
    }, MAX_RECORDING_DURATION);

    // Silence detection via audio level monitoring — only when AudioContext is running
    if (analyserWorking && analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function checkAudioLevel() {
        if (stopped || !analyser) return;
        analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length) * 100;

        if (rms > SILENCE_THRESHOLD) {
          // Sound detected — reset silence timer
          if (silenceTimer) {
            window.clearTimeout(silenceTimer);
            silenceTimer = null;
          }
          onInterim('Listening...');
        } else if (!silenceTimer) {
          // Start silence countdown
          silenceTimer = window.setTimeout(() => {
            stopRecording();
          }, SILENCE_DURATION);
        }

        animFrameId = requestAnimationFrame(checkAudioLevel);
      }

      checkAudioLevel();
    } else {
      // No analyser (iOS) — just show listening state
      onInterim('Listening...');
    }
  }

  function stop() {
    stopped = true;
    clearTimers();
    if (animFrameId) cancelAnimationFrame(animFrameId);
    // stopRecording triggers onstop which will send audio to Deepgram
    stopRecording();
  }

  return { start, stop };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useSpeechRecognition(language: 'en' | 'hi') {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const deepgramRef = useRef<{ stop: () => void } | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  const useDeepgram = useMemo(() => shouldUseDeepgram(), []);
  const supported = useMemo(() => useDeepgram || Boolean(getSpeechRecognitionCtor()), [useDeepgram]);
  const langCode = language === 'hi' ? 'hi-IN' : 'en-IN';

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  };

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    if (useDeepgram) {
      // Deepgram path (iOS / no Web Speech API)
      setIsListening(true);

      const recorder = createDeepgramRecorder(
        language,
        (interim) => setInterimTranscript(interim),
        (final) => setTranscript(final),
        (msg) => setError(msg),
        () => setIsListening(false),
      );

      deepgramRef.current = recorder;
      recorder.start();
      return;
    }

    // Web Speech API path (Android / desktop Chrome)
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
  }, [langCode, language, useDeepgram]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (useDeepgram) {
      deepgramRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    }
  }, [useDeepgram]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (useDeepgram) {
        deepgramRef.current?.stop();
      } else {
        try {
          recognitionRef.current?.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [useDeepgram]);

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
