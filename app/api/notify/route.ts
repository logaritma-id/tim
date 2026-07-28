import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { project_title, status, client_wa_number } = await request.json();

    if (!project_title || !status || !client_wa_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = `Halo! Progress pengerjaan website *${project_title}* saat ini berada di tahap: *${status}*. Terima kasih!`;
    const token = process.env.FONNTE_TOKEN;

    if (!token) {
      console.warn("FONNTE_TOKEN is not configured.");
      return NextResponse.json({ error: 'Fonnte Token is missing on server' }, { status: 500 });
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: new URLSearchParams({
        target: client_wa_number,
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('Fonnte Error:', data);
      return NextResponse.json({ error: 'Failed to send WhatsApp message', details: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
