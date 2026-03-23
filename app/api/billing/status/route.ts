import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lab_id = searchParams.get('lab_id');

    if (!lab_id) {
      return NextResponse.json({ error: 'lab_id is required' }, { status: 400 });
    }

    // Create an auth-aware client using the user's JWT from the request
    const authHeader = request.headers.get('Authorization') || '';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data, error } = await supabase
      .from('Labs')
      .select('stripe_connect_id, stripe_onboarding_complete')
      .eq('id', lab_id)
      .single();

    if (error) {
      console.error('Error fetching lab status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Billing Status Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

