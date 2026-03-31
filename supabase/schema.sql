-- ============================================================
-- LabOps Supabase Schema
-- HIPAA-compliant multi-tenant dental lab management portal
-- ============================================================
-- These are the known table structures inferred from the app.
-- Apply any missing columns/tables via the Supabase dashboard
-- or Supabase CLI migrations.
-- ============================================================

-- Labs table
create table if not exists "Labs" (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  logo                      text,
  address                   text,
  stripe_connect_id         text,
  stripe_onboarding_complete boolean default false,
  created_at                timestamptz default now()
);

-- Users table (lab admins and dentists)
create table if not exists "Users" (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null check (role in ('lab_admin', 'dentist')),
  lab_id      uuid references "Labs"(id),
  avatar      text,
  created_at  timestamptz default now()
);

-- Cases table
create table if not exists "Cases" (
  id                  uuid primary key default gen_random_uuid(),
  "Case_number"       text,
  "FirstName_LastName" text,
  "Type"              text,
  "Shade"             text,
  "UNN"               text,
  "3ShapeID"          text,
  status              text not null default 'submitted'
                        check (status in ('submitted','in_progress','qc','shipping','on_hold','completed','rejected')),
  due_date            date,
  dentist_id          uuid references "Users"(id),
  lab_id              uuid references "Labs"(id),
  price               numeric(10,2),
  prep_type           text,
  what_needed         text,
  input_method        text,
  teeth_numbers       text[],
  notes               text,
  hold_reason         text,
  recipient_id        uuid references "Users"(id),
  recipient_email     text,
  "Case_inbox_method" text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Services table (lab's service catalog)
create table if not exists "Services" (
  id          uuid primary key default gen_random_uuid(),
  lab_id      uuid references "Labs"(id) on delete cascade,
  name        text not null,
  description text,
  base_price  numeric(10,2) not null default 0,
  category    text,
  created_at  timestamptz default now()
);

-- Partnerships (lab ↔ dentist relationships)
create table if not exists "partnerships" (
  id                 uuid primary key default gen_random_uuid(),
  lab_id             uuid references "Labs"(id) on delete cascade,
  user_id            uuid references "Users"(id) on delete cascade,
  status             text default 'pending' check (status in ('pending','active')),
  agreement_accepted boolean default false,
  created_at         timestamptz default now(),
  unique (lab_id, user_id)
);

-- Messages (case discussion threads)
create table if not exists "messages" (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid references "Cases"(id) on delete cascade,
  sender_id   uuid references "Users"(id),
  message     text not null,
  created_at  timestamptz default now()
);
