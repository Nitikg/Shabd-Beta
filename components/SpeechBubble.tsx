'use client';

export function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="mithu-card mx-auto w-full max-w-md px-5 py-4">
      <div className="font-[var(--font-nunito)] text-lg leading-relaxed text-mithu-indigo">
        {text || <span className="text-mithu-indigo/50">Mithu will speak here…</span>}
      </div>
    </div>
  );
}

