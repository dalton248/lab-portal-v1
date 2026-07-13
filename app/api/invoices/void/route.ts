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

    // Validate the JWT by calling the Supabase Auth REST API directly.
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

    // 1. Check user is lab_admin
    const { data: profile } = await supabase
      .from('Users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'lab_admin') {
      return NextResponse.json({ error: 'Forbidden: Only lab administrators can void invoices' }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json();
    const { invoiceId, caseId } = body;

    if (!invoiceId && !caseId) {
      return NextResponse.json({ error: 'Missing invoiceId or caseId' }, { status: 400 });
    }

    // VOID FLOW A: NEW INVOICES TABLE (if invoiceId passed)
    if (invoiceId) {
      const { data: invData, error: invFetchError } = await supabase
        .from('Invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invFetchError || !invData) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // 1. Update Invoice status to 'voided'
      await supabase
        .from('Invoices')
        .update({ status: 'voided' })
        .eq('id', invoiceId);

      // 2. Delete linked Payments records
      await supabase
        .from('Payments')
        .delete()
        .eq('invoice_id', invoiceId);

      // 3. Revert linked Cases status back to 'completed'
      let linkedCaseIds: string[] = [];
      if (invData.line_items) {
        try {
          const parsedItems = Array.isArray(invData.line_items)
            ? invData.line_items
            : JSON.parse(invData.line_items);
          if (Array.isArray(parsedItems)) {
            linkedCaseIds = Array.from(
              new Set(parsedItems.map((item: any) => item.caseId).filter(Boolean))
            ) as string[];
          }
        } catch (e) {
          console.warn('[void] Failed to parse invoice line_items:', e);
        }
      }

      if (linkedCaseIds.length > 0) {
        await supabase
          .from('Cases')
          .update({ status: 'completed' })
          .in('id', linkedCaseIds);

        // Also delete any payments linked to those individual case IDs
        await supabase
          .from('Payments')
          .delete()
          .in('case_id', linkedCaseIds);

        // Audit log
        const auditLogs = linkedCaseIds.map((cId) => ({
          case_id: cId,
          sender_id: user.id,
          message: `Invoice ${invData.invoice_number} voided: Status reverted from Invoiced to Completed`,
          message_type: 'status_change',
          metadata: {
            previous_status: 'Invoiced',
            new_status: 'completed',
            sender_name: profile.full_name || 'Lab Admin',
          },
        }));

        await supabase.from('Case_Messages').insert(auditLogs);
      }

      // Finally remove the invoice row so it doesn't stay active
      await supabase.from('Invoices').delete().eq('id', invoiceId);

      return NextResponse.json({ success: true, message: 'Invoice voided successfully' });
    }

    // VOID FLOW B: LEGACY CASE INVOICE (if caseId passed)
    const { data: caseData, error: caseFetchError } = await supabase
      .from('Cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseFetchError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    let linkedCaseIds: string[] = [];
    let isMasterInvoice = false;

    if (caseData.line_items) {
      try {
        const parsedItems = Array.isArray(caseData.line_items)
          ? caseData.line_items
          : JSON.parse(caseData.line_items);
        if (Array.isArray(parsedItems)) {
          linkedCaseIds = Array.from(
            new Set(parsedItems.map((item: any) => item.caseId).filter(Boolean))
          ) as string[];
          if (linkedCaseIds.length > 0) isMasterInvoice = true;
        }
      } catch (e) {
        console.warn('[void] Failed to parse line_items:', e);
      }
    }

    const casesToRevert = isMasterInvoice ? linkedCaseIds : [caseId];
    const casesToDelete = isMasterInvoice ? [caseId] : [];

    if (casesToRevert.length > 0) {
      await supabase
        .from('Cases')
        .update({ status: 'completed' })
        .in('id', casesToRevert);

      const auditLogs = casesToRevert.map((cId) => ({
        case_id: cId,
        sender_id: user.id,
        message: 'Invoice voided: Status reverted from Invoiced to Completed',
        message_type: 'status_change',
        metadata: {
          previous_status: 'Invoiced',
          new_status: 'completed',
          sender_name: profile.full_name || 'Lab Admin',
        },
      }));

      await supabase.from('Case_Messages').insert(auditLogs);
    }

    const allPaymentCaseIds = [...casesToRevert, ...casesToDelete];
    if (allPaymentCaseIds.length > 0) {
      await supabase
        .from('Payments')
        .delete()
        .in('case_id', allPaymentCaseIds);
    }

    if (casesToDelete.length > 0) {
      await supabase
        .from('Cases')
        .delete()
        .in('id', casesToDelete);
    }

    return NextResponse.json({ success: true, message: 'Invoice voided successfully' });
  } catch (error: any) {
    console.error('[void] Unhandled error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
