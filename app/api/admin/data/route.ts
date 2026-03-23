export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getDb, isFirebaseConfigured } from '@/lib/firebaseAdmin';

const ADMIN_PASSWORD = 'KIKI_ADMIN_2026';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const db = getDb();

    const [kidsSnap, sessionsSnap] = await Promise.all([
      db.collection('kids').get(),
      db.collection('sessions').get(),
    ]);

    const kids = kidsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name ?? '',
        ageYears: d.ageYears ?? 0,
        class: d.class ?? '',
        language: d.language ?? 'hinglish',
        interests: d.interests ?? [],
        sessionCount: d.sessionCount ?? 0,
        createdAt: d.createdAt?.toMillis?.() ?? d.createdAt ?? null,
      };
    });

    const sessions = sessionsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        kidId: d.kidId ?? '',
        sessionNumber: d.sessionNumber ?? 0,
        startedAt: d.startedAt?.toMillis?.() ?? d.startedAt ?? null,
        endedAt: d.endedAt?.toMillis?.() ?? d.endedAt ?? null,
        durationSeconds: d.durationSeconds ?? 0,
        turnCount: d.turnCount ?? 0,
        language: d.language ?? '',
        turns: d.turns ?? [],
        starRating: d.starRating ?? null,
        chips: d.chips ?? [],
        openText: d.openText ?? '',
        savedAt: d.savedAt?.toMillis?.() ?? d.savedAt ?? null,
      };
    });

    return NextResponse.json({ kids, sessions });
  } catch (e) {
    console.error('Admin data fetch failed', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
