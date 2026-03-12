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

const MAX_TURNS = 10;
const MAX_SECONDS = 5 * 60;

function makeSessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useSession(language: 'en' | 'hi') {
  const [sessionId] = useState(makeSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | undefined>(undefined);

  const turnCount = useMemo(() => messages.filter((m) => m.role === 'assistant').length, [messages]);
  const elapsedSeconds = Math.floor((now - startedAt) / 1000);
  const remainingSeconds = Math.max(0, MAX_SECONDS - elapsedSeconds);

  const isOverTurns = turnCount >= MAX_TURNS;
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
      sessionStorage.setItem('mithu:session', JSON.stringify(summary));
    } catch {
      // ignore
    }
  }, [isEnded, summary]);

  return {
    sessionId,
    messages,
    addMessage,
    turnCount,
    elapsedSeconds,
    remainingSeconds,
    isEnded,
    endSession,
    summary
  };
}

