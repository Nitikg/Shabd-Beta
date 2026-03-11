'use client';

import { useEffect, useMemo, useState } from 'react';
import { FeedbackForm } from '@/components/FeedbackForm';
import { ShabdCharacter } from '@/components/ShabdCharacter';
import { safeJsonParse } from '@/lib/utils';
import type { SessionSummary } from '@/hooks/useSession';

function makeShareText(link: string) {
  return `I just tested Shabd — an AI voice companion for kids! My child actually loved talking to it 😮 Try it free here: ${link}`;
}

export default function FeedbackPage() {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('shabd:session') : null;
    const parsed = safeJsonParse<SessionSummary>(raw);
    setSummary(parsed);
  }, []);

  const shareLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }, []);

  const share = async () => {
    const text = makeShareText(shareLink);
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      // ignore
    }
    window.open(wa, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="shabd-gradient-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="shabd-card px-5 py-6 text-center">
          <ShabdCharacter state="idle" className="mb-2" />
          <div className="font-[var(--font-baloo)] text-2xl">Thank you!</div>
          <div className="mt-1 font-[var(--font-nunito)] text-shabd-indigo/75">
            You’re helping build the future of learning for Indian kids.
          </div>
          {summary ? (
            <div className="mt-3 text-xs font-[var(--font-nunito)] text-shabd-indigo/55">
              Session: {summary.turnCount} turns · {summary.durationSeconds}s
            </div>
          ) : null}
        </div>

        {!submitted ? (
          <FeedbackForm sessionId={summary?.sessionId ?? 'unknown'} onSubmitted={() => setSubmitted(true)} />
        ) : (
          <div className="shabd-card px-5 py-6 text-center">
            <div className="font-[var(--font-baloo)] text-xl">Feedback submitted.</div>
            <div className="mt-2 font-[var(--font-nunito)] text-shabd-indigo/75">Share Shabd with another parent.</div>
            <button
              type="button"
              onClick={share}
              className="mt-4 w-full rounded-3xl bg-shabd-orange px-6 py-4 text-lg font-[var(--font-baloo)] text-white shadow-soft transition active:scale-[0.99]"
            >
              Share on WhatsApp 📲
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

