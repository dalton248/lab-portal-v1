import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL =
  'https://n8n-3shape-connection.onrender.com/webhook/b3a50e39-3352-45aa-9ec7-bc544489700c';

export async function POST(request: Request) {
  try {
    // Parse incoming multipart/form-data from the browser
    const incomingForm = await request.formData();

    // Re-assemble a new FormData to forward to n8n
    const outgoingForm = new FormData();

    for (const [key, value] of incomingForm.entries()) {
      if (value instanceof File) {
        // Append actual file binary with its original name and type
        outgoingForm.append(key, value, value.name);
      } else {
        outgoingForm.append(key, value);
      }
    }

    console.log('[submit/route] Forwarding payload to n8n webhook...');

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: outgoingForm,
      // Do NOT set Content-Type — fetch sets it automatically with boundary
    });

    if (!n8nResponse.ok) {
      const text = await n8nResponse.text();
      console.error('[submit/route] n8n responded with error:', n8nResponse.status, text);
      return NextResponse.json(
        { error: `Webhook failed: ${n8nResponse.status}`, detail: text },
        { status: n8nResponse.status }
      );
    }

    const result = await n8nResponse.text();
    console.log('[submit/route] Webhook success:', result);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[submit/route] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
