import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lab_id, stripe_connect_id } = body;

    if (!lab_id) {
      return NextResponse.json({ error: 'lab_id is required' }, { status: 400 });
    }

    const CHECK_STATUS_URL = process.env.N8N_CHECK_STATUS_WEBHOOK_URL;

    if (!CHECK_STATUS_URL) {
      console.warn('N8N_CHECK_STATUS_WEBHOOK_URL not set. Skipping status check.');
      return NextResponse.json({ success: true, message: 'Status check skipped (no webhook configured)' });
    }

    const response = await fetch(CHECK_STATUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lab_id, stripe_connect_id }),
      redirect: 'manual',
    });

    // If n8n redirects, capture the location
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) return NextResponse.json({ url: location });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n check-status webhook error:', errorText);
      // Non-fatal — don't throw, just return a warning
      return NextResponse.json({ success: false, message: 'Status webhook returned an error' }, { status: 200 });
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      if (Array.isArray(data) && data.length > 0) data = data[0];
    } else {
      const text = await response.text();
      data = { message: text };
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Billing Check Status Error:', error);
    // Non-fatal — page should still load even if this fails
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
