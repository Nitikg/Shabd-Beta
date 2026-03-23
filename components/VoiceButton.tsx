'use client';

import { cn } from '@/lib/utils';

export function VoiceButton({
  isListening,
  disabled,
  onPress
}: {
  isListening: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onPress}
        className={cn(
          'relative grid h-20 w-20 place-items-center rounded-full shadow-soft transition active:scale-95',
          disabled ? 'bg-gray-300 text-gray-500' : isListening ? 'bg-red-500 text-white' : 'bg-kiki-orange text-white'
        )}
        aria-label={disabled ? 'Mic disabled' : isListening ? 'Listening' : 'Tap to talk'}
      >
        <span
          className={cn(
            'absolute inset-0 rounded-full',
            isListening && !disabled ? 'animate-ping bg-red-400/60' : ''
          )}
        />
        <span className="relative text-2xl">{disabled ? '🔒' : '🎙'}</span>
      </button>
      <div className="text-xs text-kiki-indigo/70">{disabled ? 'Wait…' : isListening ? 'Listening…' : 'Tap to talk'}</div>
    </div>
  );
}

