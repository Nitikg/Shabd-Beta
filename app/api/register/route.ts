export const runtime = 'nodejs';

import { getDb, isFirebaseConfigured } from '@/lib/firebaseAdmin';

type RegisterBody = {
  name: string;
  ageYears: number;
  class: string;
  language: string;
  interests: string[];
  whatsappNumber?: string;
};

function generateId(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${base}_${suffix}`;
}

export async function POST(req: Request) {
  if (!isFirebaseConfigured()) {
    return Response.json(
      { error: 'Firebase is not configured' },
      { status: 500 }
    );
  }

  let body: RegisterBody;
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch (e) {
    console.error('Register parse error', e);
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, ageYears, class: cls, language, interests, whatsappNumber } = body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  if (typeof ageYears !== 'number' || ageYears < 4 || ageYears > 10) {
    return Response.json(
      { error: 'Age must be between 4 and 10' },
      { status: 400 }
    );
  }

  if (!cls || typeof cls !== 'string') {
    return Response.json({ error: 'Class is required' }, { status: 400 });
  }

  if (!language || typeof language !== 'string') {
    return Response.json({ error: 'Language is required' }, { status: 400 });
  }

  if (!Array.isArray(interests) || interests.length < 1 || interests.length > 3) {
    return Response.json(
      { error: 'Select 1 to 3 interests' },
      { status: 400 }
    );
  }

  const kidId = generateId(name.trim());
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shabd-web-beta.vercel.app';

  try {
    await getDb().collection('kids').doc(kidId).set({
      name: name.trim(),
      ageYears,
      class: cls,
      language,
      interests,
      sessionCount: 0,
      whatsappNumber: whatsappNumber || null,
      createdAt: Date.now(),
    });

    const link = `${appUrl}/play?kid=${kidId}`;
    return Response.json({ kidId, link });
  } catch (e) {
    console.error('Registration failed', e);
    return Response.json(
      { error: 'Failed to save registration' },
      { status: 500 }
    );
  }
}
