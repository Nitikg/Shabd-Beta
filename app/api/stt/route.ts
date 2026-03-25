export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'STT not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const language = (formData.get('language') as string) || 'hi';

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const res = await fetch(
      `https://api.deepgram.com/v1/listen?model=nova-3&language=${language === 'hi' ? 'hi-Latn' : 'en-IN'}&smart_format=true&punctuate=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': audioFile.type || 'audio/mp4',
        },
        body: buffer,
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('Deepgram error', res.status, body);
      return Response.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const data = await res.json();
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';

    return Response.json({ transcript: transcript.trim() });
  } catch (e) {
    console.error('STT route error', e);
    return Response.json({ error: 'STT failed' }, { status: 500 });
  }
}
