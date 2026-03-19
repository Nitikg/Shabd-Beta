'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MithuCharacter, type MithuState } from '@/components/MithuCharacter';
import { SpeechBubble } from '@/components/SpeechBubble';
import { ChildTranscript } from '@/components/ChildTranscript';
import { SessionTimer } from '@/components/SessionTimer';
import { ProgressDots } from '@/components/ProgressDots';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSession } from '@/hooks/useSession';
import { useVoiceOutput } from '@/hooks/useVoiceOutput';

const OPENERS: Record<'en' | 'hi', string[]> = {
  en: [
    "Hi there! I am Mithu! What is your name? I love meeting new friends!",
    "Namaste! I am Mithu the parrot! Can you tell me what your favourite animal is?",
    "Hello hello! I am Mithu! Shall we tell a story together today?"
  ],
  hi: [
    "Namaste! Main hoon Mithu! Tumhara naam kya hai? Mujhe naye doston se milna bahut pasand hai!",
    "Arre wah! Main hoon Mithu, ek pyara sa parrot! Tumhara favourite animal kaun sa hai?",
    "Hello hello! Main hoon Mithu! Aaj hum saath mein ek kahaani sunaayein?"
  ]
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLang(): 'en' | 'hi' {
  if (typeof window === 'undefined') return 'en';
  const v = localStorage.getItem('mithu:lang');
  return v === 'hi' ? 'hi' : 'en';
}

type UiStatus = 'ready' | 'listening' | 'thinking' | 'speaking' | 'ended';

export default function PlayPage() {
  const router = useRouter();
  const [language] = useState<'en' | 'hi'>(getLang);
  const session = useSession(language);
  const voice = useVoiceOutput();
  const speech = useSpeechRecognition(language);

  const [status, setStatus] = useState<UiStatus>('ready');
  const [hasStarted, setHasStarted] = useState(false);
  const autoListen = true;
  const [mithuText, setMithuText] = useState('');
  const [childText, setChildText] = useState('');
  const [parentError, setParentError] = useState<string | null>(null);
  const greetedRef = useRef(false);

  const mithuState: MithuState = useMemo(() => {
    if (status === 'listening') return 'listening';
    if (status === 'thinking') return 'thinking';
    if (status === 'speaking') return 'speaking';
    return 'idle';
  }, [status]);

  const safeSpeak = async (text: string) => {
    setStatus('speaking');
    setMithuText(text);
    session.addMessage({ role: 'assistant', content: text });
    const result = await voice.play(text, { language });
    if (!result.ok) {
      setParentError(
        'Mithu is having trouble playing sound in this browser. For best experience, try Android Chrome or desktop Chrome.'
      );
    }
    if (session.isEnded) return;
    setStatus(autoListen ? 'listening' : 'ready');
    if (autoListen) speech.startListening();
  };

  const handleStart = async () => {
    if (hasStarted) return;
    setParentError(null);
    setHasStarted(true);
    const opener = pick(OPENERS[language]);
    await safeSpeak(opener);
  };

  useEffect(() => {
    if (!speech.error) return;
    setParentError(speech.error);
    // child-friendly retry line
    safeSpeak("Hmm, I didn't quite catch that! Can you say it again?").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.error]);

  useEffect(() => {
    if (!session.isEnded) return;
    setStatus('ended');
    const goodbye =
      "That was so much fun! You're really clever! Tell your Mamma or Papa what we talked about today. Bye bye!";
    safeSpeak(goodbye)
      .catch(() => {})
      .finally(() => {
        window.setTimeout(() => router.replace('/feedback'), 2500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isEnded]);

  useEffect(() => {
    if (status !== 'listening') return;
    if (!speech.isListening) return;
    // show realtime interim
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
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: session.messages.concat({ role: 'user', content: finalText }) })
        });
        if (!res.ok) throw new Error('chat failed');
        const data = (await res.json()) as { text?: string };
        const text = (data.text || '').trim();
        if (!text) throw new Error('empty');
        await safeSpeak(text);
      } catch {
        await safeSpeak("Oops, I got confused for a second! Let's try again!");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening]);

  const endNow = () => {
    session.endSession();
  };

  const statusText =
    !hasStarted
      ? 'Tap once to start talking to Mithu.'
      : status === 'listening'
        ? 'Mithu is listening…'
        : status === 'thinking'
          ? 'Mithu is thinking…'
          : status === 'speaking'
            ? 'Mithu is speaking…'
            : status === 'ended'
              ? 'Session ending…'
              : 'Mithu will listen to you…';

  return (
    <main className="mithu-gradient-bg min-h-screen px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SessionTimer remainingSeconds={session.remainingSeconds} />
            <ProgressDots turnCount={session.turnCount} />
          </div>
          <div className="flex items-center gap-2">
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
            <MithuCharacter state={mithuState} className="scale-[1.08]" />
            {!hasStarted && (
              <span className="rounded-3xl bg-mithu-orange px-5 py-2 text-sm font-[var(--font-baloo)] text-white shadow-soft">
                Tap to begin ✨
              </span>
            )}
          </button>
          <SpeechBubble text={mithuText} />
          <ChildTranscript text={childText} />
          {parentError ? (
            <div className="mithu-card w-full max-w-md px-4 py-3 text-sm text-red-700">
              {parentError}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 pb-4 pt-3 text-center text-sm font-[var(--font-nunito)] text-mithu-indigo/70">
          {statusText}
        </div>
      </div>
    </main>
  );
}

