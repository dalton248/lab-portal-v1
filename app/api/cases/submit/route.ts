import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const N8N_WEBHOOK_URL =
  'https://n8n-3shape-connection.onrender.com/webhook/b3a50e39-3352-45aa-9ec7-bc544489700c';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // Parse incoming multipart/form-data from the browser
    const incomingForm = await request.formData();

    // 1. Prepare fields for direct Supabase Insertion
    const patientName = incomingForm.get('patientName') as string || 'N/A';
    const caseId = incomingForm.get('caseId') as string || `CS-${Math.floor(1000 + Math.random() * 9000)}`;
    const caseType = incomingForm.get('caseType') as string || 'Crown';
    const shade = incomingForm.get('shade') as string || 'N/A';
    const priceStr = incomingForm.get('price');
    const price = priceStr ? parseFloat(priceStr as string) : null;
    const dueDate = incomingForm.get('dueDate') as string || null;
    const dentistId = incomingForm.get('dentistId') as string || null;
    const labId = incomingForm.get('labId') as string || null;
    const notes = incomingForm.get('notes') as string || '';
    const inputMethod = incomingForm.get('input_method') as string || 'email';

    // Parse teeth numbers (JSON array of strings) and format as comma-separated values for UNN
    const teethRaw = incomingForm.get('teeth_numbers');
    let teethJoined = 'N/A';
    if (teethRaw) {
      try {
        const parsed = JSON.parse(teethRaw as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          teethJoined = parsed.join(', ');
        }
      } catch (e) {
        teethJoined = String(teethRaw);
      }
    }

    // Pre-insert Check: Query the database for any existing case matching Case_number and lab_id
    console.log(`[submit/route] Checking if case ${caseId} already exists in database...`);
    const { data: existingCase, error: checkError } = await supabase
      .from('Cases')
      .select('id')
      .eq('Case_number', caseId)
      .eq('lab_id', labId)
      .maybeSingle();

    if (checkError) {
      console.warn('[submit/route] Warning checking for existing case:', checkError.message);
    }

    if (existingCase) {
      console.log(`[submit/route] Case ${caseId} already exists (ID: ${existingCase.id}). Skipping insertion.`);
      return NextResponse.json({ 
        success: true, 
        caseId: existingCase.id,
        alreadyExists: true 
      });
    }

    // Pre-generate UUID on the server to avoid running a subsequent SELECT under RLS
    const newCaseDbId = crypto.randomUUID();

    console.log('[submit/route] Inserting case into Supabase database directly...');
    const { error: insertError } = await supabase
      .from('Cases')
      .insert([
        {
          id: newCaseDbId,
          lab_id: labId,
          dentist_id: dentistId,
          status: 'Submitted',
          due_date: dueDate,
          price: price,
          hold_reason: notes,
          FirstName_LastName: patientName,
          Case_number: caseId,
          Type: caseType,
          Shade: shade,
          UNN: teethJoined,
          Case_inbox_method: inputMethod === 'upload' ? 'email' : inputMethod,
          sent_to_lab: true,
          completed: false,
        }
      ]);

    if (insertError) {
      console.error('[submit/route] Supabase insert failed:', insertError);
      return NextResponse.json(
        { error: `Database insert failed: ${insertError.message}` },
        { status: 400 }
      );
    }

    console.log('[submit/route] Successfully inserted case:', newCaseDbId);

    // 2. Re-assemble a new FormData to forward to n8n
    const outgoingForm = new FormData();
    for (const [key, value] of incomingForm.entries()) {
      if (value instanceof File) {
        // Append actual file binary with its original name and type
        outgoingForm.append(key, value, value.name);
      } else {
        outgoingForm.append(key, value);
      }
    }
    // Forward the database case ID to n8n for alignment/logging
    outgoingForm.append('db_case_id', newCaseDbId);

    try {
      console.log('[submit/route] Forwarding payload to n8n webhook...');
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: outgoingForm,
        // Do NOT set Content-Type — fetch sets it automatically with boundary
      });

      if (!n8nResponse.ok) {
        const text = await n8nResponse.text();
        console.error('[submit/route] n8n responded with error:', n8nResponse.status, text);
        // We still succeed because it has successfully written to Supabase!
        return NextResponse.json({ 
          success: true, 
          caseId: newCaseDbId, 
          webhookWarning: `Webhook failed with status: ${n8nResponse.status}` 
        });
      }

      const result = await n8nResponse.text();
      console.log('[submit/route] Webhook success:', result);
      return NextResponse.json({ success: true, caseId: newCaseDbId, result });
    } catch (webhookErr: any) {
      console.error('[submit/route] Webhook trigger failed:', webhookErr);
      // Fallback: DB insertion succeeded, return success with a warning
      return NextResponse.json({ 
        success: true, 
        caseId: newCaseDbId, 
        webhookWarning: webhookErr.message 
      });
    }
  } catch (err: any) {
    console.error('[submit/route] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
