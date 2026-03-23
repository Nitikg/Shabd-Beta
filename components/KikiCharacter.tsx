'use client';

import { cn } from '@/lib/utils';

export type KikiState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function KikiCharacter({ state, className }: { state: KikiState; className?: string }) {
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
      aria-label={`Kiki is ${state}`}
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
            <linearGradient id="hairGrad" x1="60" y1="10" x2="160" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C77DFF" />
              <stop offset="1" stopColor="#9B5DE5" />
            </linearGradient>
            <linearGradient id="dressGrad" x1="70" y1="130" x2="150" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6B35" />
              <stop offset="1" stopColor="#FF8C61" />
            </linearGradient>
            <radialGradient id="cheekGlow" cx="0.5" cy="0.5" r="0.5">
              <stop stopColor="#FFB4A2" stopOpacity="0.8" />
              <stop offset="1" stopColor="#FFB4A2" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Hair — flowing, voluminous */}
          <ellipse cx="110" cy="62" rx="62" ry="52" fill="url(#hairGrad)" />
          {/* Hair side tufts */}
          <ellipse cx="52" cy="78" rx="18" ry="28" fill="#B565E0" opacity="0.85" />
          <ellipse cx="168" cy="78" rx="18" ry="28" fill="#B565E0" opacity="0.85" />
          {/* Hair fringe detail */}
          <path
            d="M72 38c8-12 20-18 38-18s30 6 38 18"
            stroke="#A855F7"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />

          {/* Face */}
          <ellipse cx="110" cy="95" rx="48" ry="50" fill="#FFDEC2" />

          {/* Blush cheeks */}
          <ellipse cx="72" cy="108" rx="12" ry="8" fill="url(#cheekGlow)" />
          <ellipse cx="148" cy="108" rx="12" ry="8" fill="url(#cheekGlow)" />

          {/* Eyes */}
          <g>
            {/* Left eye */}
            <ellipse cx="88" cy="92" rx={isListening ? 13 : 11} ry={isListening ? 15 : 13} fill="#FFF8F0" />
            <circle
              cx="88"
              cy="94"
              r="7"
              fill="#1B1F3B"
              className={cn(isThinking ? 'translate-x-1' : '', 'transition-transform duration-300')}
            />
            <circle cx="85" cy="90" r="2.5" fill="#FFF8F0" opacity="0.9" />

            {/* Right eye */}
            <ellipse cx="132" cy="92" rx={isListening ? 13 : 11} ry={isListening ? 15 : 13} fill="#FFF8F0" />
            <circle
              cx="132"
              cy="94"
              r="7"
              fill="#1B1F3B"
              className={cn(isThinking ? '-translate-x-1' : '', 'transition-transform duration-300')}
            />
            <circle cx="129" cy="90" r="2.5" fill="#FFF8F0" opacity="0.9" />

            {/* Eyelashes */}
            <path d="M78 82c2-3 4-4 6-4" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M94 80c-1-3-3-5-5-5" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M122 80c2-3 4-5 6-5" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M138 82c-1-3-3-4-5-4" stroke="#1B1F3B" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Nose — tiny dot */}
          <circle cx="110" cy="104" r="2" fill="#E8A87C" />

          {/* Mouth */}
          <path
            d={isSpeaking
              ? "M98 116c4 8 10 10 12 10s8-2 12-10"
              : "M98 116c4 5 10 7 12 7s8-2 12-7"
            }
            stroke="#1B1F3B"
            strokeWidth={isSpeaking ? 3 : 2.5}
            strokeLinecap="round"
            fill={isSpeaking ? "#FF6B6B" : "none"}
            opacity={isSpeaking ? 0.9 : 0.7}
          />

          {/* Body / Dress */}
          <path
            d="M78 142c-4 0-14 8-18 38h100c-4-30-14-38-18-38H78Z"
            fill="url(#dressGrad)"
          />
          {/* Dress collar */}
          <path
            d="M86 142c8 6 20 8 24 8s16-2 24-8"
            stroke="#FF5722"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />

          {/* Star accessory in hair */}
          <g transform="translate(140, 42) scale(0.7)">
            <polygon
              points="12,0 15,8 24,9 17,15 19,24 12,19 5,24 7,15 0,9 9,8"
              fill="#FFD166"
              stroke="#FFC233"
              strokeWidth="1"
              className={cn(
                isListening ? 'animate-spin' : '',
                'origin-center transition-transform'
              )}
              style={{ transformOrigin: '12px 12px', animationDuration: '3s' }}
            />
          </g>

          {/* Arms (tiny, cute) */}
          <path
            d="M62 156c-8 4-14 12-16 18"
            stroke="#FFDEC2"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(isSpeaking ? '-rotate-6' : '', 'transition-transform duration-300')}
            style={{ transformOrigin: '62px 156px' }}
          />
          <path
            d="M158 156c8 4 14 12 16 18"
            stroke="#FFDEC2"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(isSpeaking ? 'rotate-6' : '', 'transition-transform duration-300')}
            style={{ transformOrigin: '158px 156px' }}
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
