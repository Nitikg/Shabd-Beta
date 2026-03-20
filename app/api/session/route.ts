export const runtime = 'nodejs';

import { getDb, isFirebaseConfigured } from '@/lib/firebaseAdmin';
import { incrementSessionCount, saveSessionSummary } from '@/lib/kidProfile';
import { generateSessionMemory } from '@/lib/promptBuilder';
import type { ChatMessage } from '@/hooks/useSession';

type SaveSessionBody = {
  sessionId: string;
  kidId: string | null;
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
    const { sessionId, kidId, sessionNumber, messages, ...rest } = body;

    const db = getDb();

    await db
      .collection('sessions')
      .doc(sessionId)
      .set({
        kidId: kidId ?? null,
        sessionNumber: kidId ? sessionNumber : null,
        ...rest,
        turns: messages.map((m, i) => ({
          role: m.role,
          text: m.content,
          turnIndex: i
        })),
        // Feedback fields populated later by /api/feedback
        starRating: null,
        chips: [],
        openText: '',
        savedAt: Date.now()
      });

    if (kidId) {
      await incrementSessionCount(kidId);

      // Save a short memory so session 2/3 can reference session 1/2
      const memory = generateSessionMemory(
        (await db.collection('kids').doc(kidId).get()).data()?.name ?? '',
        messages
      );
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
