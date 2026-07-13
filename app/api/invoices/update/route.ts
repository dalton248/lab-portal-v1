import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!authRes.ok) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const user = await authRes.json();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Could not identify user' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const body = await request.json();
    const { id, patient_names, line_items, total_amount, due_date, notes, footer } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (patient_names !== undefined) updateData.patient_names = patient_names;
    if (line_items !== undefined) updateData.line_items = line_items;
    if (total_amount !== undefined) updateData.total_amount = Number(total_amount);
    if (due_date !== undefined) updateData.due_date = due_date;
    if (notes !== undefined) updateData.notes = notes;
    if (footer !== undefined) updateData.footer = footer;

    const { data: updatedInvoice, error: updateErr } = await supabase
      .from('Invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[invoices/update] Error updating invoice:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (err: any) {
    console.error('[invoices/update] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
