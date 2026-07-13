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

    // Validate token via Supabase Auth REST API
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
    const {
      patientName,
      invoiceNumber,
      items,
      totalAmount,
      labId,
      dentistId,
      officeId,
      markAsPaid,
    } = body;

    const invNum = invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Insert into Invoices table
    const { data: newInvoice, error: invoiceErr } = await supabase
      .from('Invoices')
      .insert({
        invoice_number: invNum,
        lab_id: labId || null,
        dentist_id: dentistId || null,
        office_id: officeId || null,
        patient_names: patientName || '',
        line_items: items || [],
        total_amount: Number(totalAmount) || 0,
        status: markAsPaid ? 'paid' : 'invoiced',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceErr || !newInvoice) {
      console.error('[invoices/create] Error inserting invoice:', invoiceErr);
      return NextResponse.json({ error: invoiceErr?.message || 'Failed to create invoice' }, { status: 500 });
    }

    const invoiceId = newInvoice.id;

    // 2. Identify linked real cases and mark them as 'Invoiced'
    const linkedCaseIds: string[] = Array.from(
      new Set(
        (items || [])
          .map((item: any) => item.caseId)
          .filter((id: any) => typeof id === 'string' && id.trim() !== '')
      )
    );

    if (linkedCaseIds.length > 0) {
      const { error: updateCasesError } = await supabase
        .from('Cases')
        .update({ status: 'Invoiced' })
        .in('id', linkedCaseIds);

      if (updateCasesError) {
        console.error('[invoices/create] Failed to update linked cases status:', updateCasesError);
      }
    }

    // 3. Record payment if markAsPaid is checked
    if (markAsPaid) {
      const paymentsToInsert: any[] = [
        {
          invoice_id: invoiceId,
          case_id: null,
          office_id: officeId || null,
          patient_name: patientName,
          amount: Number(totalAmount) || 0,
          status: 'paid',
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];

      // Also create payment records for each linked case if present
      if (linkedCaseIds.length > 0) {
        linkedCaseIds.forEach((cId) => {
          const caseItems = (items || []).filter((item: any) => item.caseId === cId);
          const caseTotal = caseItems.reduce((sum: number, item: any) => sum + (Number(item.totalPrice) || 0), 0);
          const casePatient = caseItems[0]?.patientName || patientName || 'Patient';

          paymentsToInsert.push({
            invoice_id: invoiceId,
            case_id: cId,
            office_id: officeId || null,
            patient_name: casePatient,
            amount: caseTotal,
            status: 'paid',
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        });
      }

      const { error: paymentError } = await supabase
        .from('Payments')
        .insert(paymentsToInsert);

      if (paymentError) {
        console.error('[invoices/create] Error recording payments:', paymentError);
      }
    }

    return NextResponse.json({ success: true, invoiceId, invoiceNumber: invNum });
  } catch (err: any) {
    console.error('[invoices/create] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
