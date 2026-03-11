import { SHABD_SYSTEM_PROMPT } from '@/constants/prompts';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY ?? ''}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? '',
        'X-Title': 'Shabd App Beta'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        max_tokens: 150,
        messages: [
          { role: 'system', content: SHABD_SYSTEM_PROMPT },
          ...(messages ?? [])
        ]
      })
    });

    if (!response.ok) {
      console.error('OpenRouter error', response.status, await response.text());
      return Response.json({ text: '' }, { status: 500 });
    }

    const data = await response.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;

    return Response.json({ text: text ?? '' });
  } catch (error) {
    console.error('Chat route error', error);
    return Response.json({ text: '' }, { status: 500 });
  }
}

