export async function POST(req: Request) {
  try {
    const url = process.env.FEEDBACK_WEBHOOK_URL;
    if (!url) return Response.json({ ok: false }, { status: 500 });

    const body = await req.text();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json'
      },
      body
    });

    if (!res.ok) {
      console.error('Feedback webhook error', res.status, await res.text());
      return Response.json({ ok: false }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('Feedback route error', e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

