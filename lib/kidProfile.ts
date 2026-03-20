import { getDb, isFirebaseConfigured } from './firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export type KidProfile = {
  id: string;
  name: string;
  ageYears: number;
  class: string;           // "LKG" | "UKG" | "Grade 1" | "Grade 2" | "Grade 3"
  language: 'en' | 'hi' | 'hinglish';
  interests: string[];     // e.g. ["cats", "cricket", "mangoes"]
  sessionCount: number;    // 0–3; when 3, child is locked out
};

export const MAX_SESSIONS = 3;

export async function getKidProfile(kidId: string): Promise<KidProfile | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const doc = await getDb().collection('kids').doc(kidId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as Omit<KidProfile, 'id'>) };
  } catch (e) {
    console.error('getKidProfile failed', e);
    return null;
  }
}

export async function incrementSessionCount(kidId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await getDb().collection('kids').doc(kidId).update({
      sessionCount: FieldValue.increment(1)
    });
  } catch (e) {
    console.error('incrementSessionCount failed', e);
  }
}

// Called after session 1 ends — saves a short summary Mithu can reference in session 2
export async function saveSessionSummary(kidId: string, sessionNumber: number, summary: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    await getDb().collection('kids').doc(kidId).update({
      [`session${sessionNumber}Summary`]: summary
    });
  } catch (e) {
    console.error('saveSessionSummary failed', e);
  }
}

export async function getSessionSummary(kidId: string, sessionNumber: number): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const doc = await getDb().collection('kids').doc(kidId).get();
    if (!doc.exists) return null;
    const data = doc.data() as Record<string, string>;
    return data[`session${sessionNumber}Summary`] ?? null;
  } catch (e) {
    console.error('getSessionSummary failed', e);
    return null;
  }
}
