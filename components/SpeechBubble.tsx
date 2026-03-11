'use client';

export function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="shabd-card mx-auto w-full max-w-md px-5 py-4">
      <div className="font-[var(--font-nunito)] text-base leading-snug">
        {text || <span className="text-shabd-indigo/50">Shabd will speak here…</span>}
      </div>
    </div>
  );
}

