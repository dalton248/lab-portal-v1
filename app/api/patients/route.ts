import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dentistId = searchParams.get('dentist_id');

  if (!dentistId) {
    return NextResponse.json({ error: 'Missing dentist_id' }, { status: 400 });
  }

  // Create a service role client to bypass RLS and read cases
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Query Cases table to find unique patient names (FirstName_LastName) for the dentist_id
    const { data, error } = await supabase
      .from('Cases')
      .select('FirstName_LastName')
      .eq('dentist_id', dentistId)
      .not('FirstName_LastName', 'is', null);

    if (error) {
      console.error('Error fetching patients from cases:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique list of patient names
    const uniqueNames = Array.from(
      new Set(
        data
          .map((item: any) => item.FirstName_LastName)
          .filter(Boolean)
          .map((name: string) => name.trim())
      )
    ).sort();

    return NextResponse.json(uniqueNames);
  } catch (err: any) {
    console.error('Unexpected error in /api/patients GET:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
