'use client';

import { cn } from '@/lib/utils';

export type ShabdState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function ShabdCharacter({ state, className }: { state: ShabdState; className?: string }) {
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';

  return (
    <div
      className={cn(
        'relative mx-auto flex items-center justify-center',
        state === 'idle' ? 'animate-float' : '',
        isListening ? 'animate-float' : '',
        className
      )}
      aria-label={`Shabd is ${state}`}
    >
      <div className={cn('relative', isListening ? 'animate-pulse-ring' : '')}>
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="60" y1="30" x2="160" y2="190" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFD166" />
              <stop offset="1" stopColor="#FF6B35" />
            </linearGradient>
          </defs>

          {/* Body */}
          <path
            d="M110 28c-40 0-72 32-72 72v16c0 48 32 82 72 82s72-34 72-82v-16c0-40-32-72-72-72Z"
            fill="url(#bodyGrad)"
          />

          {/* Belly */}
          <path
            d="M110 82c-24 0-44 20-44 44s20 54 44 54 44-30 44-54-20-44-44-44Z"
            fill="rgba(255,248,240,0.85)"
          />

          {/* Eyes */}
          <g>
            <circle cx="78" cy="86" r={isListening ? 26 : 24} fill="#FFF8F0" />
            <circle cx="142" cy="86" r={isListening ? 26 : 24} fill="#FFF8F0" />
            <circle
              cx="78"
              cy="88"
              r="10"
              fill="#1B1F3B"
              className={cn(isThinking ? 'translate-x-1' : '', 'transition-transform duration-300')}
            />
            <circle
              cx="142"
              cy="88"
              r="10"
              fill="#1B1F3B"
              className={cn(isThinking ? '-translate-x-1' : '', 'transition-transform duration-300')}
            />
            <circle cx="74" cy="82" r="3" fill="#FFF8F0" opacity="0.9" />
            <circle cx="138" cy="82" r="3" fill="#FFF8F0" opacity="0.9" />
          </g>

          {/* Beak */}
          <path d="M110 102l-14 10 14 10 14-10-14-10Z" fill="#FFB703" />

          {/* Mouth (speaking) */}
          <path
            d="M96 123c6 8 14 12 14 12s8-4 14-12"
            stroke="#1B1F3B"
            strokeWidth={isSpeaking ? 5 : 2}
            strokeLinecap="round"
            opacity={isSpeaking ? 0.95 : 0.55}
          />

          {/* Brows */}
          <path
            d="M60 70c8-10 20-14 32-10"
            stroke="#1B1F3B"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isListening ? 0.65 : 0.35}
          />
          <path
            d="M160 70c-8-10-20-14-32-10"
            stroke="#1B1F3B"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={isListening ? 0.65 : 0.35}
          />
        </svg>

        {isThinking ? (
          <div className="absolute -right-2 -top-2 rounded-full bg-white/85 px-3 py-2 text-sm shadow-soft">
            <span className="inline-flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

