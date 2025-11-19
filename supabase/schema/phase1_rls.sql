-- ============================================================
-- 📜 Budget Shark – Phase 1.4: RLS (Row-Level Security) & Access Control
-- ============================================================
-- Purpose: Enforce org-level isolation and secure access for all data tables.
-- This script can be applied once schema creation (Phases 1.1–1.3) is complete.
-- ============================================================

-- 1️⃣ PROFILES TABLE
-- ------------------------------------------------------------
-- Maps each Supabase Auth user to their organization.
-- This table determines which org_id each user can access.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  role text default 'user',  -- options: 'user', 'admin', 'owner'
  created_at timestamptz default now()
);

create unique index if not exists idx_profiles_user_id on profiles(user_id);

-- 2️⃣ ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------
alter table orgs enable row level security;
alter table entities enable row level security;
alter table departments enable row level security;
alter table accounts enable row level security;
alter table scenarios enable row level security;
alter table amounts enable row level security;
alter table upload_batches enable row level security;
alter table variance_commentary enable row level security;
alter table profiles enable row level security;

-- 3️⃣ PROFILES POLICIES
-- ------------------------------------------------------------
-- Allow users to read and insert their own profile mapping.
create policy "profiles_select_own"
on profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_self"
on profiles
for insert
with check (auth.uid() = user_id);

-- 4️⃣ ORG-SCOPED SELECT POLICIES
-- ------------------------------------------------------------
-- Each user can only read rows belonging to their org_id.

create policy "select_org_data_orgs"
on orgs
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = orgs.id
  )
);

create policy "select_org_data_entities"
on entities
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = entities.org_id
  )
);

create policy "select_org_data_departments"
on departments
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = departments.org_id
  )
);

create policy "select_org_data_accounts"
on accounts
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = accounts.org_id
  )
);

create policy "select_org_data_scenarios"
on scenarios
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = scenarios.org_id
  )
);

create policy "select_org_data_amounts"
on amounts
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = amounts.org_id
  )
);

create policy "select_org_data_upload_batches"
on upload_batches
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = upload_batches.org_id
  )
);

create policy "select_org_data_variance_commentary"
on variance_commentary
for select
using (
  exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
    and p.org_id = variance_commentary.org_id
  )
);

-- 5️⃣ ORG-SCOPED INSERT / UPDATE POLICIES
-- ------------------------------------------------------------
-- Users can insert and update data only for their own org.
-- (Pattern shown for entities; repeat for other tables as needed.)

create policy "insert_org_d
