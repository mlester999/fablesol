-- Fablesol Phase 2A: administrator authorization foundation.
-- Roles, permissions, memberships, invitations, and the append-only audit log.
-- This migration intentionally creates no gameplay, wallet, or economy data.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

-- ---------------------------------------------------------------------------
-- Roles and permissions
-- ---------------------------------------------------------------------------

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  name text not null check (char_length(name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 500),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_roles is
  'Fablesol administrator roles. Stable system keys are protected by database triggers.';

create table public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 500),
  category text not null check (category ~ '^[a-z][a-z0-9_]{1,62}$'),
  is_sensitive boolean not null default false,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_permissions is
  'Server-authoritative permission catalog; browser-submitted values never grant access.';

create table public.admin_role_permissions (
  role_id uuid not null references public.admin_roles(id) on delete cascade,
  permission_id uuid not null references public.admin_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create index admin_role_permissions_permission_id_idx
  on public.admin_role_permissions(permission_id);

-- ---------------------------------------------------------------------------
-- Administrator membership
-- ---------------------------------------------------------------------------

create table public.admin_members (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role_id uuid not null references public.admin_roles(id) on delete restrict,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'suspended')),
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text not null check (
    char_length(email) between 3 and 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  suspended_at timestamptz,
  suspended_by uuid references auth.users(id) on delete set null,
  suspension_reason text check (
    suspension_reason is null or char_length(suspension_reason) between 1 and 500
  ),
  constraint admin_members_suspension_state_check check (
    (status = 'suspended') = (suspended_at is not null)
    and (
      (suspended_at is null and suspended_by is null and suspension_reason is null)
      or suspended_at is not null
    )
  )
);

comment on table public.admin_members is
  'Authorization records linked to auth.users. An auth identity without an active row is not an administrator.';

create unique index admin_members_email_idx on public.admin_members(lower(email));
create index admin_members_role_id_idx on public.admin_members(role_id);
create index admin_members_active_role_idx on public.admin_members(role_id, user_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Invitations (single-use, expiring; only a SHA-256 token hash is stored)
-- ---------------------------------------------------------------------------

create table public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (
    char_length(email) between 3 and 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  full_name text not null check (char_length(full_name) between 1 and 100),
  role_id uuid not null references public.admin_roles(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'link_opened', 'accepted', 'expired', 'revoked')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  link_opened_at timestamptz,
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  resend_count integer not null default 0 check (resend_count between 0 and 50),
  constraint admin_invitations_expiration_check check (expires_at > created_at),
  constraint admin_invitations_accepted_state_check check (
    (status = 'accepted') = (accepted_at is not null and accepted_user_id is not null)
  ),
  constraint admin_invitations_revoked_state_check check (
    (status = 'revoked') = (revoked_at is not null)
  )
);

comment on table public.admin_invitations is
  'Single-use administrator invitations. The plaintext token is never stored; only its SHA-256 hash.';

create index admin_invitations_email_idx on public.admin_invitations(lower(email), created_at desc);
create index admin_invitations_status_idx on public.admin_invitations(status, created_at desc);
create unique index admin_invitations_single_open_idx
  on public.admin_invitations(lower(email))
  where status in ('pending', 'link_opened');

-- ---------------------------------------------------------------------------
-- Append-only audit log
-- ---------------------------------------------------------------------------

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  actor_user_id uuid,
  target_type text check (
    target_type is null or target_type in (
      'admin_member', 'admin_invitation', 'announcement',
      'maintenance', 'feature_availability', 'game_settings', 'system'
    )
  ),
  target_id text check (target_id is null or char_length(target_id) between 1 and 128),
  reason text check (reason is null or char_length(reason) between 1 and 500),
  before_state jsonb not null default '{}'::jsonb check (jsonb_typeof(before_state) = 'object'),
  after_state jsonb not null default '{}'::jsonb check (jsonb_typeof(after_state) = 'object'),
  request_id text check (request_id is null or char_length(request_id) between 1 and 128),
  outcome text not null default 'success' check (outcome in ('success', 'denied', 'error')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_log is
  'Append-only administrative audit history. Secrets, credentials, tokens, and invitation plaintext are forbidden.';

create index admin_audit_log_created_at_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor_user_id, created_at desc);
create index admin_audit_log_event_idx on public.admin_audit_log(event_key, created_at desc);
create index admin_audit_log_target_idx
  on public.admin_audit_log(target_type, target_id, created_at desc)
  where target_type is not null;

-- ---------------------------------------------------------------------------
-- Shared triggers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger admin_roles_set_updated_at
before update on public.admin_roles
for each row execute function private.set_updated_at();

create trigger admin_permissions_set_updated_at
before update on public.admin_permissions
for each row execute function private.set_updated_at();

create trigger admin_members_set_updated_at
before update on public.admin_members
for each row execute function private.set_updated_at();

create or replace function private.protect_system_catalog_row()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.is_system and tg_op = 'DELETE' then
    raise exception 'System authorization metadata cannot be deleted';
  end if;

  if old.is_system and (new.key is distinct from old.key or not new.is_system) then
    raise exception 'System authorization keys and system status are immutable';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger admin_roles_protect_system
before update or delete on public.admin_roles
for each row execute function private.protect_system_catalog_row();

create trigger admin_permissions_protect_system
before update or delete on public.admin_permissions
for each row execute function private.protect_system_catalog_row();

create or replace function private.protect_super_admin_permission_mapping()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.admin_roles as role
    where role.id = old.role_id and role.key = 'super_admin' and role.is_system
  ) then
    raise exception 'Super Admin system permissions cannot be removed or reassigned';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger admin_role_permissions_protect_super_admin
before update or delete on public.admin_role_permissions
for each row execute function private.protect_super_admin_permission_mapping();

-- The final active Super Admin can never be removed, demoted, or suspended.
create or replace function private.protect_last_active_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_is_active_super boolean;
  new_is_active_super boolean := false;
begin
  old_is_active_super := old.status = 'active' and exists (
    select 1 from public.admin_roles as role
    where role.id = old.role_id and role.key = 'super_admin'
  );

  if tg_op <> 'DELETE' then
    new_is_active_super := new.status = 'active' and exists (
      select 1 from public.admin_roles as role
      where role.id = new.role_id and role.key = 'super_admin'
    );
  end if;

  if old_is_active_super and not new_is_active_super then
    perform pg_advisory_xact_lock(hashtext('fablesol.last_active_super_admin'));

    if not exists (
      select 1
      from public.admin_members as member
      join public.admin_roles as role on role.id = member.role_id
      where role.key = 'super_admin'
        and member.status = 'active'
        and member.user_id <> old.user_id
    ) then
      raise exception 'The final active Super Admin cannot be removed, demoted, or suspended';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger admin_members_protect_last_super_admin
before update of role_id, status or delete on public.admin_members
for each row execute function private.protect_last_active_super_admin();

create or replace function private.protect_admin_audit_log()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Administrator audit logs are append-only';
end;
$$;

create trigger admin_audit_log_append_only
before update or delete on public.admin_audit_log
for each row execute function private.protect_admin_audit_log();

-- ---------------------------------------------------------------------------
-- Row-level security lockdown (policies arrive with the authorization functions)
-- ---------------------------------------------------------------------------

alter table public.admin_roles enable row level security;
alter table public.admin_roles force row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_permissions force row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_role_permissions force row level security;
alter table public.admin_members enable row level security;
alter table public.admin_members force row level security;
alter table public.admin_invitations enable row level security;
alter table public.admin_invitations force row level security;
alter table public.admin_audit_log enable row level security;
alter table public.admin_audit_log force row level security;

revoke all on table public.admin_roles from public, anon, authenticated, service_role;
revoke all on table public.admin_permissions from public, anon, authenticated, service_role;
revoke all on table public.admin_role_permissions from public, anon, authenticated, service_role;
revoke all on table public.admin_members from public, anon, authenticated, service_role;
revoke all on table public.admin_invitations from public, anon, authenticated, service_role;
revoke all on table public.admin_audit_log from public, anon, authenticated, service_role;

revoke all on function private.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function private.protect_system_catalog_row() from public, anon, authenticated, service_role;
revoke all on function private.protect_super_admin_permission_mapping() from public, anon, authenticated, service_role;
revoke all on function private.protect_last_active_super_admin() from public, anon, authenticated, service_role;
revoke all on function private.protect_admin_audit_log() from public, anon, authenticated, service_role;
