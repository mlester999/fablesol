-- Fablesol Phase 2B: player identity foundation.
-- Player profiles, wallet links, signature challenges, verification events,
-- and the append-only player security event history.
-- This migration intentionally creates no gameplay or economy data.

-- ---------------------------------------------------------------------------
-- Player profiles
-- ---------------------------------------------------------------------------

create table public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  display_label text not null check (
    char_length(display_label) between 3 and 32
    and display_label ~ '^[A-Za-z0-9][A-Za-z0-9 ._-]*[A-Za-z0-9]$'
  ),
  status text not null default 'active' check (status in ('active', 'suspended')),
  onboarding_state text not null default 'profile_created' check (
    onboarding_state in ('profile_created', 'wallet_verified', 'access_checked')
  ),
  access_state text not null default 'unverified' check (
    access_state in ('unverified', 'eligible', 'ineligible', 'stale')
  ),
  last_successful_sign_in_at timestamptz,
  last_wallet_verification_at timestamptz,
  last_access_verification_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text check (
    suspension_reason is null or char_length(suspension_reason) between 1 and 500
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_profiles_suspension_state_check check (
    (status = 'suspended') = (suspended_at is not null)
    and (suspended_at is not null or suspension_reason is null)
  )
);

comment on table public.player_profiles is
  'Fablesol player profiles keyed to auth.users. No gameplay stats, balances, or achievements exist in Phase 2B.';

create index player_profiles_status_idx on public.player_profiles(status, created_at desc);
create index player_profiles_access_state_idx on public.player_profiles(access_state);

-- ---------------------------------------------------------------------------
-- Wallet links (one active wallet per profile; one active profile per wallet)
-- ---------------------------------------------------------------------------

create table public.player_wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.player_profiles(id) on delete restrict,
  wallet_address text not null check (
    char_length(wallet_address) between 32 and 44
    and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
  ),
  network text not null check (network in ('solana:mainnet-beta', 'solana:devnet')),
  status text not null default 'active' check (status in ('active', 'replaced', 'removed')),
  first_verified_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  replaced_at timestamptz,
  replacement_reason text check (
    replacement_reason is null or char_length(replacement_reason) between 1 and 200
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_wallets_replaced_state_check check (
    (status = 'active') = (replaced_at is null)
    and (replaced_at is not null or replacement_reason is null)
  )
);

comment on table public.player_wallets is
  'Wallet ownership links proven by signature. Seed phrases, private keys, and raw signatures are never stored.';

create unique index player_wallets_one_active_per_profile_idx
  on public.player_wallets(profile_id)
  where status = 'active';
create unique index player_wallets_one_active_per_address_idx
  on public.player_wallets(wallet_address)
  where status = 'active';
create index player_wallets_profile_idx on public.player_wallets(profile_id, created_at desc);
create index player_wallets_address_idx on public.player_wallets(wallet_address, created_at desc);

-- ---------------------------------------------------------------------------
-- Signature challenges (single-use, expiring; only hashes are stored)
-- ---------------------------------------------------------------------------

create table public.wallet_signature_challenges (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null check (
    char_length(wallet_address) between 32 and 44
    and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
  ),
  network text not null check (network in ('solana:mainnet-beta', 'solana:devnet')),
  domain text not null check (char_length(domain) between 1 and 100),
  uri text not null check (char_length(uri) between 1 and 200),
  purpose text not null check (purpose in ('sign_in', 'wallet_replacement')),
  requested_by_user_id uuid references auth.users(id) on delete set null,
  nonce_hash text not null check (nonce_hash ~ '^[0-9a-f]{64}$'),
  message_hash text not null check (message_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (
    status in ('pending', 'consumed', 'expired', 'rejected')
  ),
  verification_attempts integer not null default 0 check (verification_attempts between 0 and 10),
  client_key_hash text check (client_key_hash is null or client_key_hash ~ '^[0-9a-f]{64}$'),
  correlation_id text check (correlation_id is null or char_length(correlation_id) between 1 and 128),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  rejected_reason text check (
    rejected_reason is null or char_length(rejected_reason) between 1 and 100
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_signature_challenges_expiration_check check (expires_at > issued_at),
  constraint wallet_signature_challenges_consumed_state_check check (
    (status = 'consumed') = (consumed_at is not null)
  ),
  constraint wallet_signature_challenges_replacement_binding_check check (
    (purpose = 'wallet_replacement') = (requested_by_user_id is not null)
  )
);

comment on table public.wallet_signature_challenges is
  'Single-use signature challenges. The plaintext nonce and the signed message are never stored; only SHA-256 hashes.';

create index wallet_signature_challenges_wallet_idx
  on public.wallet_signature_challenges(wallet_address, created_at desc);
create index wallet_signature_challenges_client_key_idx
  on public.wallet_signature_challenges(client_key_hash, created_at desc)
  where client_key_hash is not null;
create index wallet_signature_challenges_status_idx
  on public.wallet_signature_challenges(status, expires_at);

-- ---------------------------------------------------------------------------
-- Wallet verification events (append-only challenge lifecycle facts)
-- ---------------------------------------------------------------------------

create table public.wallet_verification_events (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.wallet_signature_challenges(id) on delete set null,
  profile_id uuid references public.player_profiles(id) on delete set null,
  wallet_address text not null check (
    char_length(wallet_address) between 32 and 44
    and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
  ),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  result text not null check (result in ('success', 'denied', 'error')),
  reason_code text check (reason_code is null or reason_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  correlation_id text check (correlation_id is null or char_length(correlation_id) between 1 and 128),
  created_at timestamptz not null default now()
);

comment on table public.wallet_verification_events is
  'Append-only wallet verification history. Raw signatures, nonces, and session tokens are forbidden here.';

create index wallet_verification_events_wallet_idx
  on public.wallet_verification_events(wallet_address, created_at desc);
create index wallet_verification_events_profile_idx
  on public.wallet_verification_events(profile_id, created_at desc)
  where profile_id is not null;
create index wallet_verification_events_event_idx
  on public.wallet_verification_events(event_key, created_at desc);

-- ---------------------------------------------------------------------------
-- Player security events (append-only broad security history)
-- ---------------------------------------------------------------------------

create table public.player_security_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.player_profiles(id) on delete set null,
  user_id uuid,
  wallet_address text check (
    wallet_address is null
    or (
      char_length(wallet_address) between 32 and 44
      and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
    )
  ),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  result text not null check (result in ('success', 'denied', 'error')),
  reason_code text check (reason_code is null or reason_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  correlation_id text check (correlation_id is null or char_length(correlation_id) between 1 and 128),
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 2048
  ),
  created_at timestamptz not null default now()
);

comment on table public.player_security_events is
  'Append-only player security history. Secrets, signatures, session tokens, and request payloads are forbidden.';

create index player_security_events_profile_idx
  on public.player_security_events(profile_id, created_at desc)
  where profile_id is not null;
create index player_security_events_event_idx
  on public.player_security_events(event_key, created_at desc);
create index player_security_events_created_idx
  on public.player_security_events(created_at desc);

-- ---------------------------------------------------------------------------
-- Protection triggers
-- ---------------------------------------------------------------------------

create or replace function private.protect_append_only_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'This security history is append-only and cannot be modified or deleted.';
end;
$$;

create or replace function private.protect_challenge_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Signature challenges cannot be deleted.';
  end if;

  -- A challenge that has left the pending state is frozen forever. A consumed
  -- challenge can never be reset to unused.
  if old.status <> 'pending' then
    raise exception 'A finalized signature challenge cannot be modified.';
  end if;

  -- Pending rows may only transition state or count attempts. The bound
  -- wallet, network, domain, uri, purpose, hashes, and timing are immutable.
  if new.wallet_address is distinct from old.wallet_address
    or new.network is distinct from old.network
    or new.domain is distinct from old.domain
    or new.uri is distinct from old.uri
    or new.purpose is distinct from old.purpose
    or new.requested_by_user_id is distinct from old.requested_by_user_id
    or new.nonce_hash is distinct from old.nonce_hash
    or new.message_hash is distinct from old.message_hash
    or new.issued_at is distinct from old.issued_at
    or new.expires_at is distinct from old.expires_at
    or new.client_key_hash is distinct from old.client_key_hash
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Signature challenge bindings are immutable.';
  end if;

  return new;
end;
$$;

create trigger player_profiles_updated_at
  before update on public.player_profiles
  for each row execute function private.set_updated_at();

create trigger player_wallets_updated_at
  before update on public.player_wallets
  for each row execute function private.set_updated_at();

create trigger wallet_signature_challenges_updated_at
  before update on public.wallet_signature_challenges
  for each row execute function private.set_updated_at();

create trigger wallet_signature_challenges_protect
  before update or delete on public.wallet_signature_challenges
  for each row execute function private.protect_challenge_row();

create trigger wallet_verification_events_protect
  before update or delete on public.wallet_verification_events
  for each row execute function private.protect_append_only_row();

create trigger player_security_events_protect
  before update or delete on public.player_security_events
  for each row execute function private.protect_append_only_row();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.player_profiles enable row level security;
alter table public.player_wallets enable row level security;
alter table public.wallet_signature_challenges enable row level security;
alter table public.wallet_verification_events enable row level security;
alter table public.player_security_events enable row level security;

-- Players may read only their own profile and wallet-link state. All writes
-- and every other read path go through security-definer functions.
create policy player_profiles_self_select on public.player_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy player_wallets_self_select on public.player_wallets
  for select to authenticated
  using (
    exists (
      select 1
      from public.player_profiles as profile
      where profile.id = player_wallets.profile_id
        and profile.user_id = (select auth.uid())
    )
  );

-- Challenges, verification events, and security events are intentionally not
-- readable by any client role; no policies exist for them.

-- ---------------------------------------------------------------------------
-- Grants (default deny; the service role also goes through functions)
-- ---------------------------------------------------------------------------

revoke all on table public.player_profiles from public, anon, authenticated, service_role;
revoke all on table public.player_wallets from public, anon, authenticated, service_role;
revoke all on table public.wallet_signature_challenges from public, anon, authenticated, service_role;
revoke all on table public.wallet_verification_events from public, anon, authenticated, service_role;
revoke all on table public.player_security_events from public, anon, authenticated, service_role;

grant select on table public.player_profiles to authenticated;
grant select on table public.player_wallets to authenticated;

revoke all on function private.protect_append_only_row() from public, anon, authenticated, service_role;
revoke all on function private.protect_challenge_row() from public, anon, authenticated, service_role;
