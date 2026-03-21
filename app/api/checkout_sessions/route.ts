import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const headersList = await headers();
    const origin = headersList.get('origin');

    // Create Checkout Session on the server
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1TDEvqE8DqVZe9mL5aMpyrTQ',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode || 500 }
    );
  }
}
