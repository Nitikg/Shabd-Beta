export const runtime = 'nodejs';

import { getDb, isFirebaseConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { incrementSessionCount, saveSessionSummary } from '@/lib/kidProfile';
import { generateSessionMemory } from '@/lib/promptBuilder';
import type { ChatMessage } from '@/hooks/useSession';

type SaveSessionBody = {
  sessionId: string;
  kidId: string | null;
  kidName?: string;
  sessionNumber: number;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  turnCount: number;
  language: string;
  messages: ChatMessage[];
};

export async function POST(req: Request) {
  if (!isFirebaseConfigured()) {
    // Silently succeed — app works without Firebase, logging is best-effort
    return Response.json({ ok: true });
  }

  try {
    const body = (await req.json()) as SaveSessionBody;
    const { sessionId, kidId, kidName, sessionNumber, messages,
            startedAt, endedAt, durationSeconds, turnCount, language } = body;

    // Validate sessionId is a UUID to prevent doc key injection
    if (!sessionId || !/^[0-9a-f-]{36}$/.test(sessionId)) {
      return Response.json({ ok: false, error: 'Invalid session ID' }, { status: 400 });
    }

    const db = getDb();

    await db
      .collection('sessions')
      .doc(sessionId)
      .set({
        kidId: kidId ?? null,
        sessionNumber: kidId ? sessionNumber : null,
        startedAt: startedAt ?? null,
        endedAt: endedAt ?? null,
        durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : 0,
        turnCount: typeof turnCount === 'number' ? turnCount : 0,
        language: typeof language === 'string' ? language : '',
        turns: messages.map((m, i) => ({
          role: m.role,
          text: m.content,
          turnIndex: i
        })),
        // Feedback fields populated later by /api/feedback
        starRating: null,
        chips: [],
        openText: '',
        savedAt: FieldValue.serverTimestamp()
      });

    if (kidId) {
      await incrementSessionCount(kidId);

      // Save a short memory so session 2/3 can reference session 1/2
      const memory = generateSessionMemory(kidName ?? '', messages);
      if (memory) {
        await saveSessionSummary(kidId, sessionNumber, memory);
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('Session save error', e);
    // Don't return 500 — a failed save shouldn't break the user experience
    return Response.json({ ok: false, error: 'Save failed silently' });
  }
}
