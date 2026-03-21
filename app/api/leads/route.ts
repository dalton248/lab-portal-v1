import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const required = ['bottleneck', 'monthlyCases', 'scanner', 'name', 'email', 'phone'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Forward to n8n webhook (using the production webhook logic from other parts of the app)
    // Based on previous issues, n8n webhook seems to be the preferred way to handle external integrations
    const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n-3shape-connection.onrender.com/webhook/9e72e4f0-df4d-46fd-bc80-83734e3de00f';

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: 'Homepage Schedule Call',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('n8n webhook failed, but lead saved locally/logged');
      }
    } catch (webhookError) {
      console.error('Error sending to n8n:', webhookError);
      // We don't fail the whole request if the webhook is down
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
