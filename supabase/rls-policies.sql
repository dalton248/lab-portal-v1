-- ============================================================
-- LabOps Row-Level Security (RLS) Policies
-- HIPAA requirement: no lab sees another lab's data
-- Apply these in Supabase dashboard → Authentication → Policies
-- ============================================================

-- Enable RLS on all tables
alter table "Labs"         enable row level security;
alter table "Users"        enable row level security;
alter table "Cases"        enable row level security;
alter table "Services"     enable row level security;
alter table "partnerships" enable row level security;
alter table "messages"     enable row level security;

-- ============================================================
-- Helper: get the current user's lab_id from Users table
-- ============================================================
create or replace function get_my_lab_id()
returns uuid language sql stable security definer as $$
  select lab_id from "Users" where id = auth.uid()
$$;

create or replace function get_my_role()
returns text language sql stable security definer as $$
  select role from "Users" where id = auth.uid()
$$;

-- ============================================================
-- Labs: each user can only read their own lab
-- ============================================================
create policy "lab_read_own" on "Labs"
  for select using (id = get_my_lab_id());

-- ============================================================
-- Users: users can read others in the same lab
-- ============================================================
create policy "users_read_same_lab" on "Users"
  for select using (lab_id = get_my_lab_id());

create policy "users_update_own" on "Users"
  for update using (id = auth.uid());

-- ============================================================
-- Cases: lab_admins see all cases for their lab
--        dentists see only their own submitted cases
-- ============================================================
create policy "cases_lab_admin_read" on "Cases"
  for select using (
    lab_id = get_my_lab_id() and get_my_role() = 'lab_admin'
  );

create policy "cases_dentist_read_own" on "Cases"
  for select using (
    dentist_id = auth.uid() and get_my_role() = 'dentist'
  );

create policy "cases_dentist_insert" on "Cases"
  for insert with check (
    dentist_id = auth.uid()
  );

create policy "cases_lab_admin_update" on "Cases"
  for update using (
    lab_id = get_my_lab_id() and get_my_role() = 'lab_admin'
  );

-- ============================================================
-- Services: lab_admins manage their own lab's services
--           dentists can read services of their lab
-- ============================================================
create policy "services_read_same_lab" on "Services"
  for select using (lab_id = get_my_lab_id());

create policy "services_lab_admin_write" on "Services"
  for all using (
    lab_id = get_my_lab_id() and get_my_role() = 'lab_admin'
  );

-- ============================================================
-- Partnerships: visible to lab_admin of that lab or the dentist
-- ============================================================
create policy "partnerships_read" on "partnerships"
  for select using (
    lab_id = get_my_lab_id() or user_id = auth.uid()
  );

create policy "partnerships_lab_admin_write" on "partnerships"
  for all using (
    lab_id = get_my_lab_id() and get_my_role() = 'lab_admin'
  );

-- ============================================================
-- Messages: visible to users in the same lab
-- ============================================================
create policy "messages_read_same_lab" on "messages"
  for select using (
    exists (
      select 1 from "Cases" c
      where c.id = case_id and c.lab_id = get_my_lab_id()
    )
  );

create policy "messages_insert" on "messages"
  for insert with check (sender_id = auth.uid());
