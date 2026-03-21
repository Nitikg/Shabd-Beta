'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MithuCharacter } from '@/components/MithuCharacter';
 
const COPY = {
  en: {
    headline: "Namaste! I'm Mithu",
    sub: "Your child's curious AI friend - tell me a story, ask me anything!",
    cta: "Start Talking",
    foot: "No login needed \u00b7 Free to try \u00b7 For ages 4-8",
    mic: "Mithu needs to hear your child's voice. Please allow microphone access.",
  },
  hi: {
    headline: "Namaste! \u092e\u0948\u0902 Mithu \u0939\u0942\u0901",
    sub: "\u092e\u0948\u0902 \u0906\u092a\u0915\u0947 \u092c\u091a\u094d\u091a\u0947 \u0915\u093e \u091c\u093f\u091c\u094d\u091e\u093e\u0938\u0941 AI \u0926\u094b\u0938\u094d\u0924 \u0939\u0942\u0901 - \u0915\u0939\u093e\u0928\u0940 \u0938\u0941\u0928\u093e\u0913, \u0915\u0941\u091b \u092d\u0940 \u092a\u0942\u091b\u094b!",
    cta: "Mithu \u0938\u0947 \u092c\u093e\u0924 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902",
    foot: "\u0915\u094b\u0908 \u0932\u0949\u0917\u093f\u0928 \u0928\u0939\u0940\u0902 \u00b7 \u092e\u0941\u092b\u094d\u0924 \u00b7 \u0909\u092e\u094d\u0930 4-8",
    mic: "Mithu \u0915\u094b \u0906\u092a\u0915\u0947 \u092c\u091a\u094d\u091a\u0947 \u0915\u0940 \u0906\u0935\u093e\u091c\u093c \u0938\u0941\u0928\u0928\u0940 \u0939\u0948\u0964 \u0915\u0943\u092a\u092f\u093e \u092e\u093e\u0907\u0915\u094d\u0930\u094b\u092b\u094b\u0928 \u0915\u0940 \u0905\u0928\u0941\u092e\u0924\u093f \u0926\u0947\u0902\u0964",
  }
};

function detectLanguage(): 'en' | 'hi' {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('mithu:lang');
  if (saved === 'hi' || saved === 'en') return saved;
  const nav = navigator.language || '';
  return nav.toLowerCase().startsWith('hi') ? 'hi' : 'en';
}

async function requestMic() {
  if (typeof navigator === 'undefined') return;
  if (!navigator.mediaDevices?.getUserMedia) return;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());
}

function playTinyChime() {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 880;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  o.stop(ctx.currentTime + 0.24);
  o.onended = () => ctx.close();
}

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [micError, setMicError] = useState<string | null>(null);

  useEffect(() => {
    setLang(detectLanguage());
  }, []);

  const t = useMemo(() => COPY[lang], [lang]);

  const start = async () => {
    setMicError(null);
    try {
      playTinyChime();
      await requestMic();
      localStorage.setItem('mithu:lang', lang);
      router.push('/play');
    } catch {
      setMicError(t.mic);
    }
  };

  return (
    <main className="mithu-gradient-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="font-[var(--font-baloo)] text-2xl tracking-tight text-mithu-indigo">Mithu</div>
          <div className="flex items-center gap-2 rounded-full bg-white/70 p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-full px-3 py-1 text-sm font-[var(--font-nunito)] ${
                lang === 'en' ? 'bg-mithu-orange text-white' : 'text-mithu-indigo/70'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`rounded-full px-3 py-1 text-sm font-[var(--font-nunito)] ${
                lang === 'hi' ? 'bg-mithu-orange text-white' : 'text-mithu-indigo/70'
              }`}
            >
              {"\u0939\u093f\u0902\u0926\u0940"}
            </button>
          </div>
        </header>

        <div className="mithu-card px-5 py-6 text-center">
          <MithuCharacter state="idle" className="mb-3" />
          <div className="font-[var(--font-baloo)] text-2xl">{t.headline} {"\ud83e\udd9c"}</div>
          <div className="mt-2 font-[var(--font-nunito)] text-base text-mithu-indigo/80">{t.sub}</div>

          <button
            type="button"
            onClick={start}
            className="mt-5 w-full rounded-3xl bg-mithu-orange px-6 py-4 text-lg font-[var(--font-baloo)] text-white shadow-soft transition active:scale-[0.99]"
          >
            {t.cta} {"\ud83c\udf99"}
          </button>

          <div className="mt-3 text-xs font-[var(--font-nunito)] text-mithu-indigo/60">{t.foot}</div>

          {micError ? <div className="mt-3 text-sm text-red-600">{micError}</div> : null}
        </div>
      </div>
    </main>
  );
}
