import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lab_id } = body;

    if (!lab_id) {
      return NextResponse.json({ error: 'lab_id is required' }, { status: 400 });
    }

    const RESUME_WEBHOOK_URL = process.env.N8N_RESUME_WEBHOOK_URL;

    if (!RESUME_WEBHOOK_URL) {
      console.warn('N8N_RESUME_WEBHOOK_URL not set. Returning mock response.');
      return NextResponse.json({ success: true, message: 'Resume triggered (Mock)', lab_id });
    }

    const response = await fetch(RESUME_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lab_id }),
      redirect: 'manual',
    });

    // Handle redirect (301/302/307/308) — extract the Stripe onboarding URL
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.json({ url: location });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n resume webhook error:', errorText);
      throw new Error('Failed to trigger resume workflow');
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
    } else {
      const text = await response.text();
      data = text.startsWith('http') ? { url: text.trim() } : { message: text };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Billing Resume Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
