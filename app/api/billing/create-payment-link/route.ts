import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface LineItemPayload {
  serviceName: string;
  totalPrice: number;
  teeth?: string[];
  prepType?: string;
}

export async function POST(request: Request) {
  try {
    const { labId, patientName, items, totalAmount, recipientEmail } = await request.json();

    if (!labId || !items?.length || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the lab's Stripe Connect account ID
    const { data: lab, error: labError } = await supabase
      .from('Labs')
      .select('stripe_connect_id, stripe_onboarding_complete, name')
      .eq('id', labId)
      .single();

    if (labError || !lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
    }

    if (!lab.stripe_connect_id || !lab.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Lab has not completed Stripe Connect setup' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Build line items for Stripe Checkout
    const stripeLineItems = items.map((item: LineItemPayload) => ({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(item.totalPrice * 100), // cents
        product_data: {
          name: item.serviceName,
          description: [
            item.teeth?.length ? `Teeth: ${item.teeth.join(', ')}` : null,
            item.prepType ? `Prep: ${item.prepType}` : null,
          ]
            .filter(Boolean)
            .join(' | ') || undefined,
        },
      },
      quantity: 1,
    }));

    // Create Stripe Checkout session on behalf of the lab's Connect account
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: stripeLineItems,
        customer_email: recipientEmail || undefined,
        metadata: {
          lab_id: labId,
          patient_name: patientName || '',
        },
        success_url: `${baseUrl}/billing?payment=success`,
        cancel_url: `${baseUrl}/billing/invoices/new`,
      },
      {
        stripeAccount: lab.stripe_connect_id,
      }
    );

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('[create-payment-link] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create payment link' },
      { status: 500 }
    );
  }
}
