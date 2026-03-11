'use client';

export function SessionTimer({ remainingSeconds }: { remainingSeconds: number }) {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  const label = `${m}:${String(s).padStart(2, '0')}`;
  return (
    <div className="rounded-full bg-white/70 px-3 py-1 text-sm font-[var(--font-nunito)] text-shabd-indigo/80 shadow-soft">
      {label}
    </div>
  );
}

