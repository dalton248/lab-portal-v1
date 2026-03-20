import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Case, CaseStatus } from '@/lib/types';

// Use server-side environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
  }

  // Extract token from Authorization header or cookies
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Create a customized supabase client for this request
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  try {
    const { data, error } = await supabaseClient
      .from('Cases')
      .update({ 
        status: status,
        // We'll let Supabase handle updated_at if it's set to auto-update, 
        // but we can also set it explicitly if needed.
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
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
