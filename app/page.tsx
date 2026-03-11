'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShabdCharacter } from '@/components/ShabdCharacter';
import { isIOS } from '@/lib/utils';

const COPY = {
  en: {
    headline: "Namasté! I'm Shabd",
    sub: "Your child's curious AI friend — tell me a story, ask me anything!",
    cta: 'Start Talking',
    foot: 'No login needed · Free to try · For ages 4–8',
    mic: 'Shabd needs to hear your child’s voice. Please allow microphone access.',
    ios: 'For the best experience, please open this on Android Chrome or desktop Chrome.'
  },
  hi: {
    headline: 'Namasté! मैं Shabd हूँ',
    sub: 'मैं आपके बच्चे का जिज्ञासु AI दोस्त हूँ — कहानी सुनाओ, कुछ भी पूछो!',
    cta: 'Shabd से बात शुरू करें',
    foot: 'कोई लॉगिन नहीं · मुफ्त · उम्र 4–8',
    mic: 'Shabd को आपके बच्चे की आवाज़ सुननी है। कृपया माइक्रोफोन की अनुमति दें।',
    ios: 'बेहतर अनुभव के लिए Android Chrome या desktop Chrome पर खोलें।'
  }
};

function detectLanguage(): 'en' | 'hi' {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('shabd:lang');
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
      playTinyChime(); // user gesture
      await requestMic();
      localStorage.setItem('shabd:lang', lang);
      router.push('/play');
    } catch {
      setMicError(t.mic);
    }
  };

  return (
    <main className="shabd-gradient-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="font-[var(--font-baloo)] text-2xl tracking-tight text-shabd-indigo">Shabd</div>
          <div className="flex items-center gap-2 rounded-full bg-white/70 p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-full px-3 py-1 text-sm font-[var(--font-nunito)] ${
                lang === 'en' ? 'bg-shabd-orange text-white' : 'text-shabd-indigo/70'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`rounded-full px-3 py-1 text-sm font-[var(--font-nunito)] ${
                lang === 'hi' ? 'bg-shabd-orange text-white' : 'text-shabd-indigo/70'
              }`}
            >
              हिंदी
            </button>
          </div>
        </header>

        <div className="shabd-card px-5 py-6 text-center">
          <ShabdCharacter state="idle" className="mb-3" />
          <div className="font-[var(--font-baloo)] text-2xl">{t.headline} 🦉</div>
          <div className="mt-2 font-[var(--font-nunito)] text-base text-shabd-indigo/80">{t.sub}</div>

          <button
            type="button"
            onClick={start}
            className="mt-5 w-full rounded-3xl bg-shabd-orange px-6 py-4 text-lg font-[var(--font-baloo)] text-white shadow-soft transition active:scale-[0.99]"
          >
            {t.cta} 🎙
          </button>

          <div className="mt-3 text-xs font-[var(--font-nunito)] text-shabd-indigo/60">{t.foot}</div>

          {isIOS() ? (
            <div className="mt-3 text-xs font-[var(--font-nunito)] text-shabd-indigo/60">{t.ios}</div>
          ) : null}

          {micError ? <div className="mt-3 text-sm text-red-600">{micError}</div> : null}
        </div>
      </div>
    </main>
  );
}

