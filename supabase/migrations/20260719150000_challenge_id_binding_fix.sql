-- Fablesol Phase 2B fix: bind the stored challenge row to the exact challenge
-- id embedded in the signed wallet message.
--
-- The application server generates the challenge id, embeds it in the
-- message the wallet signs, and must persist the row under that same id.
-- The previous function ignored the server id and minted its own primary
-- key, so the id inside every signed message could never match the stored
-- challenge and verification always failed closed with binding_mismatch.
--
-- The signature changes (a new p_challenge_id argument), so the old
-- function is dropped and recreated with identical validation, rate limits,
-- and audit behavior, plus explicit re-grants.

drop function if exists public.player_issue_wallet_challenge(
  text, text, text, text, text, uuid, text, text, integer, text, text
);

create function public.player_issue_wallet_challenge(
  p_challenge_id uuid,
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
  if p_challenge_id is null then
    return jsonb_build_object('status', 'invalid', 'reasonCode', 'challenge_id_required');
  end if;
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

  begin
    insert into public.wallet_signature_challenges
      (id, wallet_address, network, domain, uri, purpose, requested_by_user_id,
       nonce_hash, message_hash, client_key_hash, correlation_id, issued_at, expires_at)
    values
      (p_challenge_id, p_wallet_address, p_network, p_domain, p_uri, p_purpose, p_requested_by_user_id,
       p_nonce_hash, p_message_hash, p_client_key_hash, p_correlation_id, issued, expires)
    returning id into challenge_id;
  exception
    when unique_violation then
      -- A colliding or replayed challenge id can never overwrite a row.
      return jsonb_build_object('status', 'invalid', 'reasonCode', 'challenge_id_conflict');
  end;

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

revoke all on function public.player_issue_wallet_challenge(uuid, text, text, text, text, text, uuid, text, text, integer, text, text) from public, anon, authenticated, service_role;
grant execute on function public.player_issue_wallet_challenge(uuid, text, text, text, text, text, uuid, text, text, integer, text, text) to service_role;
