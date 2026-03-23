import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

export type SessionSummary = {
  sessionId: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  turnCount: number;
  language: 'en' | 'hi';
  messages: ChatMessage[];
};

export type SessionLimits = {
  maxTurns: number;
  maxSeconds: number;
};

const DEFAULT_LIMITS: SessionLimits = { maxTurns: 10, maxSeconds: 5 * 60 };

function makeSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useSession(language: 'en' | 'hi', limits?: SessionLimits) {
  const { maxTurns, maxSeconds } = limits ?? DEFAULT_LIMITS;

  const [sessionId] = useState(makeSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | undefined>(undefined);

  const turnCount = useMemo(() => messages.filter((m) => m.role === 'assistant').length, [messages]);
  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  const remainingSeconds = Math.max(0, maxSeconds - elapsedSeconds);

  const isOverTurns = turnCount >= maxTurns;
  const isOverTime = remainingSeconds <= 0;
  const isEnded = Boolean(endedAt) || isOverTurns || isOverTime;

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const endSession = useCallback(() => {
    setEndedAt((prev) => prev ?? Date.now());
  }, []);

  const summary: SessionSummary = useMemo(() => {
    const effectiveEndedAt = endedAt ?? (isEnded ? Date.now() : undefined);
    const durationSeconds = Math.floor(((effectiveEndedAt ?? Date.now()) - startedAt) / 1000);
    return {
      sessionId,
      startedAt,
      endedAt: effectiveEndedAt,
      durationSeconds,
      turnCount,
      language,
      messages
    };
  }, [endedAt, isEnded, language, messages, sessionId, startedAt, turnCount]);

  const savedRef = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isEnded) return;
    if (savedRef.current) return;
    savedRef.current = true;
    try {
      sessionStorage.setItem('kiki:session', JSON.stringify(summary));
    } catch {
      // ignore
    }
  }, [isEnded, summary]);

  return {
    sessionId,
    messages,
    addMessage,
    turnCount,
    maxTurns,
    elapsedSeconds,
    remainingSeconds,
    isEnded,
    endSession,
    summary
  };
}
