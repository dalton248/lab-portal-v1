import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lab_id } = body;

    if (!lab_id) {
      return NextResponse.json(
        { error: 'lab_id is required' },
        { status: 400 }
      );
    }

    // Node 1 (Webhook): Receives the lab_id from your frontend.
    // Replace with your actual n8n webhook URL
    const N8N_WEBHOOK_URL = process.env.N8N_ONBOARDING_WEBHOOK_URL;

    if (!N8N_WEBHOOK_URL) {
      console.warn('N8N_ONBOARDING_WEBHOOK_URL is not defined. Mocking success for development.');
      // For now, return a mock success if no webhook is defined
      return NextResponse.json({ 
        success: true, 
        message: 'Onboarding triggered (Mock)',
        lab_id 
      });
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lab_id }),
      redirect: 'manual', // Don't follow redirects, capture them
    });

    // Check if it's a redirect (301, 302, 307, 308)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.json({ url: location });
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('n8n webhook error:', errorData);
      throw new Error('Failed to trigger onboarding workflow');
    }

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      // n8n often returns an array of results, take the first one
      if (Array.isArray(data) && data.length > 0) {
        data = data[0];
      }
    } else {
      const text = await response.text();
      // If it's not JSON, it might be just the URL string
      if (text.startsWith('http')) {
        data = { url: text.trim() };
      } else {
        data = { message: text };
      }
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Billing Onboard Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
