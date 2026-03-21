export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return Response.json({ error: 'TTS not configured' }, { status: 500 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      body: JSON.stringify({
        text: String(text ?? ''),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.4
        }
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('ElevenLabs error', res.status, body);
      return Response.json(
        { error: body || 'TTS failed' },
        { status: 500 }
      );
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    console.error('TTS route error', e);
    return Response.json({ error: 'TTS failed' }, { status: 500 });
  }
}

