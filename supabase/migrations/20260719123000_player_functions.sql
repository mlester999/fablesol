-- Fablesol Phase 2B: player identity and access functions.
-- Every write path is a narrow security-definer function with a fixed search
-- path, explicit argument validation, and minimal grants. Server-only
-- functions are granted to service_role; self and admin views to authenticated.

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.valid_wallet_address(p_address text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_address is not null
    and char_length(p_address) between 32 and 44
    and p_address ~ '^[1-9A-HJ-NP-Za-km-z]+$';
$$;

create or replace function private.valid_network(p_network text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_network in ('solana:mainnet-beta', 'solana:devnet');
$$;

create or replace function private.mask_wallet(p_address text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_address is null then null
    else left(p_address, 4) || '…' || right(p_address, 4)
  end;
$$;

create or replace function private.record_wallet_event(
  p_challenge_id uuid,
  p_profile_id uuid,
  p_wallet_address text,
  p_event_key text,
  p_result text,
  p_reason_code text,
  p_correlation_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wallet_verification_events
    (challenge_id, profile_id, wallet_address, event_key, result, reason_code, correlation_id)
  values
    (p_challenge_id, p_profile_id, p_wallet_address, p_event_key, p_result, p_reason_code, p_correlation_id);
end;
$$;

create or replace function private.record_security_event(
  p_profile_id uuid,
  p_user_id uuid,
  p_wallet_address text,
  p_event_key text,
  p_result text,
  p_reason_code text,
  p_correlation_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.player_security_events
    (profile_id, user_id, wallet_address, event_key, result, reason_code, correlation_id, metadata)
  values
    (p_profile_id, p_user_id, p_wallet_address, p_event_key, p_result, p_reason_code, p_correlation_id,
     coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function private.profile_for_user(p_user_id uuid)
returns public.player_profiles
language sql
stable
security definer
set search_path = ''
as $$
  select profile
  from public.player_profiles as profile
  where profile.user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Challenge issuance (service role; server-authoritative rate limits)
-- ---------------------------------------------------------------------------

create or replace function public.player_issue_wallet_challenge(
  p_wallet_address text,
  p_network text,
  p_domain text,
  p_uri text,
  p_purpose text,
  p_requested_by_user_id uuid,
  p_nonce_hash text,
  p_message_hash text,
  p_ttl_seconds integer,
  p_client_key_hash text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  wallet_recent_count integer;
  client_recent_count integer;
  challenge_id uuid;
  issued timestamptz := now();
  expires timestamptz;
begin
  if not private.valid_wallet_address(p_wallet_address) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'wallet_address_invalid');
  end if;
  if not private.valid_network(p_network) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'network_invalid');
  end if;
  if p_purpose not in ('sign_in', 'wallet_replacement') then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'purpose_invalid');
  end if;
  if p_purpose = 'wallet_replacement' and p_requested_by_user_id is null then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'replacement_requires_user');
  end if;
  if p_purpose = 'sign_in' and p_requested_by_user_id is not null then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'sign_in_forbids_user');
  end if;
  if p_domain is null or char_length(p_domain) not between 1 and 100 then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'domain_invalid');
  end if;
  if p_uri is null or char_length(p_uri) not between 1 and 200 then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'uri_invalid');
  end if;
  if p_nonce_hash is null or p_nonce_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'nonce_hash_invalid');
  end if;
  if p_message_hash is null or p_message_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'message_hash_invalid');
  end if;
  if p_ttl_seconds is null or p_ttl_seconds not between 60 and 900 then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'ttl_invalid');
  end if;
  if p_client_key_hash is not null and p_client_key_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'client_key_invalid');
  end if;

  select count(*) into wallet_recent_count
  from public.wallet_signature_challenges
  where wallet_address = p_wallet_address
    and created_at > now() - interval '60 seconds';

  if wallet_recent_count >= 5 then
    perform private.record_wallet_event(
      null, null, p_wallet_address, 'wallet.challenge.rejected', 'denied', 'rate_limited', p_correlation_id
    );
    return jsonb_build_object('status', 'rate_limited', 'reasonCode', 'wallet_rate_limited');
  end if;

  if p_client_key_hash is not null then
    select count(*) into client_recent_count
    from public.wallet_signature_challenges
    where client_key_hash = p_client_key_hash
      and created_at > now() - interval '10 minutes';

    if client_recent_count >= 30 then
      perform private.record_wallet_event(
        null, null, p_wallet_address, 'wallet.challenge.rejected', 'denied', 'rate_limited', p_correlation_id
      );
      return jsonb_build_object('status', 'rate_limited', 'reasonCode', 'client_rate_limited');
    end if;
  end if;

  expires := issued + make_interval(secs => p_ttl_seconds);

  insert into public.wallet_signature_challenges
    (wallet_address, network, domain, uri, purpose, requested_by_user_id,
     nonce_hash, message_hash, client_key_hash, correlation_id, issued_at, expires_at)
  values
    (p_wallet_address, p_network, p_domain, p_uri, p_purpose, p_requested_by_user_id,
     p_nonce_hash, p_message_hash, p_client_key_hash, p_correlation_id, issued, expires)
  returning id into challenge_id;

  perform private.record_wallet_event(
    challenge_id, null, p_wallet_address, 'wallet.challenge.created', 'success', null, p_correlation_id
  );

  if p_purpose = 'wallet_replacement' then
    perform private.record_security_event(
      (private.profile_for_user(p_requested_by_user_id)).id,
      p_requested_by_user_id,
      p_wallet_address,
      'wallet.replacement.initiated',
      'success',
      null,
      p_correlation_id
    );
  end if;

  return jsonb_build_object(
    'status', 'created',
    'challengeId', challenge_id,
    'issuedAt', issued,
    'expiresAt', expires
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Challenge verification bookkeeping (service role)
-- ---------------------------------------------------------------------------

create or replace function public.player_begin_challenge_verification(
  p_challenge_id uuid,
  p_wallet_address text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge public.wallet_signature_challenges;
begin
  if p_challenge_id is null or not private.valid_wallet_address(p_wallet_address) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'arguments_invalid');
  end if;

  select * into challenge
  from public.wallet_signature_challenges
  where id = p_challenge_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if challenge.wallet_address <> p_wallet_address then
    perform private.record_wallet_event(
      challenge.id, null, p_wallet_address, 'wallet.challenge.rejected', 'denied', 'wallet_mismatch', p_correlation_id
    );
    return jsonb_build_object('status', 'wallet_mismatch');
  end if;

  if challenge.status = 'consumed' then
    perform private.record_wallet_event(
      challenge.id, null, p_wallet_address, 'wallet.signature.replay_denied', 'denied', 'challenge_replayed', p_correlation_id
    );
    return jsonb_build_object('status', 'replayed');
  end if;

  if challenge.status in ('expired', 'rejected') then
    return jsonb_build_object('status', challenge.status);
  end if;

  if challenge.expires_at <= now() then
    update public.wallet_signature_challenges
    set status = 'expired'
    where id = challenge.id;
    perform private.record_wallet_event(
      challenge.id, null, p_wallet_address, 'wallet.challenge.expired', 'denied', 'challenge_expired', p_correlation_id
    );
    return jsonb_build_object('status', 'expired');
  end if;

  if challenge.verification_attempts >= 5 then
    update public.wallet_signature_challenges
    set status = 'rejected',
        rejected_reason = 'attempts_exceeded'
    where id = challenge.id;
    perform private.record_wallet_event(
      challenge.id, null, p_wallet_address, 'wallet.challenge.rejected', 'denied', 'attempts_exceeded', p_correlation_id
    );
    return jsonb_build_object('status', 'rejected');
  end if;

  update public.wallet_signature_challenges
  set verification_attempts = challenge.verification_attempts + 1
  where id = challenge.id;

  return jsonb_build_object(
    'status', 'pending',
    'challengeId', challenge.id,
    'walletAddress', challenge.wallet_address,
    'network', challenge.network,
    'domain', challenge.domain,
    'uri', challenge.uri,
    'purpose', challenge.purpose,
    'requestedByUserId', challenge.requested_by_user_id,
    'nonceHash', challenge.nonce_hash,
    'messageHash', challenge.message_hash,
    'issuedAt', challenge.issued_at,
    'expiresAt', challenge.expires_at
  );
end;
$$;

create or replace function public.player_consume_challenge(
  p_challenge_id uuid,
  p_wallet_address text,
  p_message_hash text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed public.wallet_signature_challenges;
begin
  if p_challenge_id is null
    or not private.valid_wallet_address(p_wallet_address)
    or p_message_hash is null
    or p_message_hash !~ '^[0-9a-f]{64}$'
  then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'arguments_invalid');
  end if;

  update public.wallet_signature_challenges
  set status = 'consumed',
      consumed_at = now()
  where id = p_challenge_id
    and status = 'pending'
    and wallet_address = p_wallet_address
    and message_hash = p_message_hash
    and expires_at > now()
  returning * into consumed;

  if not found then
    perform private.record_wallet_event(
      p_challenge_id, null, p_wallet_address, 'wallet.signature.replay_denied', 'denied', 'consume_failed', p_correlation_id
    );
    return jsonb_build_object('status', 'not_consumable');
  end if;

  perform private.record_wallet_event(
    consumed.id, null, p_wallet_address, 'wallet.signature.verified', 'success', null, p_correlation_id
  );

  return jsonb_build_object(
    'status', 'consumed',
    'challengeId', consumed.id,
    'purpose', consumed.purpose,
    'network', consumed.network,
    'requestedByUserId', consumed.requested_by_user_id
  );
end;
$$;

create or replace function public.player_record_wallet_event(
  p_challenge_id uuid,
  p_wallet_address text,
  p_event_key text,
  p_result text,
  p_reason_code text,
  p_correlation_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.valid_wallet_address(p_wallet_address) then
    raise exception 'Invalid wallet address for wallet event.';
  end if;
  if p_event_key is null or p_event_key !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception 'Invalid wallet event key.';
  end if;
  if p_result not in ('success', 'denied', 'error') then
    raise exception 'Invalid wallet event result.';
  end if;

  perform private.record_wallet_event(
    p_challenge_id, null, p_wallet_address, p_event_key, p_result, p_reason_code, p_correlation_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Profile lookup and registration (service role)
-- ---------------------------------------------------------------------------

create or replace function public.player_find_by_wallet(p_wallet_address text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  wallet public.player_wallets;
  profile public.player_profiles;
begin
  if not private.valid_wallet_address(p_wallet_address) then
    return jsonb_build_object('found', false, 'reasonCode', 'wallet_address_invalid');
  end if;

  select * into wallet
  from public.player_wallets
  where wallet_address = p_wallet_address and status = 'active';

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select * into profile
  from public.player_profiles
  where id = wallet.profile_id;

  return jsonb_build_object(
    'found', true,
    'userId', profile.user_id,
    'profileId', profile.id,
    'profileStatus', profile.status,
    'displayLabel', profile.display_label,
    'walletId', wallet.id,
    'network', wallet.network
  );
end;
$$;

create or replace function public.player_register(
  p_user_id uuid,
  p_wallet_address text,
  p_network text,
  p_display_label text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_id uuid;
  wallet_id uuid;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'user_required');
  end if;
  if not private.valid_wallet_address(p_wallet_address) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'wallet_address_invalid');
  end if;
  if not private.valid_network(p_network) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'network_invalid');
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'auth_user_missing');
  end if;
  if exists (select 1 from public.player_profiles where user_id = p_user_id) then
    return jsonb_build_object('status', 'conflict', 'reasonCode', 'profile_exists');
  end if;

  begin
    insert into public.player_profiles
      (user_id, display_label, onboarding_state,
       last_successful_sign_in_at, last_wallet_verification_at)
    values
      (p_user_id, p_display_label, 'wallet_verified', now(), now())
    returning id into profile_id;

    insert into public.player_wallets (profile_id, wallet_address, network)
    values (profile_id, p_wallet_address, p_network)
    returning id into wallet_id;
  exception
    when unique_violation then
      perform private.record_security_event(
        null, p_user_id, p_wallet_address,
        'wallet.conflict.detected', 'denied', 'wallet_already_linked', p_correlation_id
      );
      return jsonb_build_object('status', 'conflict', 'reasonCode', 'wallet_already_linked');
  end;

  perform private.record_security_event(
    profile_id, p_user_id, p_wallet_address, 'player.profile.created', 'success', null, p_correlation_id
  );
  perform private.record_security_event(
    profile_id, p_user_id, p_wallet_address, 'wallet.linked', 'success', null, p_correlation_id
  );

  return jsonb_build_object('status', 'created', 'profileId', profile_id, 'walletId', wallet_id);
end;
$$;

create or replace function public.player_record_sign_in(
  p_user_id uuid,
  p_wallet_address text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.player_profiles;
begin
  profile := private.profile_for_user(p_user_id);

  if profile.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  update public.player_profiles
  set last_successful_sign_in_at = now(),
      last_wallet_verification_at = now()
  where id = profile.id;

  update public.player_wallets
  set last_verified_at = now()
  where profile_id = profile.id and status = 'active' and wallet_address = p_wallet_address;

  perform private.record_security_event(
    profile.id, p_user_id, p_wallet_address, 'player.sign_in', 'success', null, p_correlation_id
  );

  if profile.status = 'suspended' then
    perform private.record_security_event(
      profile.id, p_user_id, p_wallet_address,
      'player.restriction.encountered', 'denied', 'profile_suspended', p_correlation_id
    );
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'profileId', profile.id,
    'profileStatus', profile.status
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Wallet replacement (service role; server-side validation and audit)
-- ---------------------------------------------------------------------------

create or replace function public.player_replace_wallet(
  p_user_id uuid,
  p_new_wallet_address text,
  p_network text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.player_profiles;
  current_wallet public.player_wallets;
  new_wallet_id uuid;
  invalidated integer;
begin
  if not private.valid_wallet_address(p_new_wallet_address) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'wallet_address_invalid');
  end if;
  if not private.valid_network(p_network) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'network_invalid');
  end if;

  select * into profile
  from public.player_profiles
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if profile.status = 'suspended' then
    perform private.record_security_event(
      profile.id, p_user_id, p_new_wallet_address,
      'player.restriction.encountered', 'denied', 'profile_suspended', p_correlation_id
    );
    return jsonb_build_object('status', 'denied', 'reasonCode', 'profile_suspended');
  end if;

  select * into current_wallet
  from public.player_wallets
  where profile_id = profile.id and status = 'active'
  for update;

  if found and current_wallet.wallet_address = p_new_wallet_address then
    return jsonb_build_object('status', 'unchanged', 'reasonCode', 'same_wallet');
  end if;

  if exists (
    select 1
    from public.player_wallets
    where wallet_address = p_new_wallet_address
      and status = 'active'
      and profile_id <> profile.id
  ) then
    perform private.record_security_event(
      profile.id, p_user_id, p_new_wallet_address,
      'wallet.conflict.detected', 'denied', 'wallet_already_linked', p_correlation_id
    );
    return jsonb_build_object('status', 'conflict', 'reasonCode', 'wallet_already_linked');
  end if;

  -- The whole swap happens in one sub-block: a concurrent claim of the new
  -- wallet rolls back every step, so the previous wallet stays active.
  begin
    if current_wallet.id is not null then
      update public.player_wallets
      set status = 'replaced',
          replaced_at = now(),
          replacement_reason = 'replaced_by_player'
      where id = current_wallet.id;
    end if;

    insert into public.player_wallets (profile_id, wallet_address, network)
    values (profile.id, p_new_wallet_address, p_network)
    returning id into new_wallet_id;

    update public.player_access_sessions
    set invalidated_at = now(),
        invalidation_reason = 'wallet_replaced'
    where profile_id = profile.id
      and invalidated_at is null;
    get diagnostics invalidated = row_count;

    update public.player_profiles
    set access_state = 'unverified',
        last_wallet_verification_at = now()
    where id = profile.id;
  exception
    when unique_violation then
      perform private.record_security_event(
        profile.id, p_user_id, p_new_wallet_address,
        'wallet.conflict.detected', 'denied', 'wallet_already_linked', p_correlation_id
      );
      return jsonb_build_object('status', 'conflict', 'reasonCode', 'wallet_already_linked');
  end;

  perform private.record_security_event(
    profile.id, p_user_id, p_new_wallet_address,
    'wallet.replacement.completed', 'success', null, p_correlation_id,
    jsonb_build_object('invalidatedAccessSessions', invalidated)
  );

  if invalidated > 0 then
    perform private.record_security_event(
      profile.id, p_user_id, p_new_wallet_address,
      'access.session.invalidated', 'success', 'wallet_replaced', p_correlation_id
    );
  end if;

  return jsonb_build_object('status', 'replaced', 'walletId', new_wallet_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Access evaluation and access sessions (service role)
-- ---------------------------------------------------------------------------

create or replace function public.player_record_access_evaluation(
  p_user_id uuid,
  p_result text,
  p_wallet_id uuid,
  p_wallet_address text,
  p_network text,
  p_token_mint text,
  p_token_decimals integer,
  p_required_base_units numeric,
  p_observed_base_units numeric,
  p_observed_display text,
  p_token_account_count integer,
  p_rpc_slot bigint,
  p_session_ttl_seconds integer,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.player_profiles;
  evaluation_id uuid;
  session_id uuid;
  session_expires timestamptz;
begin
  if p_result not in (
    'eligible', 'wallet_not_linked', 'wallet_not_verified', 'wrong_network',
    'token_configuration_missing', 'rpc_unavailable', 'balance_below_requirement',
    'profile_suspended', 'session_expired', 'reverification_required'
  ) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'result_invalid');
  end if;
  if not private.valid_network(p_network) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'network_invalid');
  end if;
  if p_result = 'eligible'
    and (p_session_ttl_seconds is null or p_session_ttl_seconds not between 60 and 3600)
  then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'ttl_invalid');
  end if;
  -- An eligible decision must arrive with complete integer base-unit
  -- evidence; fail with a clear code instead of a raw constraint error.
  if p_result = 'eligible'
    and (
      p_wallet_id is null
      or not private.valid_wallet_address(p_wallet_address)
      or not private.valid_wallet_address(p_token_mint)
      or p_token_decimals is null
      or p_token_decimals not between 0 and 18
      or p_required_base_units is null
      or p_required_base_units <= 0
      or p_observed_base_units is null
      or p_observed_base_units < p_required_base_units
    )
  then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'eligible_evidence_missing');
  end if;

  select * into profile
  from public.player_profiles
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  insert into public.player_access_evaluations
    (profile_id, wallet_id, wallet_address, network, token_mint, token_decimals,
     required_base_units, observed_base_units, observed_display, token_account_count,
     result, rpc_slot, correlation_id)
  values
    (profile.id, p_wallet_id, p_wallet_address, p_network, p_token_mint, p_token_decimals,
     p_required_base_units, p_observed_base_units, p_observed_display, p_token_account_count,
     p_result, p_rpc_slot, p_correlation_id)
  returning id into evaluation_id;

  update public.player_profiles
  set last_access_verification_at = now(),
      access_state = case p_result
        when 'eligible' then 'eligible'
        when 'balance_below_requirement' then 'ineligible'
        when 'token_configuration_missing' then 'stale'
        when 'rpc_unavailable' then 'stale'
        else access_state
      end,
      onboarding_state = case
        when p_result in ('eligible', 'balance_below_requirement') then 'access_checked'
        else onboarding_state
      end
  where id = profile.id;

  if p_result = 'eligible' then
    update public.player_access_sessions
    set invalidated_at = now(),
        invalidation_reason = 'superseded'
    where profile_id = profile.id
      and invalidated_at is null;

    session_expires := now() + make_interval(secs => p_session_ttl_seconds);

    insert into public.player_access_sessions
      (profile_id, wallet_id, evaluation_id, wallet_address, network, token_mint,
       required_base_units, observed_base_units, expires_at)
    values
      (profile.id, p_wallet_id, evaluation_id, p_wallet_address, p_network, p_token_mint,
       p_required_base_units, p_observed_base_units, session_expires)
    returning id into session_id;

    perform private.record_security_event(
      profile.id, p_user_id, p_wallet_address,
      'access.evaluation.passed', 'success', null, p_correlation_id
    );
    perform private.record_security_event(
      profile.id, p_user_id, p_wallet_address,
      'access.session.created', 'success', null, p_correlation_id
    );
  else
    perform private.record_security_event(
      profile.id, p_user_id, p_wallet_address,
      'access.evaluation.failed', 'denied', p_result, p_correlation_id
    );
  end if;

  return jsonb_build_object(
    'status', 'recorded',
    'evaluationId', evaluation_id,
    'sessionId', session_id,
    'sessionExpiresAt', session_expires
  );
end;
$$;

create or replace function public.player_invalidate_access_sessions(
  p_user_id uuid,
  p_reason text,
  p_correlation_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.player_profiles;
  invalidated integer;
begin
  if p_reason not in (
    'superseded', 'wallet_replaced', 'network_changed', 'profile_suspended',
    'configuration_changed', 'logout', 'administrative'
  ) then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'reason_invalid');
  end if;

  profile := private.profile_for_user(p_user_id);

  if profile.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  update public.player_access_sessions
  set invalidated_at = now(),
      invalidation_reason = p_reason
  where profile_id = profile.id
    and invalidated_at is null;
  get diagnostics invalidated = row_count;

  if invalidated > 0 then
    perform private.record_security_event(
      profile.id, p_user_id, null,
      'access.session.invalidated', 'success', p_reason, p_correlation_id
    );
  end if;

  if p_reason = 'logout' then
    perform private.record_security_event(
      profile.id, p_user_id, null, 'player.logout', 'success', null, p_correlation_id
    );
  end if;

  return jsonb_build_object('status', 'ok', 'invalidated', invalidated);
end;
$$;

create or replace function public.player_record_security_event(
  p_user_id uuid,
  p_wallet_address text,
  p_event_key text,
  p_result text,
  p_reason_code text,
  p_correlation_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.player_profiles;
begin
  if p_event_key is null or p_event_key !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception 'Invalid security event key.';
  end if;
  if p_result not in ('success', 'denied', 'error') then
    raise exception 'Invalid security event result.';
  end if;
  if p_wallet_address is not null and not private.valid_wallet_address(p_wallet_address) then
    raise exception 'Invalid wallet address for security event.';
  end if;

  if p_user_id is not null then
    profile := private.profile_for_user(p_user_id);
  end if;

  perform private.record_security_event(
    profile.id, p_user_id, p_wallet_address, p_event_key, p_result, p_reason_code, p_correlation_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Player self view (authenticated)
-- ---------------------------------------------------------------------------

create or replace function public.get_player_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  profile public.player_profiles;
  wallet public.player_wallets;
  active_session public.player_access_sessions;
  latest_evaluation public.player_access_evaluations;
begin
  if caller is null then
    return jsonb_build_object('found', false);
  end if;

  select * into profile
  from public.player_profiles
  where user_id = caller;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select * into wallet
  from public.player_wallets
  where profile_id = profile.id and status = 'active';

  select * into active_session
  from public.player_access_sessions
  where profile_id = profile.id
    and invalidated_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  select * into latest_evaluation
  from public.player_access_evaluations
  where profile_id = profile.id
  order by created_at desc
  limit 1;

  return jsonb_build_object(
    'found', true,
    'profileId', profile.id,
    'displayLabel', profile.display_label,
    'status', profile.status,
    'onboardingState', profile.onboarding_state,
    'accessState', profile.access_state,
    'createdAt', profile.created_at,
    'lastSuccessfulSignInAt', profile.last_successful_sign_in_at,
    'lastWalletVerificationAt', profile.last_wallet_verification_at,
    'lastAccessVerificationAt', profile.last_access_verification_at,
    'wallet', case
      when wallet.id is null then null
      else jsonb_build_object(
        'walletId', wallet.id,
        'walletAddress', wallet.wallet_address,
        'network', wallet.network,
        'firstVerifiedAt', wallet.first_verified_at,
        'lastVerifiedAt', wallet.last_verified_at
      )
    end,
    'accessSession', case
      when active_session.id is null then null
      else jsonb_build_object(
        'sessionId', active_session.id,
        'expiresAt', active_session.expires_at,
        'requiredBaseUnits', active_session.required_base_units::text,
        'observedBaseUnits', active_session.observed_base_units::text,
        'tokenMint', active_session.token_mint,
        'network', active_session.network
      )
    end,
    'latestEvaluation', case
      when latest_evaluation.id is null then null
      else jsonb_build_object(
        'result', latest_evaluation.result,
        'observedDisplay', latest_evaluation.observed_display,
        'requiredBaseUnits', latest_evaluation.required_base_units::text,
        'observedBaseUnits', latest_evaluation.observed_base_units::text,
        'evaluatedAt', latest_evaluation.evaluated_at
      )
    end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin player views (authenticated + Phase 2A permissions)
-- ---------------------------------------------------------------------------

create or replace function public.get_player_directory()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_admin_permission('players.view');

  return coalesce(
    (
      select jsonb_agg(rows.entry order by rows.profile_created_at desc)
      from (
        select profile.created_at as profile_created_at,
          jsonb_build_object(
            'userId', profile.user_id,
            'profileId', profile.id,
            'displayLabel', profile.display_label,
            'status', profile.status,
            'onboardingState', profile.onboarding_state,
            'accessState', profile.access_state,
            'walletMasked', private.mask_wallet(wallet.wallet_address),
            'walletVerificationState', case when wallet.id is null then 'unlinked' else 'verified' end,
            'lastAccessVerificationAt', profile.last_access_verification_at,
            'lastSignInAt', profile.last_successful_sign_in_at,
            'createdAt', profile.created_at
          ) as entry
        from public.player_profiles as profile
        left join public.player_wallets as wallet
          on wallet.profile_id = profile.id and wallet.status = 'active'
      ) as rows
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.get_player_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  profile public.player_profiles;
  can_support boolean;
  can_access_history boolean;
  can_security_events boolean;
  wallet_history jsonb;
  evaluation_history jsonb;
  session_history jsonb;
  security_history jsonb;
begin
  perform private.assert_admin_permission('players.view');

  can_support := private.has_admin_permission('players.support_view');
  can_access_history := private.has_admin_permission('players.access_history.view');
  can_security_events := private.has_admin_permission('players.security_events.view');

  select * into profile
  from public.player_profiles
  where user_id = p_user_id;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'walletId', wallet.id,
    'wallet', case when can_support then wallet.wallet_address else private.mask_wallet(wallet.wallet_address) end,
    'network', wallet.network,
    'status', wallet.status,
    'firstVerifiedAt', wallet.first_verified_at,
    'lastVerifiedAt', wallet.last_verified_at,
    'replacedAt', wallet.replaced_at,
    'createdAt', wallet.created_at
  ) order by wallet.created_at desc), '[]'::jsonb)
  into wallet_history
  from public.player_wallets as wallet
  where wallet.profile_id = profile.id;

  if can_access_history then
    select coalesce(jsonb_agg(jsonb_build_object(
      'evaluationId', evaluation.id,
      'result', evaluation.result,
      'network', evaluation.network,
      'tokenMintMasked', private.mask_wallet(evaluation.token_mint),
      'requiredBaseUnits', evaluation.required_base_units::text,
      'observedBaseUnits', evaluation.observed_base_units::text,
      'observedDisplay', evaluation.observed_display,
      'tokenAccountCount', evaluation.token_account_count,
      'walletMasked', private.mask_wallet(evaluation.wallet_address),
      'correlationId', evaluation.correlation_id,
      'evaluatedAt', evaluation.evaluated_at
    ) order by evaluation.created_at desc), '[]'::jsonb)
    into evaluation_history
    from (
      select *
      from public.player_access_evaluations
      where profile_id = profile.id
      order by created_at desc
      limit 50
    ) as evaluation;

    select coalesce(jsonb_agg(jsonb_build_object(
      'sessionId', session.id,
      'walletMasked', private.mask_wallet(session.wallet_address),
      'network', session.network,
      'expiresAt', session.expires_at,
      'invalidatedAt', session.invalidated_at,
      'invalidationReason', session.invalidation_reason,
      'createdAt', session.created_at
    ) order by session.created_at desc), '[]'::jsonb)
    into session_history
    from (
      select *
      from public.player_access_sessions
      where profile_id = profile.id
      order by created_at desc
      limit 50
    ) as session;
  end if;

  if can_security_events then
    select coalesce(jsonb_agg(jsonb_build_object(
      'eventId', event.id,
      'eventKey', event.event_key,
      'result', event.result,
      'reasonCode', event.reason_code,
      'walletMasked', private.mask_wallet(event.wallet_address),
      'correlationId', event.correlation_id,
      'createdAt', event.created_at
    ) order by event.created_at desc), '[]'::jsonb)
    into security_history
    from (
      select *
      from public.player_security_events
      where profile_id = profile.id
      order by created_at desc
      limit 100
    ) as event;
  end if;

  return jsonb_build_object(
    'found', true,
    'profile', jsonb_build_object(
      'userId', profile.user_id,
      'profileId', profile.id,
      'displayLabel', profile.display_label,
      'status', profile.status,
      'onboardingState', profile.onboarding_state,
      'accessState', profile.access_state,
      'suspendedAt', profile.suspended_at,
      'suspensionReason', profile.suspension_reason,
      'createdAt', profile.created_at,
      'updatedAt', profile.updated_at,
      'lastSignInAt', profile.last_successful_sign_in_at,
      'lastWalletVerificationAt', profile.last_wallet_verification_at,
      'lastAccessVerificationAt', profile.last_access_verification_at
    ),
    'wallets', wallet_history,
    'accessEvaluations', evaluation_history,
    'accessSessions', session_history,
    'securityEvents', security_history,
    'permissions', jsonb_build_object(
      'supportView', can_support,
      'accessHistory', can_access_history,
      'securityEvents', can_security_events
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function private.valid_wallet_address(text) from public, anon, authenticated, service_role;
revoke all on function private.valid_network(text) from public, anon, authenticated, service_role;
revoke all on function private.mask_wallet(text) from public, anon, authenticated, service_role;
revoke all on function private.record_wallet_event(uuid, uuid, text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function private.record_security_event(uuid, uuid, text, text, text, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function private.profile_for_user(uuid) from public, anon, authenticated, service_role;

revoke all on function public.player_issue_wallet_challenge(text, text, text, text, text, uuid, text, text, integer, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_begin_challenge_verification(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_consume_challenge(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_record_wallet_event(uuid, text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_find_by_wallet(text) from public, anon, authenticated, service_role;
revoke all on function public.player_register(uuid, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_record_sign_in(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_replace_wallet(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_record_access_evaluation(uuid, text, uuid, text, text, text, integer, numeric, numeric, text, integer, bigint, integer, text) from public, anon, authenticated, service_role;
revoke all on function public.player_invalidate_access_sessions(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function public.player_record_security_event(uuid, text, text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.get_player_me() from public, anon, authenticated, service_role;
revoke all on function public.get_player_directory() from public, anon, authenticated, service_role;
revoke all on function public.get_player_detail(uuid) from public, anon, authenticated, service_role;

grant execute on function public.player_issue_wallet_challenge(text, text, text, text, text, uuid, text, text, integer, text, text) to service_role;
grant execute on function public.player_begin_challenge_verification(uuid, text, text) to service_role;
grant execute on function public.player_consume_challenge(uuid, text, text, text) to service_role;
grant execute on function public.player_record_wallet_event(uuid, text, text, text, text, text) to service_role;
grant execute on function public.player_find_by_wallet(text) to service_role;
grant execute on function public.player_register(uuid, text, text, text, text) to service_role;
grant execute on function public.player_record_sign_in(uuid, text, text) to service_role;
grant execute on function public.player_replace_wallet(uuid, text, text, text) to service_role;
grant execute on function public.player_record_access_evaluation(uuid, text, uuid, text, text, text, integer, numeric, numeric, text, integer, bigint, integer, text) to service_role;
grant execute on function public.player_invalidate_access_sessions(uuid, text, text) to service_role;
grant execute on function public.player_record_security_event(uuid, text, text, text, text, text) to service_role;

grant execute on function public.get_player_me() to authenticated;
grant execute on function public.get_player_directory() to authenticated;
grant execute on function public.get_player_detail(uuid) to authenticated;
