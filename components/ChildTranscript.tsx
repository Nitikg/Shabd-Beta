'use client';

export function ChildTranscript({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mx-auto w-full max-w-md px-2 text-center font-[var(--font-nunito)] text-sm text-shabd-indigo/45">
      You said: “{text}”
    </div>
  );
}

