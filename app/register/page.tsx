'use client';

import { useState, useEffect, useCallback } from 'react';

const ACCESS_CODE = 'KIKI2026';
const SESSION_KEY = 'kiki:access';

const AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10];
const CLASS_OPTIONS = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th'];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
] as const;

const INTEREST_OPTIONS = [
  'Animals',
  'Space',
  'Food',
  'Cars',
  'Trains',
  'Dinosaurs',
  'Art/Colors',
  'Music/Dance',
  'Sports',
  'Superheroes',
];

type FormData = {
  name: string;
  ageYears: number;
  class: string;
  language: 'en' | 'hi' | 'hinglish';
  interests: string[];
  whatsappNumber: string;
};

type RegistrationResult = {
  kidId: string;
  link: string;
};

function makeWhatsAppMessage(childName: string, link: string): string {
  return [
    `Hi! Here is ${childName}'s personal link to talk to Kiki, the story parrot:`,
    '',
    link,
    '',
    'How to use:',
    '1. Open the link in Chrome (Android) or Safari (iPhone)',
    '2. Allow microphone when asked',
    `3. Tap Start and hand the phone to ${childName}`,
    `4. Sit nearby but let them lead the conversation`,
    '5. After the session, there is a short feedback form for you',
    '',
    `${childName} gets 3 story sessions with Kiki. Have fun!`,
  ].join('\n');
}

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      sessionStorage.setItem(SESSION_KEY, code.trim().toUpperCase());
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="kiki-card px-6 py-8 text-center">
      <div className="font-[var(--font-baloo)] text-2xl text-kiki-indigo">
        Parent Registration
      </div>
      <div className="mt-2 font-[var(--font-nunito)] text-sm text-kiki-indigo/70">
        Enter the access code to register your child for Kiki sessions.
      </div>
      <input
        type="text"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Access code"
        className="mt-5 w-full rounded-2xl border border-kiki-indigo/15 bg-white px-4 py-3 text-center font-[var(--font-nunito)] text-lg tracking-widest text-kiki-indigo outline-none focus:border-kiki-orange focus:ring-2 focus:ring-kiki-orange/30"
        autoFocus
      />
      {error && (
        <div className="mt-2 text-sm text-red-500 font-[var(--font-nunito)]">
          Invalid code. Please try again.
        </div>
      )}
      <button
        type="button"
        onClick={submit}
        className="mt-4 w-full rounded-3xl bg-kiki-orange px-6 py-3 font-[var(--font-baloo)] text-lg text-white shadow-soft transition active:scale-[0.99]"
      >
        Continue
      </button>
    </div>
  );
}

function SuccessScreen({
  result,
  childName,
  onReset,
}: {
  result: RegistrationResult;
  childName: string;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  const shareWhatsApp = () => {
    const text = makeWhatsAppMessage(childName, result.link);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="kiki-card px-6 py-8 text-center">
      <div className="font-[var(--font-baloo)] text-2xl text-kiki-indigo">
        All set!
      </div>
      <div className="mt-2 font-[var(--font-nunito)] text-sm text-kiki-indigo/70">
        {childName} is ready to talk to Kiki. Share this link:
      </div>

      <div className="mt-4 rounded-2xl bg-kiki-offwhite/80 border border-kiki-indigo/10 px-4 py-3">
        <div className="font-[var(--font-nunito)] text-sm text-kiki-indigo break-all">
          {result.link}
        </div>
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="mt-4 w-full rounded-3xl bg-kiki-teal px-6 py-3 font-[var(--font-baloo)] text-lg text-white shadow-soft transition active:scale-[0.99]"
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>

      <button
        type="button"
        onClick={shareWhatsApp}
        className="mt-3 w-full rounded-3xl bg-[#25D366] px-6 py-3 font-[var(--font-baloo)] text-lg text-white shadow-soft transition active:scale-[0.99]"
      >
        Share on WhatsApp
      </button>

      <button
        type="button"
        onClick={onReset}
        className="mt-3 w-full rounded-3xl border-2 border-kiki-orange bg-transparent px-6 py-3 font-[var(--font-baloo)] text-lg text-kiki-orange transition active:scale-[0.99]"
      >
        Register Another Child
      </button>
    </div>
  );
}

function CustomInterestInput({
  onAdd,
  existingInterests,
}: {
  onAdd: (value: string) => void;
  existingInterests: string[];
}) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const submit = () => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || existingInterests.includes(trimmed)) {
      setValue('');
      return;
    }
    onAdd(trimmed);
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-full border border-dashed border-kiki-indigo/30 px-4 py-2 font-[var(--font-nunito)] text-sm text-kiki-indigo/60 transition hover:border-kiki-orange hover:text-kiki-orange"
      >
        + Add custom interest
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="e.g. Robots, Cooking"
        className="flex-1 rounded-2xl border border-kiki-indigo/15 bg-white px-3 py-2 font-[var(--font-nunito)] text-sm text-kiki-indigo outline-none focus:border-kiki-orange focus:ring-2 focus:ring-kiki-orange/30"
        autoFocus
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        className="rounded-2xl bg-kiki-orange px-4 py-2 font-[var(--font-nunito)] text-sm font-semibold text-white shadow-soft transition active:scale-[0.99] disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setValue(''); }}
        className="rounded-2xl border border-kiki-indigo/15 bg-white px-3 py-2 font-[var(--font-nunito)] text-sm text-kiki-indigo/60 transition"
      >
        Cancel
      </button>
    </div>
  );
}

function RegistrationForm({ onSuccess }: { onSuccess: (result: RegistrationResult, name: string) => void }) {
  const [form, setForm] = useState<FormData>({
    name: '',
    ageYears: 5,
    class: 'LKG',
    language: 'hinglish',
    interests: [],
    whatsappNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setForm((prev) => {
      const lower = interest.toLowerCase();
      if (prev.interests.includes(lower)) {
        return { ...prev, interests: prev.interests.filter((i) => i !== lower) };
      }
      if (prev.interests.length >= 3) return prev;
      return { ...prev, interests: [...prev.interests, lower] };
    });
  };

  const isValid =
    form.name.trim().length > 0 &&
    form.interests.length >= 1 &&
    form.interests.length <= 3;

  const submit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        ageYears: form.ageYears,
        class: form.class,
        language: form.language,
        interests: form.interests,
        whatsappNumber: form.whatsappNumber.trim() || null,
        accessCode: sessionStorage.getItem(SESSION_KEY) ?? '',
      };

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Registration failed (${res.status})`);
      }

      const data: RegistrationResult = await res.json();
      onSuccess(data, form.name.trim());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kiki-card px-6 py-8">
      <div className="text-center font-[var(--font-baloo)] text-2xl text-kiki-indigo">
        Register Your Child
      </div>
      <div className="mt-1 text-center font-[var(--font-nunito)] text-sm text-kiki-indigo/70">
        Tell us about your child so Kiki can personalise the experience.
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block font-[var(--font-nunito)] text-sm font-semibold text-kiki-indigo/80 mb-1">
            Child's first name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Arjun"
            className="w-full rounded-2xl border border-kiki-indigo/15 bg-white px-4 py-3 font-[var(--font-nunito)] text-kiki-indigo outline-none focus:border-kiki-orange focus:ring-2 focus:ring-kiki-orange/30"
          />
        </div>

        {/* Age */}
        <div>
          <label className="block font-[var(--font-nunito)] text-sm font-semibold text-kiki-indigo/80 mb-1">
            Age
          </label>
          <select
            value={form.ageYears}
            onChange={(e) => setForm((f) => ({ ...f, ageYears: Number(e.target.value) }))}
            className="w-full rounded-2xl border border-kiki-indigo/15 bg-white px-4 py-3 font-[var(--font-nunito)] text-kiki-indigo outline-none focus:border-kiki-orange focus:ring-2 focus:ring-kiki-orange/30"
          >
            {AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                {age} years
              </option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div>
          <label className="block font-[var(--font-nunito)] text-sm font-semibold text-kiki-indigo/80 mb-1">
            Class
          </label>
          <select
            value={form.class}
            onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
            className="w-full rounded-2xl border border-kiki-indigo/15 bg-white px-4 py-3 font-[var(--font-nunito)] text-kiki-indigo outline-none focus:border-kiki-orange focus:ring-2 focus:ring-kiki-orange/30"
          >
            {CLASS_OPTIONS.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block font-[var(--font-nunito)] text-sm font-semibold text-kiki-indigo/80 mb-1">
            Preferred language
          </label>
          <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, language: opt.value }))}
                className={`flex-1 rounded-2xl px-3 py-2.5 font-[var(--font-nunito)] text-sm font-semibold transition ${
                  form.language === opt.value
                    ? 'bg-kiki-orange text-white shadow-soft'
                    : 'bg-white border border-kiki-indigo/15 text-kiki-indigo/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block font-[var(--font-nunito)] text-sm font-semibold text-kiki-indigo/80 mb-1">
            Interests (pick 1 to 3)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = form.interests.includes(interest.toLowerCase());
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-4 py-2 font-[var(--font-nunito)] text-sm font-medium transition ${
                    selected
                      ? 'bg-kiki-orange text-white shadow-soft'
                      : 'bg-white border border-kiki-indigo/15 text-kiki-indigo/70'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
            {/* Custom interests as chips */}
            {form.interests
              .filter((i) => !INTEREST_OPTIONS.map((o) => o.toLowerCase()).includes(i))
              .map((custom) => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => toggleInterest(custom)}
                  className="rounded-full px-4 py-2 font-[var(--font-nunito)] text-sm font-medium bg-kiki-orange text-white shadow-soft transition"
                >
                  {custom}
                </button>
              ))}
          </div>
          {form.interests.length < 3 && (
            <CustomInterestInput
              onAdd={(value) => toggleInterest(value)}
              existingInterests={form.interests}
            />
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block font-[var(--font-nunito)] text-sm font-semibold text-kiki-indigo/80 mb-1">
            Parent's WhatsApp number
            <span className="ml-1 font-normal text-kiki-indigo/50">(optional)</span>
          </label>
          <input
            type="tel"
            value={form.whatsappNumber}
            onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
            placeholder="+91..."
            className="w-full rounded-2xl border border-kiki-indigo/15 bg-white px-4 py-3 font-[var(--font-nunito)] text-kiki-indigo outline-none focus:border-kiki-orange focus:ring-2 focus:ring-kiki-orange/30"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-center font-[var(--font-nunito)] text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          disabled={!isValid || submitting}
          className="w-full rounded-3xl bg-kiki-orange px-6 py-4 font-[var(--font-baloo)] text-lg text-white shadow-soft transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [childName, setChildName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setUnlocked(true);
    }
  }, []);

  const handleSuccess = useCallback((res: RegistrationResult, name: string) => {
    setResult(res);
    setChildName(name);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setChildName('');
  }, []);

  return (
    <main className="kiki-gradient-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="text-center">
          <div className="font-[var(--font-baloo)] text-2xl tracking-tight text-kiki-indigo">
            Kiki
          </div>
        </header>

        {!unlocked ? (
          <AccessGate onUnlock={() => setUnlocked(true)} />
        ) : result ? (
          <SuccessScreen result={result} childName={childName} onReset={handleReset} />
        ) : (
          <RegistrationForm onSuccess={handleSuccess} />
        )}
      </div>
    </main>
  );
}
