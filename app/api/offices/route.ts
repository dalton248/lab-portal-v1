import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const { data: offices, error: officesError } = await supabase
      .from('user_offices')
      .select('*');

    if (officesError) {
      console.error('Error fetching offices:', officesError);
      return NextResponse.json({ error: officesError.message }, { status: 500 });
    }

    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('id, full_name, email, office_name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const officeList = (offices || []).map(office => {
      const user = (users || []).find(u => u.id === office.user_id);
      return {
        ...office,
        dentist_name: user?.full_name || user?.office_name || 'N/A',
        dentist_email: user?.email || 'N/A'
      };
    });

    return NextResponse.json(officeList);
  } catch (err: any) {
    console.error('Unexpected error in /api/offices GET:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const body = await request.json();
    const { id, address_line1, address_line2, city, state, zip_code, phone, office_name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing office id' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      address_line1: address_line1 ?? null,
      address_line2: address_line2 ?? null,
      city: city ?? null,
      state: state ?? null,
      zip_code: zip_code ?? null,
      phone: phone ?? null,
    };

    if (office_name !== undefined) {
      updatePayload.office_name = office_name;
    }

    const { data, error } = await supabase
      .from('user_offices')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating office:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Unexpected error in /api/offices PUT:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
