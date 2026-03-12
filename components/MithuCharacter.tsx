'use client';

import { cn } from '@/lib/utils';

export type MithuState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function MithuCharacter({ state, className }: { state: MithuState; className?: string }) {
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
      aria-label={`Mithu is ${state}`}
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
              <stop stopColor="#4CAF50" />
              <stop offset="1" stopColor="#2E7D32" />
            </linearGradient>
            <linearGradient id="wingGrad" x1="180" y1="80" x2="210" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#66BB6A" />
              <stop offset="1" stopColor="#388E3C" />
            </linearGradient>
          </defs>

          {/* Tail */}
          <path
            d="M100 170l10 30 10-30"
            fill="#2E7D32"
            opacity="0.8"
          />

          {/* Body */}
          <path
            d="M110 28c-40 0-72 32-72 72v16c0 48 32 82 72 82s72-34 72-82v-16c0-40-32-72-72-72Z"
            fill="url(#bodyGrad)"
          />

          {/* Belly */}
          <path
            d="M110 82c-24 0-44 20-44 44s20 54 44 54 44-30 44-54-20-44-44-44Z"
            fill="rgba(220, 237, 200, 0.9)"
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

          {/* Beak - Parrot style */}
          <path d="M110 102c-5 0-14 4-14 12 0 10 14 14 14 14s14-4 14-14c0-8-9-12-14-12Z" fill="#FF9800" />
          <path d="M110 105c-3 0-8 3-8 9 0 6 8 10 8 10s8-4 8-10c0-6-5-9-8-9Z" fill="#F57C00" opacity="0.5" />

          {/* Mouth (speaking) */}
          <path
            d="M96 128c6 6 14 10 14 10s8-4 14-10"
            stroke="#1B1F3B"
            strokeWidth={isSpeaking ? 5 : 2}
            strokeLinecap="round"
            opacity={isSpeaking ? 0.95 : 0.55}
          />

          {/* Crest */}
          <path
            d="M110 28c-5-15-15-20-20-20M110 28c5-15 15-20 20-20"
            stroke="#2E7D32"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.8"
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
