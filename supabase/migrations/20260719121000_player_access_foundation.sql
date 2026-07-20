-- Fablesol Phase 2B: server-authoritative $FABLE access foundation.
-- Immutable access evaluations and short-lived access sessions.
-- Balances are stored in integer base units; no floating point decides access.

-- ---------------------------------------------------------------------------
-- Access evaluations (immutable evidence of every access decision)
-- ---------------------------------------------------------------------------

create table public.player_access_evaluations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.player_profiles(id) on delete restrict,
  wallet_id uuid references public.player_wallets(id) on delete set null,
  wallet_address text check (
    wallet_address is null
    or (
      char_length(wallet_address) between 32 and 44
      and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
    )
  ),
  network text not null check (network in ('solana:mainnet-beta', 'solana:devnet')),
  token_mint text check (
    token_mint is null
    or (
      char_length(token_mint) between 32 and 44
      and token_mint ~ '^[1-9A-HJ-NP-Za-km-z]+$'
    )
  ),
  token_decimals integer check (token_decimals is null or token_decimals between 0 and 18),
  required_base_units numeric(20, 0) check (
    required_base_units is null or required_base_units > 0
  ),
  observed_base_units numeric(20, 0) check (
    observed_base_units is null or observed_base_units >= 0
  ),
  observed_display text check (
    observed_display is null or observed_display ~ '^[0-9]+(\.[0-9]+)?$'
  ),
  token_account_count integer check (
    token_account_count is null or token_account_count between 0 and 10000
  ),
  result text not null check (
    result in (
      'eligible',
      'wallet_not_linked',
      'wallet_not_verified',
      'wrong_network',
      'token_configuration_missing',
      'rpc_unavailable',
      'balance_below_requirement',
      'profile_suspended',
      'session_expired',
      'reverification_required'
    )
  ),
  rpc_slot bigint check (rpc_slot is null or rpc_slot >= 0),
  correlation_id text check (correlation_id is null or char_length(correlation_id) between 1 and 128),
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint player_access_evaluations_eligible_evidence_check check (
    result <> 'eligible'
    or (
      wallet_address is not null
      and token_mint is not null
      and token_decimals is not null
      and required_base_units is not null
      and observed_base_units is not null
      and observed_base_units >= required_base_units
    )
  )
);

comment on table public.player_access_evaluations is
  'Immutable server-side $FABLE access decisions. Eligibility always carries integer base-unit evidence.';

create index player_access_evaluations_profile_idx
  on public.player_access_evaluations(profile_id, created_at desc);
create index player_access_evaluations_result_idx
  on public.player_access_evaluations(result, created_at desc);

-- ---------------------------------------------------------------------------
-- Access sessions (short-lived, server-created, never client-extended)
-- ---------------------------------------------------------------------------

create table public.player_access_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.player_profiles(id) on delete restrict,
  wallet_id uuid not null references public.player_wallets(id) on delete restrict,
  evaluation_id uuid not null references public.player_access_evaluations(id) on delete restrict,
  wallet_address text not null check (
    char_length(wallet_address) between 32 and 44
    and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]+$'
  ),
  network text not null check (network in ('solana:mainnet-beta', 'solana:devnet')),
  token_mint text not null check (
    char_length(token_mint) between 32 and 44
    and token_mint ~ '^[1-9A-HJ-NP-Za-km-z]+$'
  ),
  required_base_units numeric(20, 0) not null check (required_base_units > 0),
  observed_base_units numeric(20, 0) not null check (observed_base_units >= 0),
  expires_at timestamptz not null,
  invalidated_at timestamptz,
  invalidation_reason text check (
    invalidation_reason in (
      'superseded',
      'wallet_replaced',
      'network_changed',
      'profile_suspended',
      'configuration_changed',
      'logout',
      'administrative'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_access_sessions_expiration_check check (expires_at > created_at),
  constraint player_access_sessions_grant_check check (
    observed_base_units >= required_base_units
  ),
  constraint player_access_sessions_invalidation_state_check check (
    (invalidated_at is null) = (invalidation_reason is null)
  )
);

comment on table public.player_access_sessions is
  'Short-lived protected-access sessions bound to a verified wallet, network, mint, threshold, and balance evaluation.';

create index player_access_sessions_profile_idx
  on public.player_access_sessions(profile_id, created_at desc);
create index player_access_sessions_active_idx
  on public.player_access_sessions(profile_id, expires_at)
  where invalidated_at is null;

-- ---------------------------------------------------------------------------
-- Protection triggers
-- ---------------------------------------------------------------------------

create or replace function private.protect_access_session_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Access sessions cannot be deleted; they expire or are invalidated.';
  end if;

  -- The only permitted mutation is a one-way invalidation. Every binding,
  -- the recorded balance, and the expiration are immutable, so an access
  -- session can never be extended or repointed after creation.
  if new.profile_id is distinct from old.profile_id
    or new.wallet_id is distinct from old.wallet_id
    or new.evaluation_id is distinct from old.evaluation_id
    or new.wallet_address is distinct from old.wallet_address
    or new.network is distinct from old.network
    or new.token_mint is distinct from old.token_mint
    or new.required_base_units is distinct from old.required_base_units
    or new.observed_base_units is distinct from old.observed_base_units
    or new.expires_at is distinct from old.expires_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Access session bindings are immutable.';
  end if;

  if old.invalidated_at is not null
    and (
      new.invalidated_at is distinct from old.invalidated_at
      or new.invalidation_reason is distinct from old.invalidation_reason
    )
  then
    raise exception 'An invalidated access session cannot be reactivated or reclassified.';
  end if;

  return new;
end;
$$;

create trigger player_access_evaluations_protect
  before update or delete on public.player_access_evaluations
  for each row execute function private.protect_append_only_row();

create trigger player_access_sessions_updated_at
  before update on public.player_access_sessions
  for each row execute function private.set_updated_at();

create trigger player_access_sessions_protect
  before update or delete on public.player_access_sessions
  for each row execute function private.protect_access_session_row();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.player_access_evaluations enable row level security;
alter table public.player_access_sessions enable row level security;

create policy player_access_evaluations_self_select on public.player_access_evaluations
  for select to authenticated
  using (
    exists (
      select 1
      from public.player_profiles as profile
      where profile.id = player_access_evaluations.profile_id
        and profile.user_id = (select auth.uid())
    )
  );

create policy player_access_sessions_self_select on public.player_access_sessions
  for select to authenticated
  using (
    exists (
      select 1
      from public.player_profiles as profile
      where profile.id = player_access_sessions.profile_id
        and profile.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (default deny; writes only through security-definer functions)
-- ---------------------------------------------------------------------------

revoke all on table public.player_access_evaluations from public, anon, authenticated, service_role;
revoke all on table public.player_access_sessions from public, anon, authenticated, service_role;

grant select on table public.player_access_evaluations to authenticated;
grant select on table public.player_access_sessions to authenticated;

revoke all on function private.protect_access_session_row() from public, anon, authenticated, service_role;
