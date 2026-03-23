'use client';

export function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="kiki-card mx-auto w-full max-w-md px-5 py-4">
      <div className="font-[var(--font-nunito)] text-lg leading-relaxed text-kiki-indigo">
        {text || <span className="text-kiki-indigo/50">Kiki will speak here…</span>}
      </div>
    </div>
  );
}

