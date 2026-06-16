import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Case, CaseStatus } from '@/lib/types';

// Use server-side environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Service role bypasses RLS for audit log writes
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const fetchScans = searchParams.get('fetchScans') === 'true';
  const { id } = await params;
  
  // Extract token from Authorization header or cookies
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Create a customized supabase client for this request
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  const n8nWebhookUrl = 'https://n8n-3shape-connection.onrender.com/webhook/get-3shape-file';

  try {
    // 1. Fetch case metadata from Supabase
    const { data: dbCase, error: dbError } = await supabaseClient
      .from('Cases')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ error: 'Case not found in database' }, { status: 404 });
    }

    // Map Supabase columns to Case interface
    const mappedCase: Case = {
      id: dbCase.id,
      caseId: dbCase.Case_number || 'N/A',
      patientName: dbCase.FirstName_LastName || 'N/A',
      caseType: dbCase.Type || 'N/A',
      shade: dbCase.Shade || 'N/A',
      unn: dbCase.UNN || 'N/A',
      status: (dbCase.status?.toLowerCase() || 'submitted') as CaseStatus,
      dueDate: dbCase.due_date || dbCase.created_at,
      createdAt: dbCase.created_at,
      updatedAt: dbCase.created_at,
      dentistId: dbCase.dentist_id || '',
      dentistName: dbCase.FirstName_LastName || 'N/A',
      labId: dbCase.lab_id || '',
      notes: dbCase.hold_reason || '',
      submitted_date: dbCase.created_at,
      threeShapeId: dbCase['3ShapeID'] || dbCase.threeShapeId || '',
      price: dbCase.price !== null && dbCase.price !== undefined ? Number(dbCase.price) : undefined,
    };

    // 2. Conditionally fetch STL scans from n8n
    if (fetchScans) {
      try {
        const n8nUrlWithParams = new URL(n8nWebhookUrl);
        n8nUrlWithParams.searchParams.append('id', id);
        if (mappedCase.threeShapeId) {
          n8nUrlWithParams.searchParams.append('threeShapeId', mappedCase.threeShapeId);
        }

        const n8nResponse = await fetch(n8nUrlWithParams.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.json();
          // Assuming n8n returns an object with stl_links
          mappedCase.stl_links = n8nData.stl_links || [];
        } else {
          mappedCase.n8n_failed = true;
        }
      } catch (n8nError) {
        console.error('n8n fetch failed:', n8nError);
        mappedCase.n8n_failed = true;
      }
    }

    return NextResponse.json(mappedCase);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Human-readable labels for status audit messages
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Intake',
  in_progress: 'Design',
  qc: 'QC',
  shipping: 'Shipping',
  on_hold: 'On Hold',
  completed: 'Completed',
  rejected: 'Rejected',
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    status,
    rejection_reason,
    sender_id,
    sender_name,
    due_date,
    created_at,
    type,
    shade,
    unn,
    price
  } = body;

  if (
    status === undefined &&
    due_date === undefined &&
    created_at === undefined &&
    type === undefined &&
    shade === undefined &&
    unn === undefined &&
    price === undefined
  ) {
    return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 });
  }

  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // User-scoped client for the Cases update (respects RLS)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  try {
    // Verify user role if they are updating dates or metadata details
    let user: any = null;
    let role: string | null = null;
    if (token) {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser();
      if (!authError && authUser) {
        user = authUser;
        const { data: profileData } = await supabaseClient
          .from('Users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profileData) {
          role = profileData.role;
        }
      }
    }

    const isModifyingSensitiveFields =
      due_date !== undefined ||
      created_at !== undefined ||
      type !== undefined ||
      shade !== undefined ||
      unn !== undefined ||
      price !== undefined;

    if (isModifyingSensitiveFields && role !== 'lab_admin') {
      return NextResponse.json({ error: 'Forbidden: Only lab administrators can modify case details.' }, { status: 403 });
    }

    // 1. Fetch the current status and fields so we can build a diff message
    const { data: current } = await supabaseClient
      .from('Cases')
      .select('status, Case_number, due_date, created_at, Type, Shade, UNN, price')
      .eq('id', id)
      .single();

    const previousStatus = current?.status || 'unknown';
    const previousDueDate = current?.due_date;
    const previousCreatedAt = current?.created_at;
    const previousType = current?.Type;
    const previousShade = current?.Shade;
    const previousUNN = current?.UNN;
    const previousPrice = current?.price;

    // 2. Update the case fields
    const updatePayload: Record<string, unknown> = {};
    if (status !== undefined) {
      updatePayload.status = status;
      if (status === 'rejected' && rejection_reason) {
        updatePayload.hold_reason = rejection_reason;
      }
    }
    if (due_date !== undefined) {
      updatePayload.due_date = due_date || null;
    }
    if (created_at !== undefined) {
      updatePayload.created_at = created_at;
    }
    if (type !== undefined) {
      updatePayload.Type = type || null;
    }
    if (shade !== undefined) {
      updatePayload.Shade = shade || null;
    }
    if (unn !== undefined) {
      updatePayload.UNN = unn || null;
    }
    if (price !== undefined) {
      updatePayload.price = price !== null && price !== '' ? Number(price) : null;
    }

    const { data, error } = await supabaseClient
      .from('Cases')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Insert audit entries into Case_Messages
    const formatDateForAudit = (dateStr: string | null | undefined) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const toDateOnlyStr = (dtStr: string | null | undefined) => {
      if (!dtStr) return '';
      try {
        const d = new Date(dtStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().substring(0, 10);
      } catch {
        return '';
      }
    };

    const auditEntries: any[] = [];

    if (status !== undefined && status !== previousStatus) {
      const prevLabel = STATUS_LABELS[previousStatus] ?? previousStatus;
      const newLabel = STATUS_LABELS[status] ?? status;
      let auditMessage = `Status changed: ${prevLabel} → ${newLabel}`;
      if (status === 'rejected' && rejection_reason) {
        auditMessage += `\nReason: ${rejection_reason}`;
      }
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: auditMessage,
        message_type: 'status_change',
        metadata: {
          previous_status: previousStatus,
          new_status: status,
          sender_name: sender_name || 'Lab',
          rejection_reason: rejection_reason || null,
        },
      });
    }

    if (due_date !== undefined && toDateOnlyStr(due_date) !== toDateOnlyStr(previousDueDate)) {
      const prevVal = formatDateForAudit(previousDueDate);
      const newVal = formatDateForAudit(due_date);
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: `Due Date changed: ${prevVal} → ${newVal}`,
        message_type: 'status_change',
        metadata: {
          previous_due_date: previousDueDate,
          new_due_date: due_date,
          sender_name: sender_name || 'Lab',
        },
      });
    }

    if (created_at !== undefined && toDateOnlyStr(created_at) !== toDateOnlyStr(previousCreatedAt)) {
      const prevVal = formatDateForAudit(previousCreatedAt);
      const newVal = formatDateForAudit(created_at);
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: `Submitted Date changed: ${prevVal} → ${newVal}`,
        message_type: 'status_change',
        metadata: {
          previous_created_at: previousCreatedAt,
          new_created_at: created_at,
          sender_name: sender_name || 'Lab',
        },
      });
    }

    if (type !== undefined && type !== previousType) {
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: `Case Type changed: ${previousType || 'N/A'} → ${type || 'N/A'}`,
        message_type: 'status_change',
        metadata: {
          previous_type: previousType,
          new_type: type,
          sender_name: sender_name || 'Lab',
        },
      });
    }

    if (shade !== undefined && shade !== previousShade) {
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: `Shade changed: ${previousShade || 'N/A'} → ${shade || 'N/A'}`,
        message_type: 'status_change',
        metadata: {
          previous_shade: previousShade,
          new_shade: shade,
          sender_name: sender_name || 'Lab',
        },
      });
    }

    if (unn !== undefined && unn !== previousUNN) {
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: `UNN changed: ${previousUNN || 'N/A'} → ${unn || 'N/A'}`,
        message_type: 'status_change',
        metadata: {
          previous_unn: previousUNN,
          new_unn: unn,
          sender_name: sender_name || 'Lab',
        },
      });
    }

    if (price !== undefined && Number(price) !== Number(previousPrice)) {
      const prevPriceVal = previousPrice !== null && previousPrice !== undefined ? `$${Number(previousPrice).toFixed(2)}` : 'N/A';
      const newPriceVal = price !== null && price !== '' ? `$${Number(price).toFixed(2)}` : 'N/A';
      auditEntries.push({
        case_id: id,
        sender_id: sender_id || null,
        message: `Price changed: ${prevPriceVal} → ${newPriceVal}`,
        message_type: 'status_change',
        metadata: {
          previous_price: previousPrice,
          new_price: price,
          sender_name: sender_name || 'Lab',
        },
      });
    }

    if (auditEntries.length > 0) {
      await supabaseClient.from('Case_Messages').insert(auditEntries);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Route PATCH Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
