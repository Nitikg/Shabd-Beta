export const runtime = 'nodejs';

import { getDb, isFirebaseConfigured } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  const body = await req.text();

  // Run Firestore update and webhook relay in parallel — both are best-effort
  const results = await Promise.allSettled([
    saveToFirestore(body),
    relayToWebhook(body, req.headers.get('content-type') ?? 'application/json')
  ]);

  // Succeed as long as at least one destination worked
  const anyOk = results.some((r) => r.status === 'fulfilled' && r.value === true);
  return Response.json({ ok: anyOk });
}

async function saveToFirestore(rawBody: string): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;
  try {
    const payload = JSON.parse(rawBody);
    const { sessionId, starRating, chips, openText, whatsappNumber, childAge, ...rest } = payload;
    if (!sessionId) return false;

    await getDb()
      .collection('sessions')
      .doc(sessionId)
      .update({
        starRating: starRating ?? null,
        chips: chips ?? [],
        openText: openText ?? '',
        whatsappNumber: whatsappNumber ?? '',
        childAge: childAge ?? null,
        device: rest.device ?? null,
        browser: rest.browser ?? null,
        feedbackAt: Date.now()
      });

    return true;
  } catch (e) {
    console.error('Feedback Firestore update failed', e);
    return false;
  }
}

async function relayToWebhook(body: string, contentType: string): Promise<boolean> {
  const url = process.env.FEEDBACK_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body
    });
    return res.ok;
  } catch (e) {
    console.error('Feedback webhook relay failed', e);
    return false;
  }
}
