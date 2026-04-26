import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email, phone, officeName, address, method } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Prefer service role key for bypassing RLS on inserts if anon fails, but fallback to anon
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('ONBOARDING NEW USERS')
      .insert([
        { 
          'Email': email, 
          'Phone number': phone,
          'Office Name': officeName,
          'Physical Address': address
        }
      ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }

    // Trigger n8n webhook
    const webhookUrl = 'https://n8n-3shape-connection.onrender.com/webhook/61545ece-f2b9-44e5-b5be-afa70fe9452f';
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, phone, officeName, address, method, source: 'Doctor Connect Scanner' }),
      });
    } catch (webhookError) {
      console.error('Failed to trigger webhook:', webhookError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
