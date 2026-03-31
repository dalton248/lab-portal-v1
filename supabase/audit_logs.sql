-- ============================================================
-- LabOps HIPAA Audit Log Table
-- Required: log every access to patient records
-- Apply in Supabase dashboard → SQL Editor
-- ============================================================

create table if not exists audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references "Users"(id),
  user_email    text,
  action        text not null,           -- e.g. 'viewed_case', 'updated_status', 'downloaded_file'
  resource_type text not null,           -- e.g. 'case', 'patient_record'
  resource_id   text,                    -- the case/record ID accessed
  patient_name  text,                    -- for quick audit search (not an ID — PHI)
  lab_id        uuid references "Labs"(id),
  ip_address    text,
  user_agent    text,
  metadata      jsonb,                   -- any extra context
  created_at    timestamptz default now()
);

-- Audit logs are append-only — no updates or deletes allowed
alter table audit_logs enable row level security;

-- Only lab admins can read their own lab's audit logs
create policy "audit_logs_lab_admin_read" on audit_logs
  for select using (
    lab_id = get_my_lab_id() and get_my_role() = 'lab_admin'
  );

-- Any authenticated user can insert (the API route handles this server-side)
-- Using service role key in the API route bypasses RLS for inserts
create policy "audit_logs_insert" on audit_logs
  for insert with check (true);

-- Index for fast queries by lab and time
create index if not exists audit_logs_lab_created on audit_logs (lab_id, created_at desc);
create index if not exists audit_logs_user_created on audit_logs (user_id, created_at desc);
