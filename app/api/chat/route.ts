export const runtime = 'nodejs';

import { MITHU_SYSTEM_PROMPT } from '@/constants/prompts';
import { getKidProfile, getSessionSummary } from '@/lib/kidProfile';
import { buildSystemPrompt } from '@/lib/promptBuilder';
import { isFirebaseConfigured } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { messages, kidId, sessionNumber } = await req.json();

    // Build system prompt — use kid-aware version if profile is available
    let systemPrompt = MITHU_SYSTEM_PROMPT;

    if (kidId && isFirebaseConfigured()) {
      const [kid, prevSummary] = await Promise.all([
        getKidProfile(kidId),
        sessionNumber > 1 ? getSessionSummary(kidId, sessionNumber - 1) : Promise.resolve(null)
      ]);

      if (kid) {
        systemPrompt = buildSystemPrompt(kid, sessionNumber ?? 1, prevSummary);
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ''}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? '',
        'X-Title': 'Mithu App Beta'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        max_tokens: 150,
        messages: [{ role: 'system', content: systemPrompt }, ...(messages ?? [])]
      })
    });

    if (!response.ok) {
      console.error('OpenRouter error', response.status, await response.text());
      return Response.json({ text: '' }, { status: 500 });
    }

    const data = await response.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    const stripped = raw.replace(/\*[^*]+\*/g, '').replace(/\s+/g, ' ').trim();
    const firstQ = stripped.indexOf('?');
    const capped = firstQ !== -1 && stripped.indexOf('?', firstQ + 1) !== -1
      ? stripped.slice(0, firstQ + 1).trim()
      : stripped;
    const text = capped.split('\n').slice(0, 4).join('\n');
    const safe = text.length > 10 ? text : 'Arre wah, something magical happened in the jungle.';

    return Response.json({ text: safe });
  } catch (error) {
    console.error('Chat route error', error);
    return Response.json({ text: '' }, { status: 500 });
  }
}
