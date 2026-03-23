'use client';

import { useMemo, useState } from 'react';

const CHIP_OPTIONS = [
  { id: 'engaged', label: '✅ Child was engaged' },
  { id: 'laughed', label: '✅ Child laughed or smiled' },
  { id: 'continue', label: '✅ Child wanted to continue' },
  { id: 'age_ok', label: '✅ Responses felt age-appropriate' },
  { id: 'voice_clear', label: '✅ Voice was clear and friendly' },
  { id: 'confused', label: '⚠️ Child got confused' },
  { id: 'too_long', label: '⚠️ Response felt too long' },
  { id: 'mic_issue', label: "⚠️ Mic didn't work well" },
  { id: 'content_concern', label: '⚠️ I had concerns about content' }
] as const;

export type FeedbackPayload = {
  sessionId: string;
  starRating: number;
  chips: string[];
  childAge: 4 | 5 | 6 | 7 | 8 | null;
  openText: string;
  whatsappNumber: string;
  timestamp: number;
  device: string;
  browser: string;
};

function getUA() {
  if (typeof navigator === 'undefined') return { device: 'unknown', browser: 'unknown' };
  const ua = navigator.userAgent;
  const device = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'desktop';
  const browser = /Chrome\//i.test(ua) ? 'chrome' : /Safari\//i.test(ua) ? 'safari' : 'other';
  return { device, browser };
}

export function FeedbackForm({
  sessionId,
  onSubmitted
}: {
  sessionId: string;
  onSubmitted: () => void;
}) {
  const [starRating, setStarRating] = useState(0);
  const [chips, setChips] = useState<string[]>([]);
  const [childAge, setChildAge] = useState<4 | 5 | 6 | 7 | 8 | null>(null);
  const [openText, setOpenText] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ua = useMemo(() => getUA(), []);

  const toggleChip = (id: string) => {
    setChips((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    setError(null);
    if (!starRating || !childAge) {
      setError('Please select a rating and your child’s age.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: FeedbackPayload = {
        sessionId,
        starRating,
        chips,
        childAge,
        openText,
        whatsappNumber,
        timestamp: Date.now(),
        device: ua.device,
        browser: ua.browser
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Submit failed');
      onSubmitted();
    } catch {
      setError('Sorry — something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="kiki-card px-5 py-4">
        <div className="font-[var(--font-baloo)] text-lg">How much did your child enjoy it?</div>
        <div className="mt-2 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const v = i + 1;
            const on = v <= starRating;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setStarRating(v)}
                className={`text-2xl ${on ? 'opacity-100' : 'opacity-30'}`}
                aria-label={`${v} stars`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      <div className="kiki-card px-5 py-4">
        <div className="font-[var(--font-baloo)] text-lg">What did you observe?</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIP_OPTIONS.map((c) => {
            const on = chips.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleChip(c.id)}
                className={`rounded-full px-3 py-2 text-sm font-[var(--font-nunito)] transition ${
                  on ? 'bg-kiki-teal/20 border border-kiki-teal/40' : 'bg-white/60 border border-white/60'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="kiki-card px-5 py-4">
        <div className="font-[var(--font-baloo)] text-lg">Child’s age</div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {[4, 5, 6, 7, 8].map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => setChildAge(age as 4 | 5 | 6 | 7 | 8)}
              className={`rounded-2xl py-2 text-center font-[var(--font-nunito)] ${
                childAge === age ? 'bg-kiki-orange text-white' : 'bg-white/70 text-kiki-indigo/80'
              }`}
            >
              {age}
            </button>
          ))}
        </div>
      </div>

      <div className="kiki-card px-5 py-4">
        <div className="font-[var(--font-baloo)] text-lg">Any feedback or suggestions?</div>
        <textarea
          value={openText}
          onChange={(e) => setOpenText(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 p-3 font-[var(--font-nunito)] outline-none focus:ring-2 focus:ring-kiki-purple/40"
          rows={4}
          placeholder="Tell us what worked, what didn’t…"
        />
      </div>

      <div className="kiki-card px-5 py-4">
        <div className="font-[var(--font-baloo)] text-lg">WhatsApp number (optional)</div>
        <input
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 p-3 font-[var(--font-nunito)] outline-none focus:ring-2 focus:ring-kiki-purple/40"
          placeholder="e.g. +91 98xxxxxxx"
          inputMode="tel"
        />
      </div>

      {error ? <div className="text-center text-sm text-red-600">{error}</div> : null}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-3xl bg-kiki-orange px-6 py-4 text-lg font-[var(--font-baloo)] text-white shadow-soft transition active:scale-[0.99] disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </div>
  );
}

