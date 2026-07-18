-- Fablesol Phase 2A: authorization evaluation, Super Admin bootstrap,
-- invitation lifecycle, member management, and RLS policies.
--
-- There is no separate session service: every request re-evaluates membership
-- from auth.uid(), so suspensions and role changes take effect on the next
-- request without stale client state.

-- ---------------------------------------------------------------------------
-- Authorization evaluation
-- ---------------------------------------------------------------------------

create or replace function private.evaluate_admin_authorization(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  administrator record;
  permission_keys jsonb;
begin
  if p_user_id is null then
    return jsonb_build_object('outcome', 'unauthenticated');
  end if;

  select
    member.user_id,
    member.status,
    member.full_name,
    member.email,
    role.key as role_key,
    role.name as role_name,
    role.id as role_id
  into administrator
  from public.admin_members as member
  join public.admin_roles as role on role.id = member.role_id
  where member.user_id = p_user_id;

  if not found then
    return jsonb_build_object('outcome', 'unauthorized');
  end if;

  if administrator.status = 'suspended' then
    return jsonb_build_object('outcome', 'suspended');
  end if;

  if administrator.status <> 'active' then
    return jsonb_build_object('outcome', 'unauthorized');
  end if;

  select coalesce(jsonb_agg(permission.key order by permission.key), '[]'::jsonb)
  into permission_keys
  from public.admin_role_permissions as role_permission
  join public.admin_permissions as permission on permission.id = role_permission.permission_id
  where role_permission.role_id = administrator.role_id;

  return jsonb_build_object(
    'outcome', 'authorized',
    'context', jsonb_build_object(
      'userId', administrator.user_id,
      'fullName', administrator.full_name,
      'email', administrator.email,
      'roleKey', administrator.role_key,
      'roleName', administrator.role_name,
      'permissionKeys', permission_keys
    )
  );
end;
$$;

create or replace function private.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.evaluate_admin_authorization(auth.uid()) ->> 'outcome' = 'authorized';
$$;

create or replace function private.has_admin_permission(p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    result ->> 'outcome' = 'authorized'
      and (result -> 'context' -> 'permissionKeys') ? p_permission_key,
    false
  )
  from (select private.evaluate_admin_authorization(auth.uid()) as result) as authorization_result;
$$;

create or replace function private.assert_admin_permission(p_permission_key text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_admin_permission(p_permission_key) then
    raise exception using errcode = '42501', message = 'ADMIN_PERMISSION_DENIED';
  end if;
  return auth.uid();
end;
$$;

create or replace function public.get_current_admin_context()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.evaluate_admin_authorization(auth.uid());
$$;

comment on function public.get_current_admin_context() is
  'Returns the caller''s administrator authorization context; never grants or refreshes anything.';

-- ---------------------------------------------------------------------------
-- Super Admin bootstrap (service-role only; the app gates it behind
-- ADMIN_BOOTSTRAP_ENABLED and a Starville-deny project guard)
-- ---------------------------------------------------------------------------

create or replace function public.preview_super_admin_bootstrap(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if p_email is null or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('allowed', false, 'reasonCode', 'INVALID_EMAIL');
  end if;

  if exists (
    select 1
    from public.admin_members as member
    join public.admin_roles as role on role.id = member.role_id
    where role.key = 'super_admin' and member.status = 'active'
  ) then
    return jsonb_build_object('allowed', false, 'reasonCode', 'ACTIVE_SUPER_ADMIN_EXISTS');
  end if;

  if not exists (select 1 from public.admin_roles where key = 'super_admin' and is_system) then
    return jsonb_build_object('allowed', false, 'reasonCode', 'SYSTEM_ROLE_MISSING');
  end if;

  select auth_user.id into target_user_id
  from auth.users as auth_user
  where lower(auth_user.email) = lower(p_email);

  if target_user_id is null then
    return jsonb_build_object('allowed', true, 'reasonCode', null, 'operation', 'create_auth_user_then_membership');
  end if;

  if exists (select 1 from public.admin_members where user_id = target_user_id) then
    return jsonb_build_object('allowed', false, 'reasonCode', 'MEMBERSHIP_ALREADY_EXISTS');
  end if;

  return jsonb_build_object('allowed', true, 'reasonCode', null, 'operation', 'promote_existing_auth_user');
end;
$$;

create or replace function public.bootstrap_super_admin(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  super_admin_role_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('fablesol.bootstrap_super_admin'));

  if p_request_id is not null and char_length(p_request_id) > 128 then
    raise exception 'Request ID is too long';
  end if;

  if p_full_name is null or char_length(btrim(p_full_name)) not between 1 and 100 then
    raise exception 'Administrator full name is invalid';
  end if;

  if p_email is null or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Administrator email is invalid';
  end if;

  if not exists (
    select 1 from auth.users as auth_user
    where auth_user.id = p_user_id and lower(auth_user.email) = lower(p_email)
  ) then
    raise exception 'Bootstrap auth user does not exist or does not match the expected email';
  end if;

  if exists (
    select 1
    from public.admin_members as member
    join public.admin_roles as role on role.id = member.role_id
    where role.key = 'super_admin' and member.status = 'active'
  ) then
    raise exception 'An active Super Admin already exists';
  end if;

  if exists (select 1 from public.admin_members where user_id = p_user_id) then
    raise exception 'Bootstrap refuses to overwrite an existing administrator record';
  end if;

  select id into super_admin_role_id
  from public.admin_roles
  where key = 'super_admin' and is_system
  for update;

  if super_admin_role_id is null then
    raise exception 'System Super Admin role is missing';
  end if;

  insert into public.admin_members (user_id, role_id, status, full_name, email, created_by)
  values (p_user_id, super_admin_role_id, 'active', btrim(p_full_name), lower(p_email), p_user_id);

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, request_id, outcome, after_state)
  values (
    'admin.bootstrap.completed',
    p_user_id,
    'admin_member',
    p_user_id::text,
    p_request_id,
    'success',
    jsonb_build_object('roleKey', 'super_admin', 'status', 'active')
  );

  return jsonb_build_object('operation', 'created', 'userId', p_user_id, 'roleKey', 'super_admin');
end;
$$;

-- ---------------------------------------------------------------------------
-- Invitation lifecycle
-- ---------------------------------------------------------------------------

create or replace function private.invitation_public_state(invitation public.admin_invitations)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', invitation.id,
    'email', invitation.email,
    'fullName', invitation.full_name,
    'status', invitation.status,
    'expiresAt', invitation.expires_at,
    'resendCount', invitation.resend_count
  );
$$;

create or replace function private.mark_invitation_expired(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.admin_invitations%rowtype;
begin
  update public.admin_invitations
  set status = 'expired'
  where id = p_invitation_id and status in ('pending', 'link_opened')
  returning * into invitation;

  if found then
    insert into public.admin_audit_log
      (event_key, target_type, target_id, outcome, before_state, after_state)
    values (
      'admin.invitation.expired',
      'admin_invitation',
      invitation.id::text,
      'success',
      jsonb_build_object('status', 'pending'),
      private.invitation_public_state(invitation)
    );
  end if;
end;
$$;

create or replace function public.create_admin_invitation(
  p_full_name text,
  p_email text,
  p_role_key text,
  p_token_hash text,
  p_expires_in_hours integer,
  p_reason text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_role_id uuid;
  invitation public.admin_invitations%rowtype;
begin
  actor_id := private.assert_admin_permission('admins.invite');

  if p_full_name is null or char_length(btrim(p_full_name)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'INVALID_FULL_NAME';
  end if;
  if p_email is null or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = '22023', message = 'INVALID_EMAIL';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_TOKEN_HASH';
  end if;
  if p_expires_in_hours is null or p_expires_in_hours not between 1 and 336 then
    raise exception using errcode = '22023', message = 'INVALID_EXPIRY';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;
  if p_role_key = 'super_admin' and not private.has_admin_permission('admins.manage_roles') then
    raise exception using errcode = '42501', message = 'ADMIN_PERMISSION_DENIED';
  end if;

  select id into target_role_id from public.admin_roles where key = p_role_key;
  if target_role_id is null then
    raise exception using errcode = '22023', message = 'UNKNOWN_ROLE';
  end if;

  if exists (
    select 1 from public.admin_members where lower(email) = lower(p_email)
  ) then
    raise exception using errcode = '23505', message = 'MEMBER_ALREADY_EXISTS';
  end if;

  -- Expire any stale open invitation for this email so the partial unique
  -- index cannot block a legitimate replacement.
  perform private.mark_invitation_expired(existing.id)
  from public.admin_invitations as existing
  where lower(existing.email) = lower(p_email)
    and existing.status in ('pending', 'link_opened')
    and existing.expires_at <= now();

  if exists (
    select 1 from public.admin_invitations
    where lower(email) = lower(p_email)
      and status in ('pending', 'link_opened')
      and expires_at > now()
  ) then
    raise exception using errcode = '23505', message = 'OPEN_INVITATION_EXISTS';
  end if;

  insert into public.admin_invitations
    (email, full_name, role_id, token_hash, invited_by, expires_at)
  values (
    lower(p_email),
    btrim(p_full_name),
    target_role_id,
    p_token_hash,
    actor_id,
    now() + make_interval(hours => p_expires_in_hours)
  )
  returning * into invitation;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, after_state)
  values (
    'admin.invitation.created',
    actor_id,
    'admin_invitation',
    invitation.id::text,
    btrim(p_reason),
    p_request_id,
    'success',
    private.invitation_public_state(invitation) || jsonb_build_object('roleKey', p_role_key)
  );

  return jsonb_build_object(
    'status', 'created',
    'id', invitation.id,
    'expiresAt', invitation.expires_at
  );
end;
$$;

create or replace function public.resend_admin_invitation(
  p_invitation_id uuid,
  p_new_token_hash text,
  p_expires_in_hours integer,
  p_reason text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  previous_state jsonb;
  invitation public.admin_invitations%rowtype;
begin
  actor_id := private.assert_admin_permission('admins.resend_invite');

  if p_new_token_hash is null or p_new_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_TOKEN_HASH';
  end if;
  if p_expires_in_hours is null or p_expires_in_hours not between 1 and 336 then
    raise exception using errcode = '22023', message = 'INVALID_EXPIRY';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into invitation from public.admin_invitations where id = p_invitation_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'INVITATION_NOT_FOUND';
  end if;
  if invitation.status not in ('pending', 'link_opened') or invitation.expires_at <= now() then
    raise exception using errcode = '22023', message = 'INVITATION_NOT_RESENDABLE';
  end if;

  previous_state := private.invitation_public_state(invitation);

  -- Resending rotates the single-use token; the previous link stops working.
  update public.admin_invitations
  set token_hash = p_new_token_hash,
      status = 'pending',
      link_opened_at = null,
      expires_at = now() + make_interval(hours => p_expires_in_hours),
      resend_count = resend_count + 1
  where id = p_invitation_id
  returning * into invitation;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'admin.invitation.resent',
    actor_id,
    'admin_invitation',
    invitation.id::text,
    btrim(p_reason),
    p_request_id,
    'success',
    previous_state,
    private.invitation_public_state(invitation)
  );

  return jsonb_build_object('status', 'resent', 'id', invitation.id, 'expiresAt', invitation.expires_at);
end;
$$;

create or replace function public.revoke_admin_invitation(
  p_invitation_id uuid,
  p_reason text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  previous_state jsonb;
  invitation public.admin_invitations%rowtype;
begin
  actor_id := private.assert_admin_permission('admins.revoke_invite');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into invitation from public.admin_invitations where id = p_invitation_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'INVITATION_NOT_FOUND';
  end if;
  if invitation.status not in ('pending', 'link_opened') then
    raise exception using errcode = '22023', message = 'INVITATION_NOT_REVOCABLE';
  end if;

  previous_state := private.invitation_public_state(invitation);

  update public.admin_invitations
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = actor_id
  where id = p_invitation_id
  returning * into invitation;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'admin.invitation.revoked',
    actor_id,
    'admin_invitation',
    invitation.id::text,
    btrim(p_reason),
    p_request_id,
    'success',
    previous_state,
    private.invitation_public_state(invitation)
  );

  return jsonb_build_object('status', 'revoked', 'id', invitation.id);
end;
$$;

-- Opening the acceptance page with a valid token marks the invitation
-- "link_opened" (genuinely measured; never claimed as an email open).
-- Token knowledge is the credential, so anon may call this.
create or replace function public.open_admin_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.admin_invitations%rowtype;
  role_name text;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into invitation from public.admin_invitations where token_hash = p_token_hash for update;
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if invitation.status = 'revoked' then
    return jsonb_build_object('status', 'revoked');
  end if;
  if invitation.status = 'accepted' then
    return jsonb_build_object('status', 'accepted');
  end if;
  if invitation.status = 'expired' or invitation.expires_at <= now() then
    perform private.mark_invitation_expired(invitation.id);
    return jsonb_build_object('status', 'expired');
  end if;

  if invitation.status = 'pending' then
    update public.admin_invitations
    set status = 'link_opened',
        link_opened_at = now()
    where id = invitation.id
    returning * into invitation;

    insert into public.admin_audit_log
      (event_key, target_type, target_id, outcome, after_state)
    values (
      'admin.invitation.link_opened',
      'admin_invitation',
      invitation.id::text,
      'success',
      private.invitation_public_state(invitation)
    );
  end if;

  select role.name into role_name
  from public.admin_roles as role
  where role.id = invitation.role_id;

  return jsonb_build_object(
    'status', 'open',
    'fullName', invitation.full_name,
    'email', invitation.email,
    'roleName', role_name,
    'expiresAt', invitation.expires_at
  );
end;
$$;

-- Acceptance requires an authenticated session whose auth email matches the
-- invitation (established through the trusted auth invite email flow).
create or replace function public.accept_admin_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text;
  invitation public.admin_invitations%rowtype;
begin
  if caller_id is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into invitation from public.admin_invitations where token_hash = p_token_hash for update;
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  if invitation.status = 'revoked' then
    return jsonb_build_object('status', 'revoked');
  end if;
  if invitation.status = 'accepted' then
    return jsonb_build_object('status', 'already_accepted');
  end if;
  if invitation.status = 'expired' or invitation.expires_at <= now() then
    perform private.mark_invitation_expired(invitation.id);
    return jsonb_build_object('status', 'expired');
  end if;

  select lower(auth_user.email) into caller_email
  from auth.users as auth_user
  where auth_user.id = caller_id;

  if caller_email is distinct from lower(invitation.email) then
    insert into public.admin_audit_log
      (event_key, actor_user_id, target_type, target_id, outcome, metadata)
    values (
      'admin.invitation.accept_denied',
      caller_id,
      'admin_invitation',
      invitation.id::text,
      'denied',
      jsonb_build_object('reasonCode', 'EMAIL_MISMATCH')
    );
    return jsonb_build_object('status', 'email_mismatch');
  end if;

  if exists (select 1 from public.admin_members where user_id = caller_id) then
    return jsonb_build_object('status', 'already_member');
  end if;

  insert into public.admin_members (user_id, role_id, status, full_name, email, created_by)
  values (caller_id, invitation.role_id, 'active', invitation.full_name, lower(invitation.email), invitation.invited_by);

  update public.admin_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_user_id = caller_id
  where id = invitation.id
  returning * into invitation;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, outcome, after_state)
  values (
    'admin.invitation.accepted',
    caller_id,
    'admin_invitation',
    invitation.id::text,
    'success',
    private.invitation_public_state(invitation)
  );

  return jsonb_build_object('status', 'accepted');
end;
$$;

-- ---------------------------------------------------------------------------
-- Administrator management
-- ---------------------------------------------------------------------------

create or replace function public.get_admin_members()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin_permission('admins.view');

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'userId', member.user_id,
      'fullName', member.full_name,
      'email', member.email,
      'roleKey', role.key,
      'roleName', role.name,
      'status', member.status,
      'emailConfirmedAt', auth_user.email_confirmed_at,
      'lastSignInAt', auth_user.last_sign_in_at,
      'createdAt', member.created_at,
      'updatedAt', member.updated_at,
      'suspendedAt', member.suspended_at,
      'suspensionReason', member.suspension_reason
    ) order by member.created_at asc)
    from public.admin_members as member
    join public.admin_roles as role on role.id = member.role_id
    left join auth.users as auth_user on auth_user.id = member.user_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_admin_invitations()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin_permission('admins.view');

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', invitation.id,
      'email', invitation.email,
      'fullName', invitation.full_name,
      'roleKey', role.key,
      'roleName', role.name,
      'status', case
        when invitation.status in ('pending', 'link_opened') and invitation.expires_at <= now()
          then 'expired'
        else invitation.status
      end,
      'invitedBy', inviter.full_name,
      'createdAt', invitation.created_at,
      'expiresAt', invitation.expires_at,
      'linkOpenedAt', invitation.link_opened_at,
      'acceptedAt', invitation.accepted_at,
      'revokedAt', invitation.revoked_at,
      'resendCount', invitation.resend_count
    ) order by invitation.created_at desc)
    from public.admin_invitations as invitation
    join public.admin_roles as role on role.id = invitation.role_id
    left join public.admin_members as inviter on inviter.user_id = invitation.invited_by
  ), '[]'::jsonb);
end;
$$;

create or replace function public.change_admin_role(
  p_target_user_id uuid,
  p_role_key text,
  p_reason text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_role_id uuid;
  member public.admin_members%rowtype;
  previous_role_key text;
begin
  actor_id := private.assert_admin_permission('admins.manage_roles');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;
  if p_target_user_id = actor_id then
    raise exception using errcode = '42501', message = 'CANNOT_CHANGE_OWN_ROLE';
  end if;

  select id into target_role_id from public.admin_roles where key = p_role_key;
  if target_role_id is null then
    raise exception using errcode = '22023', message = 'UNKNOWN_ROLE';
  end if;

  select * into member from public.admin_members where user_id = p_target_user_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'MEMBER_NOT_FOUND';
  end if;

  select role.key into previous_role_key from public.admin_roles as role where role.id = member.role_id;
  if member.role_id = target_role_id then
    return jsonb_build_object('status', 'unchanged');
  end if;

  -- The last-active-Super-Admin trigger protects demotion paths.
  update public.admin_members
  set role_id = target_role_id
  where user_id = p_target_user_id;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'admin.role.changed',
    actor_id,
    'admin_member',
    p_target_user_id::text,
    btrim(p_reason),
    p_request_id,
    'success',
    jsonb_build_object('roleKey', previous_role_key),
    jsonb_build_object('roleKey', p_role_key)
  );

  return jsonb_build_object('status', 'updated', 'roleKey', p_role_key);
end;
$$;

create or replace function public.suspend_admin(
  p_target_user_id uuid,
  p_reason text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  member public.admin_members%rowtype;
begin
  actor_id := private.assert_admin_permission('admins.suspend');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;
  if p_target_user_id = actor_id then
    raise exception using errcode = '42501', message = 'CANNOT_SUSPEND_SELF';
  end if;

  select * into member from public.admin_members where user_id = p_target_user_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'MEMBER_NOT_FOUND';
  end if;
  if member.status = 'suspended' then
    return jsonb_build_object('status', 'unchanged');
  end if;

  update public.admin_members
  set status = 'suspended',
      suspended_at = now(),
      suspended_by = actor_id,
      suspension_reason = btrim(p_reason)
  where user_id = p_target_user_id;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'admin.member.suspended',
    actor_id,
    'admin_member',
    p_target_user_id::text,
    btrim(p_reason),
    p_request_id,
    'success',
    jsonb_build_object('status', member.status),
    jsonb_build_object('status', 'suspended')
  );

  return jsonb_build_object('status', 'suspended');
end;
$$;

create or replace function public.restore_admin(
  p_target_user_id uuid,
  p_reason text,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  member public.admin_members%rowtype;
begin
  actor_id := private.assert_admin_permission('admins.restore');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into member from public.admin_members where user_id = p_target_user_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'MEMBER_NOT_FOUND';
  end if;
  if member.status <> 'suspended' then
    return jsonb_build_object('status', 'unchanged');
  end if;

  update public.admin_members
  set status = 'active',
      suspended_at = null,
      suspended_by = null,
      suspension_reason = null
  where user_id = p_target_user_id;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'admin.member.restored',
    actor_id,
    'admin_member',
    p_target_user_id::text,
    btrim(p_reason),
    p_request_id,
    'success',
    jsonb_build_object('status', 'suspended'),
    jsonb_build_object('status', 'active')
  );

  return jsonb_build_object('status', 'restored');
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS policies (read-only; every mutation goes through the functions above)
-- ---------------------------------------------------------------------------

grant usage on schema private to authenticated;
grant execute on function private.has_admin_permission(text) to authenticated;

grant select on table public.admin_roles to authenticated;
grant select on table public.admin_permissions to authenticated;
grant select on table public.admin_role_permissions to authenticated;
grant select on table public.admin_members to authenticated;
grant select on table public.admin_audit_log to authenticated;

create policy admin_roles_permission_read
on public.admin_roles for select to authenticated
using (private.is_active_admin());

create policy admin_permissions_permission_read
on public.admin_permissions for select to authenticated
using (private.is_active_admin());

create policy admin_role_permissions_permission_read
on public.admin_role_permissions for select to authenticated
using (private.is_active_admin());

create policy admin_members_permission_read
on public.admin_members for select to authenticated
using (private.has_admin_permission('admins.view'));

create policy admin_audit_log_permission_read
on public.admin_audit_log for select to authenticated
using (private.has_admin_permission('audit.view'));

-- admin_invitations intentionally has no select policy: rows contain token
-- hashes, so reads go only through get_admin_invitations(), which never
-- returns them.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function private.evaluate_admin_authorization(uuid) from public, anon, authenticated, service_role;
revoke all on function private.is_active_admin() from public, anon, authenticated, service_role;
revoke all on function private.has_admin_permission(text) from public, anon, authenticated, service_role;
revoke all on function private.assert_admin_permission(text) from public, anon, authenticated, service_role;
revoke all on function private.invitation_public_state(public.admin_invitations) from public, anon, authenticated, service_role;
revoke all on function private.mark_invitation_expired(uuid) from public, anon, authenticated, service_role;
grant execute on function private.has_admin_permission(text) to authenticated;
grant execute on function private.is_active_admin() to authenticated;

revoke all on function public.get_current_admin_context() from public, anon, authenticated, service_role;
grant execute on function public.get_current_admin_context() to authenticated;

revoke all on function public.preview_super_admin_bootstrap(text) from public, anon, authenticated, service_role;
revoke all on function public.bootstrap_super_admin(uuid, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.preview_super_admin_bootstrap(text) to service_role;
grant execute on function public.bootstrap_super_admin(uuid, text, text, text) to service_role;

revoke all on function public.create_admin_invitation(text, text, text, text, integer, text, text) from public, anon, authenticated, service_role;
revoke all on function public.resend_admin_invitation(uuid, text, integer, text, text) from public, anon, authenticated, service_role;
revoke all on function public.revoke_admin_invitation(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.open_admin_invitation(text) from public, anon, authenticated, service_role;
revoke all on function public.accept_admin_invitation(text) from public, anon, authenticated, service_role;
grant execute on function public.create_admin_invitation(text, text, text, text, integer, text, text) to authenticated;
grant execute on function public.resend_admin_invitation(uuid, text, integer, text, text) to authenticated;
grant execute on function public.revoke_admin_invitation(uuid, text, text) to authenticated;
grant execute on function public.open_admin_invitation(text) to anon, authenticated;
grant execute on function public.accept_admin_invitation(text) to authenticated;

revoke all on function public.get_admin_members() from public, anon, authenticated, service_role;
revoke all on function public.get_admin_invitations() from public, anon, authenticated, service_role;
revoke all on function public.change_admin_role(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.suspend_admin(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.restore_admin(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.get_admin_members() to authenticated;
grant execute on function public.get_admin_invitations() to authenticated;
grant execute on function public.change_admin_role(uuid, text, text, text) to authenticated;
grant execute on function public.suspend_admin(uuid, text, text) to authenticated;
grant execute on function public.restore_admin(uuid, text, text) to authenticated;
