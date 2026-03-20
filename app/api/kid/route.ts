export const runtime = 'nodejs';

import { getKidProfile } from '@/lib/kidProfile';
import { isFirebaseConfigured } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kidId = searchParams.get('id');

  if (!kidId) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  if (!isFirebaseConfigured()) {
    // Firebase not configured yet — app still works, just without kid context
    return Response.json({ kid: null });
  }

  const kid = await getKidProfile(kidId);

  if (!kid) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ kid });
}
