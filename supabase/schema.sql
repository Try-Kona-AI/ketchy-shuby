-- ============================================================================
-- Ketchy Shuby · table-sales CRM schema
-- Run this ONCE in the SQL editor of your Kona AI Supabase project.
-- (Do NOT run this in any CYMBUL project.)
--
-- Multi-user: several logins share ONE workspace (the Ketchy Shuby book).
-- First user to sign in creates the workspace; everyone after joins it.
-- ============================================================================

-- ── Tenants (the shared workspace) ──────────────────────────────────────────
create table if not exists tenants (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  owner_user_id  uuid not null references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- ── Tenant members (who can access the workspace) ───────────────────────────
create table if not exists tenant_members (
  tenant_id   uuid not null references tenants (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'member' check (role in ('owner','member')),
  created_at  timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- ── Clients (people/groups who buy tables) ──────────────────────────────────
create table if not exists clients (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants (id) on delete cascade,
  name               text not null,
  contact_name       text,
  phone              text,
  email              text,
  company            text,
  rep                text,
  status             text not null default 'prospect'
                       check (status in ('prospect','active','vip','dormant')),
  birthday           date,
  next_followup_date date,
  notes              text,
  created_at         timestamptz not null default now()
);

-- ── Outreach (every touch) ──────────────────────────────────────────────────
create table if not exists outreach (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants (id) on delete cascade,
  client_id    uuid not null references clients (id) on delete cascade,
  occurred_on  date not null default current_date,
  type         text not null default 'check_in'
                 check (type in ('check_in','pitch','follow_up','other')),
  channel      text not null default 'text'
                 check (channel in ('call','text','email','dm','in_person','other')),
  outcome      text
                 check (outcome in ('no_response','responded','interested','not_now','closed_won','closed_lost')),
  notes        text,
  created_at   timestamptz not null default now()
);

-- ── Purchases (spend history) ───────────────────────────────────────────────
create table if not exists purchases (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants (id) on delete cascade,
  client_id     uuid not null references clients (id) on delete cascade,
  event_name    text,
  purchased_on  date not null default current_date,
  table_name    text,
  party_size    integer,
  amount        numeric(12,2) not null default 0,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_members_user      on tenant_members (user_id);
create index if not exists idx_clients_tenant     on clients (tenant_id);
create index if not exists idx_clients_followup    on clients (tenant_id, next_followup_date);
create index if not exists idx_outreach_tenant     on outreach (tenant_id);
create index if not exists idx_outreach_client     on outreach (client_id);
create index if not exists idx_purchases_tenant    on purchases (tenant_id);
create index if not exists idx_purchases_client    on purchases (client_id);

-- ── join_workspace(): shared, secure onboarding ─────────────────────────────
-- Runs with elevated rights (security definer) so a brand-new user can find and
-- join the one existing workspace without being able to see it directly first.
-- It only ever acts on the calling user (auth.uid()), so it can't be abused.
create or replace function join_workspace()
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  t_id uuid;
begin
  -- Already a member? use that.
  select tm.tenant_id into t_id from tenant_members tm where tm.user_id = auth.uid() limit 1;

  if t_id is null then
    -- The single shared workspace, if it exists yet.
    select tenants.id into t_id from tenants order by tenants.created_at asc limit 1;

    if t_id is null then
      -- First user ever: create the workspace and own it.
      insert into tenants (name, owner_user_id) values ('Ketchy Shuby', auth.uid())
        returning tenants.id into t_id;
      insert into tenant_members (tenant_id, user_id, role) values (t_id, auth.uid(), 'owner');
    else
      -- Everyone after: join the existing workspace.
      insert into tenant_members (tenant_id, user_id, role) values (t_id, auth.uid(), 'member')
        on conflict do nothing;
    end if;
  end if;

  return query select tenants.id, tenants.name from tenants where tenants.id = t_id;
end;
$$;

grant execute on function join_workspace() to authenticated;

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table tenants        enable row level security;
alter table tenant_members enable row level security;
alter table clients        enable row level security;
alter table outreach       enable row level security;
alter table purchases      enable row level security;

-- Members can read the workspace; owner can rename/delete it.
drop policy if exists tenants_member_read on tenants;
create policy tenants_member_read on tenants
  for select
  using (id in (select tenant_id from tenant_members where user_id = auth.uid()));

drop policy if exists tenants_owner_write on tenants;
create policy tenants_owner_write on tenants
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists tenants_owner_delete on tenants;
create policy tenants_owner_delete on tenants
  for delete
  using (owner_user_id = auth.uid());

-- A user can see their own membership rows.
drop policy if exists members_self on tenant_members;
create policy members_self on tenant_members
  for select
  using (user_id = auth.uid());

-- Data tables: accessible to any member of the owning workspace.
drop policy if exists clients_by_member on clients;
create policy clients_by_member on clients
  for all
  using (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()));

drop policy if exists outreach_by_member on outreach;
create policy outreach_by_member on outreach
  for all
  using (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()));

drop policy if exists purchases_by_member on purchases;
create policy purchases_by_member on purchases
  for all
  using (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()))
  with check (tenant_id in (select tenant_id from tenant_members where user_id = auth.uid()));
