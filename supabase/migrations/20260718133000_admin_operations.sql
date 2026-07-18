-- Fablesol Phase 2A: announcements, maintenance mode, feature availability,
-- and game settings. Draft -> publish -> version history throughout.
-- No gameplay tables; no seeded drafts or fabricated content.

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100 and title !~ '[[:cntrl:]<>]'),
  message text not null check (char_length(message) between 1 and 500 and message !~ '[<>]'),
  severity text not null default 'information'
    check (severity in ('information', 'success', 'warning', 'critical')),
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text check (cta_label is null or (char_length(cta_label) between 1 and 40 and cta_label !~ '[[:cntrl:]<>]')),
  cta_url text check (
    cta_url is null or (
      char_length(cta_url) between 1 and 500
      and (cta_url = '/' or cta_url ~ '^/[^/]' or cta_url ~* '^https://[^[:space:]]+$')
    )
  ),
  dismissible boolean not null default true,
  audience text not null default 'public' check (audience in ('public')),
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'published', 'cancelled')),
  revision integer not null default 1 check (revision > 0),
  created_by uuid not null references public.admin_members(user_id) on delete restrict,
  updated_by uuid not null references public.admin_members(user_id) on delete restrict,
  published_by uuid references public.admin_members(user_id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_window_check check (
    ends_at is null or starts_at is null or ends_at > starts_at
  ),
  constraint announcements_cta_pair_check check ((cta_label is null) = (cta_url is null)),
  constraint announcements_published_state_check check (
    (lifecycle_status <> 'published') or (published_at is not null and published_by is not null)
  )
);

comment on table public.announcements is
  'Fablesol announcements. Effective status (draft, scheduled, active, expired, cancelled) is computed from lifecycle and UTC time window.';

create index announcements_published_idx on public.announcements(starts_at desc, id desc)
  where lifecycle_status = 'published';
create index announcements_admin_idx on public.announcements(updated_at desc, id desc);

-- ---------------------------------------------------------------------------
-- Maintenance versions
-- ---------------------------------------------------------------------------

create table public.maintenance_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null unique check (version_number > 0),
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'published', 'superseded')),
  enabled boolean not null default false,
  title text not null default 'Scheduled maintenance'
    check (char_length(title) between 1 and 80 and title !~ '[[:cntrl:]<>]'),
  short_message text not null default 'Fablesol is temporarily unavailable for maintenance.'
    check (char_length(short_message) between 1 and 240 and short_message !~ '[<>]'),
  detail_message text check (
    detail_message is null or (char_length(detail_message) between 1 and 2000 and detail_message !~ '[<>]')
  ),
  starts_at timestamptz,
  expected_end_at timestamptz,
  created_by uuid not null references public.admin_members(user_id) on delete restrict,
  updated_by uuid not null references public.admin_members(user_id) on delete restrict,
  published_by uuid references public.admin_members(user_id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_versions_window_check check (
    expected_end_at is null or starts_at is null or expected_end_at > starts_at
  ),
  constraint maintenance_versions_published_state_check check (
    (lifecycle_status <> 'published') or (published_at is not null and published_by is not null)
  )
);

comment on table public.maintenance_versions is
  'Versioned maintenance configuration. Only the published version affects public behavior; drafts are invisible to the public site.';

create unique index maintenance_versions_single_draft_idx
  on public.maintenance_versions((true)) where lifecycle_status = 'draft';
create unique index maintenance_versions_single_published_idx
  on public.maintenance_versions((true)) where lifecycle_status = 'published';

-- ---------------------------------------------------------------------------
-- Feature availability
-- ---------------------------------------------------------------------------

create table public.feature_keys (
  key text primary key check (key ~ '^[a-z][a-z0-9-]{1,62}$'),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

comment on table public.feature_keys is
  'Registry of known feature keys mirrored from the typed public registry. Unknown keys cannot be created through the admin portal.';

create or replace function private.valid_feature_overrides(p_value jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  entry record;
begin
  if jsonb_typeof(p_value) is distinct from 'object'
     or octet_length(p_value::text) > 65536 then
    return false;
  end if;

  for entry in select * from jsonb_each(p_value) loop
    if not exists (select 1 from public.feature_keys where key = entry.key) then
      return false;
    end if;
    if jsonb_typeof(entry.value) is distinct from 'object' then
      return false;
    end if;
    if entry.value ->> 'status' not in
       ('live', 'beta', 'planned', 'balancing', 'temporarily-unavailable') then
      return false;
    end if;
    if entry.value -> 'note' is not null
       and jsonb_typeof(entry.value -> 'note') is distinct from 'null'
       and (
         jsonb_typeof(entry.value -> 'note') is distinct from 'string'
         or char_length(entry.value ->> 'note') > 200
         or (entry.value ->> 'note') ~ '[[:cntrl:]<>]'
       ) then
      return false;
    end if;
    if exists (
      select 1 from jsonb_object_keys(entry.value) as field(name)
      where field.name not in ('status', 'note')
    ) then
      return false;
    end if;
  end loop;

  return true;
exception when others then
  return false;
end;
$$;

create table public.feature_availability_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null unique check (version_number > 0),
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'published', 'superseded')),
  overrides jsonb not null default '{}'::jsonb check (private.valid_feature_overrides(overrides)),
  created_by uuid not null references public.admin_members(user_id) on delete restrict,
  updated_by uuid not null references public.admin_members(user_id) on delete restrict,
  published_by uuid references public.admin_members(user_id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_availability_published_state_check check (
    (lifecycle_status <> 'published') or (published_at is not null and published_by is not null)
  )
);

comment on table public.feature_availability_versions is
  'Versioned feature availability overrides. The public site reads only the published version and always falls back to the typed local registry.';

create unique index feature_availability_single_draft_idx
  on public.feature_availability_versions((true)) where lifecycle_status = 'draft';
create unique index feature_availability_single_published_idx
  on public.feature_availability_versions((true)) where lifecycle_status = 'published';

-- ---------------------------------------------------------------------------
-- Game settings
-- ---------------------------------------------------------------------------

create or replace function private.valid_game_settings(p_value jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  color record;
begin
  if jsonb_typeof(p_value) is distinct from 'object'
     or octet_length(p_value::text) > 32768 then
    return false;
  end if;

  if exists (
    select 1 from jsonb_object_keys(p_value) as field(name)
    where field.name not in (
      'gameName', 'publicStatusLabel', 'logoReference', 'brandColors',
      'discordUrl', 'xUrl', 'supportedNetworkLabel', 'fableAccessDisplay',
      'announcementsEnabled', 'maintenanceBannerEnabled'
    )
  ) then
    return false;
  end if;

  if char_length(coalesce(p_value ->> 'gameName', '')) not between 2 and 80
     or (p_value ->> 'gameName') ~ '[[:cntrl:]<>]'
     or char_length(coalesce(p_value ->> 'publicStatusLabel', '')) not between 2 and 80
     or (p_value ->> 'publicStatusLabel') ~ '[[:cntrl:]<>]'
     or char_length(coalesce(p_value ->> 'supportedNetworkLabel', '')) not between 2 and 40
     or (p_value ->> 'supportedNetworkLabel') ~ '[[:cntrl:]<>]'
     or char_length(coalesce(p_value ->> 'fableAccessDisplay', '')) not between 2 and 80
     or (p_value ->> 'fableAccessDisplay') ~ '[[:cntrl:]<>]'
  then
    return false;
  end if;

  if jsonb_typeof(p_value -> 'announcementsEnabled') is distinct from 'boolean'
     or jsonb_typeof(p_value -> 'maintenanceBannerEnabled') is distinct from 'boolean' then
    return false;
  end if;

  -- Logo must reference a repository path or https URL; never inline data.
  if p_value -> 'logoReference' is not null
     and jsonb_typeof(p_value -> 'logoReference') is distinct from 'null'
     and (
       jsonb_typeof(p_value -> 'logoReference') is distinct from 'string'
       or (
         (p_value ->> 'logoReference') !~ '^/[A-Za-z0-9/_.-]+$'
         and (p_value ->> 'logoReference') !~* '^https://[^[:space:]]+$'
       )
     ) then
    return false;
  end if;

  -- Discord and X are the only allowed social links.
  if p_value -> 'discordUrl' is not null
     and jsonb_typeof(p_value -> 'discordUrl') is distinct from 'null'
     and (p_value ->> 'discordUrl') !~* '^https://(discord\.gg|discord\.com)/[^[:space:]]+$' then
    return false;
  end if;
  if p_value -> 'xUrl' is not null
     and jsonb_typeof(p_value -> 'xUrl') is distinct from 'null'
     and (p_value ->> 'xUrl') !~* '^https://(x\.com|twitter\.com)/[^[:space:]]+$' then
    return false;
  end if;

  if jsonb_typeof(p_value -> 'brandColors') is distinct from 'object'
     or (select count(*) from jsonb_object_keys(p_value -> 'brandColors')) > 12 then
    return false;
  end if;
  for color in select * from jsonb_each_text(p_value -> 'brandColors') loop
    if color.key !~ '^[a-z][a-zA-Z0-9]{1,39}$' or color.value !~ '^#[0-9A-Fa-f]{6}$' then
      return false;
    end if;
  end loop;

  return true;
exception when others then
  return false;
end;
$$;

create table public.game_settings_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null unique check (version_number > 0),
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'published', 'superseded')),
  settings jsonb not null check (private.valid_game_settings(settings)),
  created_by uuid not null references public.admin_members(user_id) on delete restrict,
  updated_by uuid not null references public.admin_members(user_id) on delete restrict,
  published_by uuid references public.admin_members(user_id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_settings_published_state_check check (
    (lifecycle_status <> 'published') or (published_at is not null and published_by is not null)
  )
);

comment on table public.game_settings_versions is
  'Versioned presentation settings. The $FABLE access requirement is display-only in Phase 2A; enforcement arrives in Phase 2B. Security-critical configuration stays environment controlled.';

create unique index game_settings_single_draft_idx
  on public.game_settings_versions((true)) where lifecycle_status = 'draft';
create unique index game_settings_single_published_idx
  on public.game_settings_versions((true)) where lifecycle_status = 'published';

-- ---------------------------------------------------------------------------
-- Shared protection triggers
-- ---------------------------------------------------------------------------

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function private.set_updated_at();

create trigger maintenance_versions_set_updated_at
before update on public.maintenance_versions
for each row execute function private.set_updated_at();

create trigger feature_availability_versions_set_updated_at
before update on public.feature_availability_versions
for each row execute function private.set_updated_at();

create trigger game_settings_versions_set_updated_at
before update on public.game_settings_versions
for each row execute function private.set_updated_at();

-- Version history is immutable: no deletes anywhere; published and superseded
-- rows only ever transition published -> superseded.
create or replace function private.protect_version_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501', message = 'VERSION_HISTORY_IMMUTABLE';
  end if;

  if old.lifecycle_status = 'superseded' then
    raise exception using errcode = '42501', message = 'VERSION_HISTORY_IMMUTABLE';
  end if;

  if old.lifecycle_status = 'published'
     and not (new.lifecycle_status = 'superseded'
       and new.version_number = old.version_number
       and new.published_at = old.published_at
       and new.published_by is not distinct from old.published_by
       and new.created_at = old.created_at) then
    raise exception using errcode = '42501', message = 'VERSION_HISTORY_IMMUTABLE';
  end if;

  return new;
end;
$$;

create trigger maintenance_versions_protect_history
before update or delete on public.maintenance_versions
for each row execute function private.protect_version_history();

create trigger feature_availability_versions_protect_history
before update or delete on public.feature_availability_versions
for each row execute function private.protect_version_history();

create trigger game_settings_versions_protect_history
before update or delete on public.game_settings_versions
for each row execute function private.protect_version_history();

create or replace function private.protect_announcement_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '42501', message = 'ANNOUNCEMENTS_IMMUTABLE';
  end if;

  if old.lifecycle_status = 'cancelled' then
    raise exception using errcode = '42501', message = 'ANNOUNCEMENTS_IMMUTABLE';
  end if;

  -- Published announcements may only be cancelled; content edits require a
  -- new draft.
  if old.lifecycle_status = 'published'
     and new.lifecycle_status <> 'cancelled'
     and (
       new.title is distinct from old.title
       or new.message is distinct from old.message
       or new.severity is distinct from old.severity
       or new.starts_at is distinct from old.starts_at
       or new.ends_at is distinct from old.ends_at
       or new.cta_label is distinct from old.cta_label
       or new.cta_url is distinct from old.cta_url
       or new.dismissible is distinct from old.dismissible
       or new.audience is distinct from old.audience
     ) then
    raise exception using errcode = '42501', message = 'ANNOUNCEMENTS_IMMUTABLE';
  end if;

  return new;
end;
$$;

create trigger announcements_protect_row
before update or delete on public.announcements
for each row execute function private.protect_announcement_row();

-- ---------------------------------------------------------------------------
-- Effective status helpers
-- ---------------------------------------------------------------------------

create or replace function private.announcement_effective_status(item public.announcements)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when item.lifecycle_status = 'draft' then 'draft'
    when item.lifecycle_status = 'cancelled' then 'cancelled'
    when item.starts_at is not null and item.starts_at > now() then 'scheduled'
    when item.ends_at is not null and item.ends_at <= now() then 'expired'
    else 'active'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Public read functions (fail safe; never expose drafts or admin metadata)
-- ---------------------------------------------------------------------------

create or replace function public.get_public_announcements()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', item.id,
      'message', item.message,
      'severity', item.severity,
      'dismissible', item.dismissible,
      'ctaLabel', item.cta_label,
      'ctaUrl', item.cta_url,
      'endsAt', item.ends_at
    ) order by (item.severity = 'critical') desc, item.starts_at desc nulls last, item.id desc)
    from (
      select * from public.announcements as source
      where source.lifecycle_status = 'published'
        and private.announcement_effective_status(source) = 'active'
      order by (source.severity = 'critical') desc, source.starts_at desc nulls last, source.id desc
      limit 3
    ) as item
  ), '[]'::jsonb);
exception when others then
  return '[]'::jsonb;
end;
$$;

create or replace function public.get_public_maintenance()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  config public.maintenance_versions%rowtype;
begin
  select * into config
  from public.maintenance_versions
  where lifecycle_status = 'published'
  limit 1;

  if not found or not config.enabled then
    return jsonb_build_object('active', false);
  end if;

  if config.starts_at is not null and config.starts_at > now() then
    return jsonb_build_object(
      'active', false,
      'scheduled', true,
      'title', config.title,
      'shortMessage', config.short_message,
      'startsAt', config.starts_at,
      'expectedEndAt', config.expected_end_at
    );
  end if;

  return jsonb_build_object(
    'active', true,
    'title', config.title,
    'shortMessage', config.short_message,
    'detailMessage', config.detail_message,
    'startsAt', config.starts_at,
    'expectedEndAt', config.expected_end_at
  );
exception when others then
  -- The public site must keep working when configuration cannot load.
  return jsonb_build_object('active', false);
end;
$$;

create or replace function public.get_public_feature_availability()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce((
    select version.overrides
    from public.feature_availability_versions as version
    where version.lifecycle_status = 'published'
    limit 1
  ), '{}'::jsonb);
exception when others then
  return '{}'::jsonb;
end;
$$;

create or replace function public.get_public_game_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce((
    select version.settings
    from public.game_settings_versions as version
    where version.lifecycle_status = 'published'
    limit 1
  ), '{}'::jsonb);
exception when others then
  return '{}'::jsonb;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin mutation functions
-- ---------------------------------------------------------------------------

create or replace function public.save_announcement(
  p_input jsonb,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target public.announcements%rowtype;
  previous jsonb := '{}'::jsonb;
  target_id uuid;
begin
  target_id := nullif(p_input ->> 'id', '')::uuid;

  if target_id is null then
    actor_id := private.assert_admin_permission('announcements.create');
  else
    actor_id := private.assert_admin_permission('announcements.update');
  end if;

  if target_id is null then
    insert into public.announcements
      (title, message, severity, starts_at, ends_at, cta_label, cta_url, dismissible, created_by, updated_by)
    values (
      p_input ->> 'title',
      p_input ->> 'message',
      coalesce(p_input ->> 'severity', 'information'),
      nullif(p_input ->> 'startsAt', '')::timestamptz,
      nullif(p_input ->> 'endsAt', '')::timestamptz,
      nullif(p_input ->> 'ctaLabel', ''),
      nullif(p_input ->> 'ctaUrl', ''),
      coalesce((p_input ->> 'dismissible')::boolean, true),
      actor_id,
      actor_id
    )
    returning * into target;

    insert into public.admin_audit_log
      (event_key, actor_user_id, target_type, target_id, request_id, outcome, after_state)
    values (
      'announcement.created', actor_id, 'announcement', target.id::text, p_request_id, 'success',
      to_jsonb(target) - array['created_by', 'updated_by', 'published_by']
    );

    return jsonb_build_object('status', 'created', 'id', target.id, 'revision', target.revision);
  end if;

  select * into target from public.announcements where id = target_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'ANNOUNCEMENT_NOT_FOUND';
  end if;
  if target.lifecycle_status <> 'draft'
     or (p_input ->> 'expectedRevision')::integer is distinct from target.revision then
    return jsonb_build_object('status', 'version_conflict');
  end if;

  previous := to_jsonb(target) - array['created_by', 'updated_by', 'published_by'];

  update public.announcements
  set title = p_input ->> 'title',
      message = p_input ->> 'message',
      severity = coalesce(p_input ->> 'severity', 'information'),
      starts_at = nullif(p_input ->> 'startsAt', '')::timestamptz,
      ends_at = nullif(p_input ->> 'endsAt', '')::timestamptz,
      cta_label = nullif(p_input ->> 'ctaLabel', ''),
      cta_url = nullif(p_input ->> 'ctaUrl', ''),
      dismissible = coalesce((p_input ->> 'dismissible')::boolean, true),
      revision = revision + 1,
      updated_by = actor_id
  where id = target_id
  returning * into target;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, request_id, outcome, before_state, after_state)
  values (
    'announcement.updated', actor_id, 'announcement', target.id::text, p_request_id, 'success',
    previous, to_jsonb(target) - array['created_by', 'updated_by', 'published_by']
  );

  return jsonb_build_object('status', 'saved', 'id', target.id, 'revision', target.revision);
end;
$$;

create or replace function public.publish_announcement(
  p_announcement_id uuid,
  p_expected_revision integer,
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
  target public.announcements%rowtype;
  previous jsonb;
begin
  actor_id := private.assert_admin_permission('announcements.publish');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into target from public.announcements where id = p_announcement_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'ANNOUNCEMENT_NOT_FOUND';
  end if;
  if target.lifecycle_status <> 'draft' or target.revision <> p_expected_revision then
    return jsonb_build_object('status', 'version_conflict');
  end if;

  previous := to_jsonb(target) - array['created_by', 'updated_by', 'published_by'];

  update public.announcements
  set lifecycle_status = 'published',
      starts_at = coalesce(starts_at, now()),
      published_by = actor_id,
      published_at = now(),
      revision = revision + 1,
      updated_by = actor_id
  where id = p_announcement_id
  returning * into target;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'announcement.published', actor_id, 'announcement', target.id::text, btrim(p_reason), p_request_id, 'success',
    previous, to_jsonb(target) - array['created_by', 'updated_by', 'published_by']
  );

  return jsonb_build_object(
    'status', 'published',
    'id', target.id,
    'revision', target.revision,
    'effectiveStatus', private.announcement_effective_status(target)
  );
end;
$$;

create or replace function public.cancel_announcement(
  p_announcement_id uuid,
  p_expected_revision integer,
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
  target public.announcements%rowtype;
  previous jsonb;
begin
  actor_id := private.assert_admin_permission('announcements.cancel');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into target from public.announcements where id = p_announcement_id for update;
  if not found then
    raise exception using errcode = '22023', message = 'ANNOUNCEMENT_NOT_FOUND';
  end if;
  if target.lifecycle_status <> 'published' or target.revision <> p_expected_revision then
    return jsonb_build_object('status', 'version_conflict');
  end if;

  previous := to_jsonb(target) - array['created_by', 'updated_by', 'published_by'];

  update public.announcements
  set lifecycle_status = 'cancelled',
      revision = revision + 1,
      updated_by = actor_id
  where id = p_announcement_id
  returning * into target;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'announcement.cancelled', actor_id, 'announcement', target.id::text, btrim(p_reason), p_request_id, 'success',
    previous, to_jsonb(target) - array['created_by', 'updated_by', 'published_by']
  );

  return jsonb_build_object('status', 'cancelled', 'id', target.id);
end;
$$;

create or replace function public.save_maintenance_draft(
  p_input jsonb,
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  draft public.maintenance_versions%rowtype;
  previous jsonb := '{}'::jsonb;
  next_version integer;
begin
  actor_id := private.assert_admin_permission('maintenance.manage');

  select * into draft from public.maintenance_versions where lifecycle_status = 'draft' for update;

  if found then
    previous := to_jsonb(draft) - array['created_by', 'updated_by', 'published_by'];
    update public.maintenance_versions
    set enabled = coalesce((p_input ->> 'enabled')::boolean, false),
        title = p_input ->> 'title',
        short_message = p_input ->> 'shortMessage',
        detail_message = nullif(p_input ->> 'detailMessage', ''),
        starts_at = nullif(p_input ->> 'startsAt', '')::timestamptz,
        expected_end_at = nullif(p_input ->> 'expectedEndAt', '')::timestamptz,
        updated_by = actor_id
    where id = draft.id
    returning * into draft;
  else
    select coalesce(max(version_number), 0) + 1 into next_version from public.maintenance_versions;
    insert into public.maintenance_versions
      (version_number, enabled, title, short_message, detail_message, starts_at, expected_end_at, created_by, updated_by)
    values (
      next_version,
      coalesce((p_input ->> 'enabled')::boolean, false),
      p_input ->> 'title',
      p_input ->> 'shortMessage',
      nullif(p_input ->> 'detailMessage', ''),
      nullif(p_input ->> 'startsAt', '')::timestamptz,
      nullif(p_input ->> 'expectedEndAt', '')::timestamptz,
      actor_id,
      actor_id
    )
    returning * into draft;
  end if;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, request_id, outcome, before_state, after_state)
  values (
    'maintenance.draft_saved', actor_id, 'maintenance', draft.id::text, p_request_id, 'success',
    previous, to_jsonb(draft) - array['created_by', 'updated_by', 'published_by']
  );

  return jsonb_build_object('status', 'saved', 'id', draft.id, 'versionNumber', draft.version_number);
end;
$$;

create or replace function public.publish_maintenance(
  p_version_id uuid,
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
  draft public.maintenance_versions%rowtype;
  previous public.maintenance_versions%rowtype;
begin
  actor_id := private.assert_admin_permission('maintenance.publish');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into draft from public.maintenance_versions
  where id = p_version_id and lifecycle_status = 'draft'
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'MAINTENANCE_DRAFT_NOT_FOUND';
  end if;

  select * into previous from public.maintenance_versions
  where lifecycle_status = 'published'
  for update;

  if found then
    update public.maintenance_versions
    set lifecycle_status = 'superseded'
    where id = previous.id;
  end if;

  update public.maintenance_versions
  set lifecycle_status = 'published',
      published_by = actor_id,
      published_at = now()
  where id = draft.id
  returning * into draft;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'maintenance.published', actor_id, 'maintenance', draft.id::text, btrim(p_reason), p_request_id, 'success',
    case when previous.id is null then '{}'::jsonb
      else to_jsonb(previous) - array['created_by', 'updated_by', 'published_by'] end,
    to_jsonb(draft) - array['created_by', 'updated_by', 'published_by']
  );

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, metadata)
  values (
    case when draft.enabled then 'maintenance.enabled' else 'maintenance.disabled' end,
    actor_id, 'maintenance', draft.id::text, btrim(p_reason), p_request_id, 'success',
    jsonb_build_object('versionNumber', draft.version_number)
  );

  return jsonb_build_object(
    'status', 'published',
    'id', draft.id,
    'versionNumber', draft.version_number,
    'enabled', draft.enabled
  );
end;
$$;

create or replace function public.save_feature_availability_draft(
  p_overrides jsonb,
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
  draft public.feature_availability_versions%rowtype;
  previous jsonb := '{}'::jsonb;
  next_version integer;
begin
  actor_id := private.assert_admin_permission('features.update');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;
  if not private.valid_feature_overrides(p_overrides) then
    raise exception using errcode = '22023', message = 'INVALID_FEATURE_OVERRIDES';
  end if;

  select * into draft from public.feature_availability_versions
  where lifecycle_status = 'draft' for update;

  if found then
    previous := draft.overrides;
    update public.feature_availability_versions
    set overrides = p_overrides,
        updated_by = actor_id
    where id = draft.id
    returning * into draft;
  else
    select coalesce(max(version_number), 0) + 1 into next_version
    from public.feature_availability_versions;
    insert into public.feature_availability_versions
      (version_number, overrides, created_by, updated_by)
    values (next_version, p_overrides, actor_id, actor_id)
    returning * into draft;
  end if;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'features.draft_saved', actor_id, 'feature_availability', draft.id::text, btrim(p_reason), p_request_id, 'success',
    jsonb_build_object('overrides', previous),
    jsonb_build_object('overrides', draft.overrides)
  );

  return jsonb_build_object('status', 'saved', 'id', draft.id, 'versionNumber', draft.version_number);
end;
$$;

create or replace function public.publish_feature_availability(
  p_version_id uuid,
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
  draft public.feature_availability_versions%rowtype;
  previous public.feature_availability_versions%rowtype;
begin
  actor_id := private.assert_admin_permission('features.publish');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into draft from public.feature_availability_versions
  where id = p_version_id and lifecycle_status = 'draft'
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'FEATURE_DRAFT_NOT_FOUND';
  end if;

  select * into previous from public.feature_availability_versions
  where lifecycle_status = 'published'
  for update;

  if found then
    update public.feature_availability_versions
    set lifecycle_status = 'superseded'
    where id = previous.id;
  end if;

  update public.feature_availability_versions
  set lifecycle_status = 'published',
      published_by = actor_id,
      published_at = now()
  where id = draft.id
  returning * into draft;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'features.published', actor_id, 'feature_availability', draft.id::text, btrim(p_reason), p_request_id, 'success',
    jsonb_build_object('overrides', case when previous.id is null then '{}'::jsonb else previous.overrides end),
    jsonb_build_object('overrides', draft.overrides)
  );

  return jsonb_build_object('status', 'published', 'id', draft.id, 'versionNumber', draft.version_number);
end;
$$;

create or replace function public.save_game_settings_draft(
  p_settings jsonb,
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
  draft public.game_settings_versions%rowtype;
  previous jsonb := '{}'::jsonb;
  next_version integer;
begin
  actor_id := private.assert_admin_permission('settings.update');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;
  if not private.valid_game_settings(p_settings) then
    raise exception using errcode = '22023', message = 'INVALID_GAME_SETTINGS';
  end if;

  select * into draft from public.game_settings_versions
  where lifecycle_status = 'draft' for update;

  if found then
    previous := draft.settings;
    update public.game_settings_versions
    set settings = p_settings,
        updated_by = actor_id
    where id = draft.id
    returning * into draft;
  else
    select coalesce(max(version_number), 0) + 1 into next_version
    from public.game_settings_versions;
    insert into public.game_settings_versions
      (version_number, settings, created_by, updated_by)
    values (next_version, p_settings, actor_id, actor_id)
    returning * into draft;
  end if;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'settings.updated', actor_id, 'game_settings', draft.id::text, btrim(p_reason), p_request_id, 'success',
    jsonb_build_object('settings', previous),
    jsonb_build_object('settings', draft.settings)
  );

  return jsonb_build_object('status', 'saved', 'id', draft.id, 'versionNumber', draft.version_number);
end;
$$;

create or replace function public.publish_game_settings(
  p_version_id uuid,
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
  draft public.game_settings_versions%rowtype;
  previous public.game_settings_versions%rowtype;
begin
  actor_id := private.assert_admin_permission('settings.publish');

  if p_reason is null or char_length(btrim(p_reason)) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'INVALID_REASON';
  end if;

  select * into draft from public.game_settings_versions
  where id = p_version_id and lifecycle_status = 'draft'
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'SETTINGS_DRAFT_NOT_FOUND';
  end if;

  select * into previous from public.game_settings_versions
  where lifecycle_status = 'published'
  for update;

  if found then
    update public.game_settings_versions
    set lifecycle_status = 'superseded'
    where id = previous.id;
  end if;

  update public.game_settings_versions
  set lifecycle_status = 'published',
      published_by = actor_id,
      published_at = now()
  where id = draft.id
  returning * into draft;

  insert into public.admin_audit_log
    (event_key, actor_user_id, target_type, target_id, reason, request_id, outcome, before_state, after_state)
  values (
    'settings.published', actor_id, 'game_settings', draft.id::text, btrim(p_reason), p_request_id, 'success',
    jsonb_build_object('settings', case when previous.id is null then '{}'::jsonb else previous.settings end),
    jsonb_build_object('settings', draft.settings)
  );

  return jsonb_build_object('status', 'published', 'id', draft.id, 'versionNumber', draft.version_number);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.announcements enable row level security;
alter table public.announcements force row level security;
alter table public.maintenance_versions enable row level security;
alter table public.maintenance_versions force row level security;
alter table public.feature_keys enable row level security;
alter table public.feature_keys force row level security;
alter table public.feature_availability_versions enable row level security;
alter table public.feature_availability_versions force row level security;
alter table public.game_settings_versions enable row level security;
alter table public.game_settings_versions force row level security;

revoke all on table public.announcements from public, anon, authenticated, service_role;
revoke all on table public.maintenance_versions from public, anon, authenticated, service_role;
revoke all on table public.feature_keys from public, anon, authenticated, service_role;
revoke all on table public.feature_availability_versions from public, anon, authenticated, service_role;
revoke all on table public.game_settings_versions from public, anon, authenticated, service_role;

grant select on table public.announcements to authenticated;
grant select on table public.maintenance_versions to authenticated;
grant select on table public.feature_keys to authenticated;
grant select on table public.feature_availability_versions to authenticated;
grant select on table public.game_settings_versions to authenticated;

create policy announcements_permission_read
on public.announcements for select to authenticated
using (private.has_admin_permission('announcements.view'));

create policy maintenance_versions_permission_read
on public.maintenance_versions for select to authenticated
using (private.has_admin_permission('maintenance.view'));

create policy feature_keys_permission_read
on public.feature_keys for select to authenticated
using (private.has_admin_permission('features.view'));

create policy feature_availability_versions_permission_read
on public.feature_availability_versions for select to authenticated
using (private.has_admin_permission('features.view'));

create policy game_settings_versions_permission_read
on public.game_settings_versions for select to authenticated
using (private.has_admin_permission('settings.view'));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function private.valid_feature_overrides(jsonb) from public, anon, authenticated, service_role;
revoke all on function private.valid_game_settings(jsonb) from public, anon, authenticated, service_role;
revoke all on function private.protect_version_history() from public, anon, authenticated, service_role;
revoke all on function private.protect_announcement_row() from public, anon, authenticated, service_role;
revoke all on function private.announcement_effective_status(public.announcements) from public, anon, authenticated, service_role;

revoke all on function public.get_public_announcements() from public, anon, authenticated, service_role;
revoke all on function public.get_public_maintenance() from public, anon, authenticated, service_role;
revoke all on function public.get_public_feature_availability() from public, anon, authenticated, service_role;
revoke all on function public.get_public_game_settings() from public, anon, authenticated, service_role;
grant execute on function public.get_public_announcements() to anon, authenticated, service_role;
grant execute on function public.get_public_maintenance() to anon, authenticated, service_role;
grant execute on function public.get_public_feature_availability() to anon, authenticated, service_role;
grant execute on function public.get_public_game_settings() to anon, authenticated, service_role;

revoke all on function public.save_announcement(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function public.publish_announcement(uuid, integer, text, text) from public, anon, authenticated, service_role;
revoke all on function public.cancel_announcement(uuid, integer, text, text) from public, anon, authenticated, service_role;
revoke all on function public.save_maintenance_draft(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function public.publish_maintenance(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.save_feature_availability_draft(jsonb, text, text) from public, anon, authenticated, service_role;
revoke all on function public.publish_feature_availability(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.save_game_settings_draft(jsonb, text, text) from public, anon, authenticated, service_role;
revoke all on function public.publish_game_settings(uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.save_announcement(jsonb, text) to authenticated;
grant execute on function public.publish_announcement(uuid, integer, text, text) to authenticated;
grant execute on function public.cancel_announcement(uuid, integer, text, text) to authenticated;
grant execute on function public.save_maintenance_draft(jsonb, text) to authenticated;
grant execute on function public.publish_maintenance(uuid, text, text) to authenticated;
grant execute on function public.save_feature_availability_draft(jsonb, text, text) to authenticated;
grant execute on function public.publish_feature_availability(uuid, text, text) to authenticated;
grant execute on function public.save_game_settings_draft(jsonb, text, text) to authenticated;
grant execute on function public.publish_game_settings(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Feature key registry seed (mirrors src/content/game/availability.ts)
-- ---------------------------------------------------------------------------

insert into public.feature_keys (key, name)
values
  ('guides', 'Player guides and documentation'),
  ('how-to-play', 'How to Play experience'),
  ('docs-search', 'Documentation search'),
  ('wallet-connect', 'Wallet connection'),
  ('access-check', '$FABLE access requirement check'),
  ('game-world', 'Playable game world'),
  ('farming', 'Farming'),
  ('animal-care', 'Animal care and ranching'),
  ('animal-progression', 'Animal levels and materials'),
  ('fishing', 'Fishing'),
  ('mining', 'Mining'),
  ('woodcutting', 'Woodcutting'),
  ('cooking', 'Cooking'),
  ('crafting', 'Crafting'),
  ('housing', 'Housing and decoration'),
  ('exploration', 'Exploration'),
  ('social', 'Social multiplayer'),
  ('farm-visits', 'Personal farm visits'),
  ('community-care', 'Community Care'),
  ('inventory', 'Inventory'),
  ('copper', 'COPPER economy'),
  ('copper-exchange', 'Copper Exchange'),
  ('npc-selling', 'NPC selling'),
  ('auction-house', 'Auction House'),
  ('player-trading', 'Player trading'),
  ('cat-companion', 'Permanent cat companion'),
  ('cat-dice', 'Cat Dice'),
  ('cat-battle', 'Cat Battle'),
  ('equipment', 'Cat Battle equipment'),
  ('matchmaking', 'Cat Battle matchmaking'),
  ('wagers', 'Optional Cat Battle wagers'),
  ('tournaments-community', 'Community Tournaments'),
  ('tournaments-official', 'Official Sponsored Tournaments')
on conflict (key) do update set name = excluded.name;
