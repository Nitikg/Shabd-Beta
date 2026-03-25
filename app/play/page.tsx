'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KikiCharacter, type KikiState } from '@/components/KikiCharacter';
import { SpeechBubble } from '@/components/SpeechBubble';
import { ChildTranscript } from '@/components/ChildTranscript';
import { SessionTimer } from '@/components/SessionTimer';
import { ProgressDots } from '@/components/ProgressDots';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSession, type SessionLimits } from '@/hooks/useSession';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';
import type { KidProfile } from '@/lib/kidProfile';
import { getSessionConfig } from '@/lib/promptBuilder';

const MAX_SESSIONS = 3;

const OPENERS: Record<'en' | 'hi', string[]> = {
  en: [
    "Hi there! I am Kiki! What is your name? I love meeting new friends!",
    "Namaste! I am Kiki! Can you tell me what your favourite animal is?",
    "Hello hello! I am Kiki! Shall we tell a story together today?"
  ],
  hi: [
    "Namaste! Main hoon Kiki! Tumhara naam kya hai? Mujhe naye doston se milna bahut pasand hai!",
    "Arre wah! Main hoon Kiki! Tumhara favourite animal kaun sa hai?",
    "Hello hello! Main hoon Kiki! Aaj hum saath mein ek kahaani sunaayein?"
  ]
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLang(): 'en' | 'hi' {
  if (typeof window === 'undefined') return 'en';
  // Migrate stale key from old Mithu branding
  const legacy = localStorage.getItem('mithu:lang');
  if (legacy) {
    localStorage.setItem('kiki:lang', legacy);
    localStorage.removeItem('mithu:lang');
  }
  const v = localStorage.getItem('kiki:lang');
  return v === 'hi' ? 'hi' : 'en';
}

type UiStatus = 'ready' | 'listening' | 'thinking' | 'speaking' | 'ended';

export default function PlayPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'hi'>(getLang);
  const [sessionLimits, setSessionLimits] = useState<SessionLimits | undefined>(undefined);
  const session = useSession(language, sessionLimits);
  const voice = useVoiceOutput();
  const speech = useSpeechRecognition(language);

  const [status, setStatus] = useState<UiStatus>('ready');
  const [hasStarted, setHasStarted] = useState(false);
  const [kikiText, setKikiText] = useState('');
  const [childText, setChildText] = useState('');
  const [parentError, setParentError] = useState<string | null>(null);

  // Kid profile state (populated when ?kid= param is present)
  const [kidId, setKidId] = useState<string | null>(null);
  const [kid, setKid] = useState<KidProfile | null>(null);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [kidLoading, setKidLoading] = useState(true);

  const sessionSavedRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const autoListen = true;

  // Read ?kid= from URL on mount and load kid profile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('kid');

    if (!id) {
      setKidLoading(false);
      return;
    }

    setKidId(id);

    fetch(`/api/kid?id=${encodeURIComponent(id)}`)
      .then((r) => {
        if (r.status === 404) {
          router.replace('/done');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const profile: KidProfile = data.kid;

        if (!profile) {
          setKidLoading(false);
          return;
        }

        // Block if max sessions reached
        if (profile.sessionCount >= MAX_SESSIONS) {
          router.replace('/done');
          return;
        }

        setKid(profile);
        const sNum = profile.sessionCount + 1;
        setSessionNumber(sNum);
        setSessionLimits(getSessionConfig(profile.ageYears, sNum));

        // Use kid's preferred language
        const lang = profile.language === 'hi' ? 'hi' : 'en';
        setLanguage(lang);
        localStorage.setItem('kiki:lang', lang);

        setKidLoading(false);
      })
      .catch(() => setKidLoading(false));
  }, [router]);

  const kikiState: KikiState = useMemo(() => {
    if (status === 'listening') return 'listening';
    if (status === 'thinking') return 'thinking';
    if (status === 'speaking') return 'speaking';
    return 'idle';
  }, [status]);

  const safeSpeak = useCallback(async (text: string) => {
    setStatus('speaking');
    setKikiText(text);
    session.addMessage({ role: 'assistant', content: text });
    const result = await voice.play(text, { language });
    if (!result.ok) {
      setParentError(
        'Kiki is having trouble playing sound in this browser. For best experience, try Android Chrome or desktop Chrome.'
      );
    }
    // Use ref instead of session.isEnded to avoid stale closure after async await
    if (sessionEndedRef.current) return;
    setStatus(autoListen ? 'listening' : 'ready');
    if (autoListen) speech.startListening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, voice, session.addMessage, speech.startListening]);

  const callChat = async (msgs: Array<{ role: string; content: string }>) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: msgs,
        kidId: kidId ?? null,
        sessionNumber
      })
    });
    if (!res.ok) throw new Error('chat failed');
    const data = (await res.json()) as { text?: string };
    const text = (data.text || '').trim();
    if (!text) throw new Error('empty');
    return text;
  };

  const handleStart = async () => {
    if (hasStarted) return;
    setParentError(null);
    setHasStarted(true);

    if (kid) {
      // Kid session: let the AI open with the child's name using the dynamic system prompt
      setStatus('thinking');
      try {
        const text = await callChat([{ role: 'user', content: '[session started]' }]);
        await safeSpeak(text);
      } catch {
        await safeSpeak(`Namaste ${kid.name}! Main hoon Kiki! Aaj hum ek kahaani sunaate hain!`);
      }
    } else {
      // Anonymous session: use hardcoded opener
      await safeSpeak(pick(OPENERS[language]));
    }
  };

  const saveSession = async () => {
    if (sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          kidId: kidId ?? null,
          kidName: kid?.name ?? '',
          sessionNumber,
          startedAt: session.summary.startedAt,
          endedAt: session.summary.endedAt ?? Date.now(),
          durationSeconds: session.summary.durationSeconds,
          turnCount: session.summary.turnCount,
          language,
          messages: session.summary.messages
        })
      });
    } catch {
      // Best-effort — never block the user flow
    }
  };

  // Save on tab close / navigation away — sendBeacon works even as the page unloads
  useEffect(() => {
    const handleUnload = () => {
      if (sessionSavedRef.current) return;
      if (!hasStarted || session.summary.messages.length === 0) return;
      const payload = JSON.stringify({
        sessionId: session.sessionId,
        kidId: kidId ?? null,
        kidName: kid?.name ?? '',
        sessionNumber,
        startedAt: session.summary.startedAt,
        endedAt: Date.now(),
        durationSeconds: Math.floor((Date.now() - session.summary.startedAt) / 1000),
        turnCount: session.summary.turnCount,
        language,
        messages: session.summary.messages
      });
      navigator.sendBeacon('/api/session', new Blob([payload], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  // session.summary changes every turn — that's intentional so we always have the latest messages
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, session.summary, kidId, sessionNumber, language]);

  useEffect(() => {
    if (!speech.error) return;
    setParentError(speech.error);
    safeSpeak("Hmm, I didn't quite catch that! Can you say it again?").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.error]);

  useEffect(() => {
    if (!session.isEnded) return;
    sessionEndedRef.current = true;
    setStatus('ended');
    const goodbye =
      "That was so much fun! You are really clever! Tell your Mamma or Papa what we talked about today. Bye bye!";
    saveSession()
      .then(() => safeSpeak(goodbye))
      .catch(() => safeSpeak(goodbye).catch(() => {}))
      .finally(() => {
        window.setTimeout(() => router.replace('/feedback'), 2500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isEnded]);

  useEffect(() => {
    if (status !== 'listening') return;
    if (!speech.isListening) return;
    setChildText((speech.interimTranscript || speech.transcript).trim());
  }, [speech.interimTranscript, speech.isListening, speech.transcript, status]);

  useEffect(() => {
    if (status !== 'listening') return;
    if (speech.isListening) return;
    const finalText = speech.transcript.trim();
    if (!finalText) return;
    setChildText(finalText);
    session.addMessage({ role: 'user', content: finalText });
    setStatus('thinking');
    setParentError(null);

    (async () => {
      try {
        const text = await callChat(
          session.messages.concat({ role: 'user', content: finalText })
        );
        await safeSpeak(text);
      } catch {
        await safeSpeak("Oops, I got confused for a second! Let us try again!");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening]);

  const endNow = () => session.endSession();

  const statusText = !hasStarted
    ? 'Tap once to start talking to Kiki.'
    : status === 'listening'
      ? 'Kiki is listening…'
      : status === 'thinking'
        ? 'Kiki is thinking…'
        : status === 'speaking'
          ? 'Kiki is speaking…'
          : status === 'ended'
            ? 'Session ending…'
            : 'Kiki will listen to you…';

  // Show nothing while checking kid profile to avoid flash of wrong UI
  if (kidLoading) {
    return (
      <main className="kiki-gradient-bg min-h-screen flex items-center justify-center">
        <div className="font-[var(--font-baloo)] text-kiki-indigo/60 text-lg">Loading…</div>
      </main>
    );
  }

  return (
    <main className="kiki-gradient-bg min-h-screen px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SessionTimer remainingSeconds={session.remainingSeconds} />
            <ProgressDots turnCount={session.turnCount} max={session.maxTurns} />
          </div>
          <div className="flex items-center gap-2">
            {kid && (
              <span className="font-[var(--font-nunito)] text-sm text-kiki-indigo/60">
                {kid.name} · Session {sessionNumber}
              </span>
            )}
            <button
              type="button"
              onClick={endNow}
              className="rounded-full bg-white/70 px-3 py-2 text-sm shadow-soft"
              aria-label="End session"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-1 flex-col items-center gap-4">
          <button type="button" onClick={handleStart} className="flex flex-col items-center gap-3">
            <KikiCharacter state={kikiState} className="scale-[1.08]" />
            {!hasStarted && (
              <span className="rounded-3xl bg-kiki-orange px-5 py-2 text-sm font-[var(--font-baloo)] text-white shadow-soft">
                Tap to begin ✨
              </span>
            )}
          </button>
          <SpeechBubble text={kikiText} />
          <ChildTranscript text={childText} />
          {parentError ? (
            <div className="kiki-card w-full max-w-md px-4 py-3 text-sm text-red-700">
              {parentError}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 pb-4 pt-3 text-center text-sm font-[var(--font-nunito)] text-kiki-indigo/70">
          {statusText}
        </div>
      </div>
    </main>
  );
}
