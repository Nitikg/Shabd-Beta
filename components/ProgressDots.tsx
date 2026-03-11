'use client';

import { cn } from '@/lib/utils';

export function ProgressDots({ turnCount, max = 10 }: { turnCount: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 w-2 rounded-full transition',
            i < turnCount ? 'bg-shabd-purple' : 'bg-white/60 border border-white/60'
          )}
        />
      ))}
    </div>
  );
}

