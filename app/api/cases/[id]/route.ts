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
  const { status, rejection_reason, sender_id, sender_name } = body;

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
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

  // Service-role client for writing audit messages (bypasses RLS)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch the current status so we can build a diff message
    const { data: current } = await supabaseClient
      .from('Cases')
      .select('status, Case_number')
      .eq('id', id)
      .single();

    const previousStatus = current?.status || 'unknown';
    const caseNumber = current?.Case_number || id;

    // 2. Update the case status (and hold_reason for rejections)
    const updatePayload: Record<string, unknown> = { status };
    if (status === 'rejected' && rejection_reason) {
      updatePayload.hold_reason = rejection_reason;
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

    // 3. Insert a status-change audit entry into Case_Messages
    const prevLabel = STATUS_LABELS[previousStatus] ?? previousStatus;
    const newLabel = STATUS_LABELS[status] ?? status;

    let auditMessage = `Status changed: ${prevLabel} → ${newLabel}`;
    if (status === 'rejected' && rejection_reason) {
      auditMessage += `\nReason: ${rejection_reason}`;
    }

    await supabaseAdmin.from('Case_Messages').insert({
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

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Route PATCH Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
