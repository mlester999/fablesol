/**
 * Hosted database tests for the Phase 2B player identity and $FABLE access
 * schema. No Docker: the suite connects straight to the hosted Fablesol
 * database (SUPABASE_DATABASE_URL) and runs everything inside ONE
 * transaction that always ends in ROLLBACK, so every disposable auth user,
 * profile, wallet, challenge, and event vanishes even when a test fails.
 *
 * Gated by RUN_HOSTED_SUPABASE_TESTS=true and the Fablesol target guard.
 * Requires the four 20260719* player migrations to be applied first.
 *
 *   RUN_HOSTED_SUPABASE_TESTS=true npm run db:test:hosted
 *
 * TAP-style output, exit code 1 when any test fails.
 */

import { randomUUID } from 'node:crypto';
import process from 'node:process';

import { loadEnvironment, printSummary, verifyFablesolTarget } from './guard.mjs';

const NONCE_HASH = 'a'.repeat(64);
const MESSAGE_HASH = 'b'.repeat(64);
const OTHER_MESSAGE_HASH = 'c'.repeat(64);
const MINT = 'So11111111111111111111111111111111111111112';
const WALLET_A = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
const WALLET_B = '4Nd1mYQVLh6EVLh6nPyLwj4y1sVdjSY6D6bYPu9nLEV6';
const WALLET_C = '7cVfgArCheMR6Cs4t6vz5rfnqd56vZq4ndaBrY5xkxXy';
const NETWORK = 'solana:devnet';
const DOMAIN = 'localhost:3600';
const URI = 'http://localhost:3600';

let testNumber = 0;
let failures = 0;

function record(name, passed, detail) {
  testNumber += 1;
  process.stdout.write(`${passed ? 'ok' : 'not ok'} ${testNumber} - ${name}\n`);
  if (!passed) {
    failures += 1;
    if (detail) process.stdout.write(`# ${String(detail).split('\n')[0]}\n`);
  }
}

/** Runs a statement inside a savepoint and returns the error, or null. */
async function tryQuery(client, sql, params = []) {
  await client.query('savepoint probe');
  try {
    const result = await client.query(sql, params);
    await client.query('release savepoint probe');
    return { result, error: null };
  } catch (error) {
    await client.query('rollback to savepoint probe');
    return { result: null, error };
  }
}

async function asUser(client, userId) {
  await client.query('reset role');
  await client.query(`select set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: userId, role: 'authenticated' }),
  ]);
  await client.query('set local role authenticated');
}

async function asAnon(client) {
  await client.query('reset role');
  await client.query(`select set_config('request.jwt.claims', '', true)`);
  await client.query('set local role anon');
}

async function asOwner(client) {
  await client.query('reset role');
  await client.query(`select set_config('request.jwt.claims', '', true)`);
}

async function createDisposableAuthUser(client) {
  const id = randomUUID();
  await client.query(
    `insert into auth.users
       (instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data)
     values
       ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '',
        now(), now(), now(), '', '', '', '',
        '{"fablesol_player": true, "disposable_test": true}'::jsonb, '{}'::jsonb)`,
    [id, `disposable-${id}@players.fablesol.invalid`],
  );
  return id;
}

async function rpcJson(client, sql, params = []) {
  const { result, error } = await tryQuery(client, sql, params);
  if (error) return { error };
  return { data: result.rows[0]?.value };
}

async function main() {
  const environment = loadEnvironment();
  const summary = verifyFablesolTarget(environment);
  printSummary(summary, { suite: 'hosted-player-schema' });

  if (!summary.hostedTestsApproved) {
    throw new Error(
      'Hosted tests are not approved. Set RUN_HOSTED_SUPABASE_TESTS=true for this session, then retry.',
    );
  }

  const databaseUrl = environment.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('SUPABASE_DATABASE_URL is required for the player schema tests.');
  }

  const { default: pg } = await import('pg');
  const isLocalDatabase = /@(127\.0\.0\.1|localhost)[:/]/.test(databaseUrl);
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query('begin');

    const applied = await client.query(
      `select count(*)::int as n from pg_tables where schemaname = 'public' and tablename in
        ('player_profiles', 'player_wallets', 'wallet_signature_challenges',
         'wallet_verification_events', 'player_access_evaluations',
         'player_access_sessions', 'player_security_events')`,
    );
    if (applied.rows[0].n !== 7) {
      throw new Error(
        'The Phase 2B player migrations are not applied on the hosted project. Push them first.',
      );
    }

    // -----------------------------------------------------------------
    // Disposable identities (all rolled back at the end)
    // -----------------------------------------------------------------
    const userA = await createDisposableAuthUser(client);
    const userB = await createDisposableAuthUser(client);
    const userC = await createDisposableAuthUser(client);
    const adminUser = await createDisposableAuthUser(client);
    const analystUser = await createDisposableAuthUser(client);

    // -----------------------------------------------------------------
    // Registration, profile uniqueness, auth ownership, wallet conflicts
    // -----------------------------------------------------------------
    const registeredA = await rpcJson(
      client,
      `select public.player_register($1, $2, $3, $4, $5) as value`,
      [userA, WALLET_A, NETWORK, 'Farmer TestAAAA', 'test-a'],
    );
    record(
      'player_register creates a profile and wallet link',
      registeredA.data?.status === 'created',
      JSON.stringify(registeredA.data ?? registeredA.error?.message),
    );

    const registeredAgain = await rpcJson(
      client,
      `select public.player_register($1, $2, $3, $4, $5) as value`,
      [userA, WALLET_B, NETWORK, 'Farmer TestAAAA', 'test-a2'],
    );
    record(
      'player profile uniqueness: a second profile for the same auth user is refused',
      registeredAgain.data?.status === 'conflict' &&
        registeredAgain.data?.reasonCode === 'profile_exists',
      JSON.stringify(registeredAgain.data),
    );

    const ghostUser = randomUUID();
    const ghostRegister = await rpcJson(
      client,
      `select public.player_register($1, $2, $3, $4, $5) as value`,
      [ghostUser, WALLET_B, NETWORK, 'Farmer Ghost', 'test-ghost'],
    );
    record(
      'auth-user ownership: registration without a real auth user is refused',
      ghostRegister.data?.status === 'invalid' &&
        ghostRegister.data?.reasonCode === 'auth_user_missing',
      JSON.stringify(ghostRegister.data),
    );

    const directOrphan = await tryQuery(
      client,
      `insert into public.player_profiles (user_id, display_label) values ($1, 'Farmer Orphan')`,
      [ghostUser],
    );
    record(
      'auth-user ownership: the foreign key refuses orphan profiles',
      directOrphan.error !== null,
      'insert unexpectedly succeeded',
    );

    await rpcJson(client, `select public.player_register($1, $2, $3, $4, $5) as value`, [
      userB,
      WALLET_B,
      NETWORK,
      'Farmer TestBBBB',
      'test-b',
    ]);

    const conflictRegister = await rpcJson(
      client,
      `select public.player_register($1, $2, $3, $4, $5) as value`,
      [userC, WALLET_A, NETWORK, 'Farmer TestCCCC', 'test-c'],
    );
    record(
      'active-wallet uniqueness: a wallet linked elsewhere cannot join a second profile',
      conflictRegister.data?.status === 'conflict' &&
        conflictRegister.data?.reasonCode === 'wallet_already_linked',
      JSON.stringify(conflictRegister.data),
    );

    const profileA = await client.query(
      `select id from public.player_profiles where user_id = $1`,
      [userA],
    );
    const profileAId = profileA.rows[0].id;
    const walletA = await client.query(
      `select id from public.player_wallets where profile_id = $1 and status = 'active'`,
      [profileAId],
    );
    const walletAId = walletA.rows[0].id;

    const duplicateActive = await tryQuery(
      client,
      `insert into public.player_wallets (profile_id, wallet_address, network)
       values ($1, $2, $3)`,
      [profileAId, WALLET_C, NETWORK],
    );
    record(
      'active-wallet uniqueness: a profile cannot hold two active wallets',
      duplicateActive.error !== null,
      'insert unexpectedly succeeded',
    );

    // -----------------------------------------------------------------
    // Challenges: creation, network validation, single use, replay,
    // expiration, attempt exhaustion
    // -----------------------------------------------------------------
    const requestedChallengeId = randomUUID();
    const challenge = await rpcJson(
      client,
      `select public.player_issue_wallet_challenge($1, $2, $3, $4, $5, 'sign_in', null, $6, $7, 300, null, 'test-ch') as value`,
      [requestedChallengeId, WALLET_A, NETWORK, DOMAIN, URI, NONCE_HASH, MESSAGE_HASH],
    );
    record(
      'challenge creation succeeds with hash-only storage',
      challenge.data?.status === 'created' && typeof challenge.data?.challengeId === 'string',
      JSON.stringify(challenge.data ?? challenge.error?.message),
    );
    const challengeId = challenge.data?.challengeId;

    record(
      'challenge is stored under the exact server-supplied id (message binding)',
      challengeId === requestedChallengeId,
      `requested ${requestedChallengeId}, stored ${challengeId}`,
    );

    const reusedId = await rpcJson(
      client,
      `select public.player_issue_wallet_challenge($1, $2, $3, $4, $5, 'sign_in', null, $6, $7, 300, null, 'test-ch-dup') as value`,
      [requestedChallengeId, WALLET_B, NETWORK, DOMAIN, URI, NONCE_HASH, MESSAGE_HASH],
    );
    record(
      'a reused challenge id can never overwrite an existing challenge',
      reusedId.data?.status === 'invalid' && reusedId.data?.reasonCode === 'challenge_id_conflict',
      JSON.stringify(reusedId.data),
    );

    const storedChallenge = await client.query(
      `select nonce_hash, message_hash from public.wallet_signature_challenges where id = $1`,
      [challengeId],
    );
    record(
      'challenge rows store only 64-hex hashes, never plaintext material',
      /^[0-9a-f]{64}$/.test(storedChallenge.rows[0]?.nonce_hash ?? '') &&
        /^[0-9a-f]{64}$/.test(storedChallenge.rows[0]?.message_hash ?? ''),
      JSON.stringify(storedChallenge.rows[0]),
    );

    const badNetwork = await rpcJson(
      client,
      `select public.player_issue_wallet_challenge($1, $2, 'solana:testnet', $3, $4, 'sign_in', null, $5, $6, 300, null, 'test-net') as value`,
      [randomUUID(), WALLET_A, DOMAIN, URI, NONCE_HASH, MESSAGE_HASH],
    );
    record(
      'unknown network rejection at challenge issuance',
      badNetwork.data?.status === 'invalid' && badNetwork.data?.reasonCode === 'network_invalid',
      JSON.stringify(badNetwork.data),
    );

    const wrongWalletBegin = await rpcJson(
      client,
      `select public.player_begin_challenge_verification($1, $2, 'test-mismatch') as value`,
      [challengeId, WALLET_B],
    );
    record(
      'challenge is bound to its wallet: another wallet cannot begin verification',
      wrongWalletBegin.data?.status === 'wallet_mismatch',
      JSON.stringify(wrongWalletBegin.data),
    );

    const wrongHashConsume = await rpcJson(
      client,
      `select public.player_consume_challenge($1, $2, $3, 'test-wrong-hash') as value`,
      [challengeId, WALLET_A, OTHER_MESSAGE_HASH],
    );
    record(
      'challenge consumption requires the exact bound message hash',
      wrongHashConsume.data?.status === 'not_consumable',
      JSON.stringify(wrongHashConsume.data),
    );

    const consumed = await rpcJson(
      client,
      `select public.player_consume_challenge($1, $2, $3, 'test-consume') as value`,
      [challengeId, WALLET_A, MESSAGE_HASH],
    );
    record(
      'challenge one-time use: first consumption succeeds',
      consumed.data?.status === 'consumed',
      JSON.stringify(consumed.data),
    );

    const consumedTwice = await rpcJson(
      client,
      `select public.player_consume_challenge($1, $2, $3, 'test-replay') as value`,
      [challengeId, WALLET_A, MESSAGE_HASH],
    );
    record(
      'challenge one-time use: second consumption is refused',
      consumedTwice.data?.status === 'not_consumable',
      JSON.stringify(consumedTwice.data),
    );

    const replayBegin = await rpcJson(
      client,
      `select public.player_begin_challenge_verification($1, $2, 'test-replay2') as value`,
      [challengeId, WALLET_A],
    );
    record(
      'signature replay rejection: a consumed challenge reports replayed',
      replayBegin.data?.status === 'replayed',
      JSON.stringify(replayBegin.data),
    );

    const unconsume = await tryQuery(
      client,
      `update public.wallet_signature_challenges set status = 'pending', consumed_at = null where id = $1`,
      [challengeId],
    );
    record(
      'a consumed challenge can never be reset to unused',
      unconsume.error !== null,
      'update unexpectedly succeeded',
    );

    const expiredId = randomUUID();
    await client.query(
      `insert into public.wallet_signature_challenges
         (id, wallet_address, network, domain, uri, purpose, nonce_hash, message_hash, issued_at, expires_at)
       values ($1, $2, $3, $4, $5, 'sign_in', $6, $7, now() - interval '10 minutes', now() - interval '5 minutes')`,
      [expiredId, WALLET_A, NETWORK, DOMAIN, URI, NONCE_HASH, MESSAGE_HASH],
    );
    const expiredBegin = await rpcJson(
      client,
      `select public.player_begin_challenge_verification($1, $2, 'test-expired') as value`,
      [expiredId, WALLET_A],
    );
    record(
      'challenge expiration: an expired challenge is refused and marked expired',
      expiredBegin.data?.status === 'expired',
      JSON.stringify(expiredBegin.data),
    );

    const attemptsChallenge = await rpcJson(
      client,
      `select public.player_issue_wallet_challenge($1, $2, $3, $4, $5, 'sign_in', null, $6, $7, 300, null, 'test-attempts') as value`,
      [randomUUID(), WALLET_C, NETWORK, DOMAIN, URI, NONCE_HASH, MESSAGE_HASH],
    );
    const attemptsId = attemptsChallenge.data?.challengeId;
    let lastAttempt;
    for (let i = 0; i < 6; i += 1) {
      lastAttempt = await rpcJson(
        client,
        `select public.player_begin_challenge_verification($1, $2, 'test-exhaust') as value`,
        [attemptsId, WALLET_C],
      );
    }
    record(
      'verification attempts are limited server-side',
      lastAttempt.data?.status === 'rejected',
      JSON.stringify(lastAttempt.data),
    );

    // -----------------------------------------------------------------
    // Access evaluations and sessions
    // -----------------------------------------------------------------
    const eligible = await rpcJson(
      client,
      `select public.player_record_access_evaluation($1, 'eligible', $2, $3, $4, $5, 6, 10000000000, 10000000000, '10000', 1, 123, 300, 'test-elig') as value`,
      [userA, walletAId, WALLET_A, NETWORK, MINT],
    );
    record(
      'an eligible evaluation records evidence and creates an access session',
      eligible.data?.status === 'recorded' && typeof eligible.data?.sessionId === 'string',
      JSON.stringify(eligible.data ?? eligible.error?.message),
    );
    const sessionId = eligible.data?.sessionId;
    const evaluationId = eligible.data?.evaluationId;

    const badMint = await rpcJson(
      client,
      `select public.player_record_access_evaluation($1, 'eligible', $2, $3, $4, 'not-a-mint!!', 6, 10000000000, 10000000000, '10000', 1, 123, 300, 'test-mint') as value`,
      [userA, walletAId, WALLET_A, NETWORK],
    );
    record(
      'unknown mint rejection: an eligible result with an invalid mint is refused',
      badMint.data?.status === 'invalid',
      JSON.stringify(badMint.data),
    );

    const badThreshold = await rpcJson(
      client,
      `select public.player_record_access_evaluation($1, 'eligible', $2, $3, $4, $5, 6, 0, 10000000000, '10000', 1, 123, 300, 'test-thr') as value`,
      [userA, walletAId, WALLET_A, NETWORK, MINT],
    );
    record(
      'invalid threshold rejection: an eligible result requires a positive requirement',
      badThreshold.data?.status === 'invalid',
      JSON.stringify(badThreshold.data),
    );

    const belowRequirement = await rpcJson(
      client,
      `select public.player_record_access_evaluation($1, 'eligible', $2, $3, $4, $5, 6, 10000000000, 9999999999, '9999.999999', 1, 123, 300, 'test-below') as value`,
      [userA, walletAId, WALLET_A, NETWORK, MINT],
    );
    record(
      'an eligible result with a balance below the requirement is refused',
      belowRequirement.data?.status === 'invalid',
      JSON.stringify(belowRequirement.data),
    );

    const mutateEvaluation = await tryQuery(
      client,
      `update public.player_access_evaluations set result = 'eligible' where id = $1`,
      [evaluationId],
    );
    record(
      'access-evaluation immutability: recorded decisions cannot be edited',
      mutateEvaluation.error !== null,
      'update unexpectedly succeeded',
    );

    const extendSession = await tryQuery(
      client,
      `update public.player_access_sessions set expires_at = expires_at + interval '1 hour' where id = $1`,
      [sessionId],
    );
    record(
      'access-session expiration is immutable: sessions cannot be extended',
      extendSession.error !== null,
      'update unexpectedly succeeded',
    );

    const replaced = await rpcJson(
      client,
      `select public.player_replace_wallet($1, $2, $3, 'test-replace') as value`,
      [userA, WALLET_C, NETWORK],
    );
    record(
      'wallet replacement succeeds for the owning player',
      replaced.data?.status === 'replaced',
      JSON.stringify(replaced.data ?? replaced.error?.message),
    );

    const invalidatedSession = await client.query(
      `select invalidated_at, invalidation_reason from public.player_access_sessions where id = $1`,
      [sessionId],
    );
    record(
      'access sessions are invalidated when the wallet is replaced',
      invalidatedSession.rows[0]?.invalidated_at !== null &&
        invalidatedSession.rows[0]?.invalidation_reason === 'wallet_replaced',
      JSON.stringify(invalidatedSession.rows[0]),
    );

    const reactivate = await tryQuery(
      client,
      `update public.player_access_sessions set invalidated_at = null, invalidation_reason = null where id = $1`,
      [sessionId],
    );
    record(
      'an invalidated access session cannot be reactivated',
      reactivate.error !== null,
      'update unexpectedly succeeded',
    );

    const replacedConflict = await rpcJson(
      client,
      `select public.player_replace_wallet($1, $2, $3, 'test-replace-conflict') as value`,
      [userB, WALLET_C, NETWORK],
    );
    record(
      'wallet conflict rejection: replacement with an actively linked wallet is refused',
      replacedConflict.data?.status === 'conflict' &&
        replacedConflict.data?.reasonCode === 'wallet_already_linked',
      JSON.stringify(replacedConflict.data),
    );

    // -----------------------------------------------------------------
    // Append-only histories and UTC timestamps
    // -----------------------------------------------------------------
    const securityEvent = await client.query(
      `select id from public.player_security_events where profile_id = $1 limit 1`,
      [profileAId],
    );
    const securityEventId = securityEvent.rows[0]?.id;
    const editEvent = await tryQuery(
      client,
      `update public.player_security_events set result = 'success' where id = $1`,
      [securityEventId],
    );
    const deleteEvent = await tryQuery(
      client,
      `delete from public.player_security_events where id = $1`,
      [securityEventId],
    );
    record(
      'security-event history is append-only (no edits, no deletes)',
      editEvent.error !== null && deleteEvent.error !== null,
      'mutation unexpectedly succeeded',
    );

    const timestampTypes = await client.query(
      `select count(*)::int as n
       from information_schema.columns
       where table_schema = 'public'
         and table_name in ('player_profiles', 'player_wallets', 'wallet_signature_challenges',
                            'player_access_evaluations', 'player_access_sessions', 'player_security_events')
         and column_name in ('created_at', 'updated_at', 'issued_at', 'expires_at', 'evaluated_at')
         and data_type <> 'timestamp with time zone'`,
    );
    record(
      'UTC timestamp behavior: every lifecycle column is timestamptz',
      timestampTypes.rows[0].n === 0,
      `${timestampTypes.rows[0].n} columns are not timestamptz`,
    );

    // -----------------------------------------------------------------
    // Row-level security: anonymous, self, cross-player
    // -----------------------------------------------------------------
    await asAnon(client);

    const anonProfiles = await tryQuery(client, `select count(*) from public.player_profiles`);
    const anonWallets = await tryQuery(client, `select count(*) from public.player_wallets`);
    const anonChallenges = await tryQuery(
      client,
      `select count(*) from public.wallet_signature_challenges`,
    );
    const anonEvents = await tryQuery(client, `select count(*) from public.player_security_events`);
    const anonEvaluations = await tryQuery(
      client,
      `select count(*) from public.player_access_evaluations`,
    );
    record(
      'anonymous users cannot read players, wallets, challenges, history, or evaluations',
      [anonProfiles, anonWallets, anonChallenges, anonEvents, anonEvaluations].every(
        (probe) => probe.error !== null,
      ),
      'an anonymous read unexpectedly succeeded',
    );

    const anonMe = await tryQuery(client, `select public.get_player_me()`);
    record(
      'anonymous users cannot call the player self view',
      anonMe.error !== null,
      'anonymous get_player_me unexpectedly succeeded',
    );

    await asUser(client, userA);
    const selfRead = await tryQuery(client, `select user_id from public.player_profiles`);
    record(
      'player self-read: an authenticated player sees exactly their own profile',
      selfRead.error === null &&
        selfRead.result.rows.length === 1 &&
        selfRead.result.rows[0].user_id === userA,
      selfRead.error?.message ?? `rows=${selfRead.result?.rows.length}`,
    );

    const selfMe = await rpcJson(client, `select public.get_player_me() as value`);
    record(
      'get_player_me returns the caller profile with wallet state',
      selfMe.data?.found === true && typeof selfMe.data?.wallet?.walletAddress === 'string',
      JSON.stringify(selfMe.data ?? selfMe.error?.message),
    );

    const forbiddenMutation = await tryQuery(
      client,
      `update public.player_profiles set access_state = 'eligible' where user_id = $1`,
      [userA],
    );
    const forbiddenSessionInsert = await tryQuery(
      client,
      `insert into public.player_access_sessions
         (profile_id, wallet_id, evaluation_id, wallet_address, network, token_mint,
          required_base_units, observed_base_units, expires_at)
       values ($1, $2, $3, $4, $5, $6, 1, 1, now() + interval '5 minutes')`,
      [profileAId, walletAId, evaluationId, WALLET_C, NETWORK, MINT],
    );
    record(
      'players cannot mark themselves eligible or forge access sessions',
      forbiddenMutation.error !== null && forbiddenSessionInsert.error !== null,
      'a direct player mutation unexpectedly succeeded',
    );

    await asUser(client, userB);
    const crossRead = await tryQuery(
      client,
      `select count(*)::int as n from public.player_profiles where user_id = $1`,
      [userA],
    );
    const crossWallets = await tryQuery(
      client,
      `select count(*)::int as n from public.player_wallets where profile_id = $1`,
      [profileAId],
    );
    const crossSessions = await tryQuery(
      client,
      `select count(*)::int as n from public.player_access_sessions where profile_id = $1`,
      [profileAId],
    );
    record(
      'cross-player denial: another player sees zero of my rows',
      crossRead.error === null &&
        crossRead.result.rows[0].n === 0 &&
        crossWallets.result?.rows[0]?.n === 0 &&
        crossSessions.result?.rows[0]?.n === 0,
      'cross-player data unexpectedly visible',
    );

    // -----------------------------------------------------------------
    // Admin views: permission enforcement and analyst behavior
    // -----------------------------------------------------------------
    const nonAdminDirectory = await tryQuery(client, `select public.get_player_directory()`);
    record(
      'admin permission enforcement: a non-admin player cannot read the directory',
      nonAdminDirectory.error !== null &&
        /ADMIN_PERMISSION_DENIED|permission/i.test(nonAdminDirectory.error.message),
      nonAdminDirectory.error?.message ?? 'call unexpectedly succeeded',
    );

    await asOwner(client);
    await client.query(
      `insert into public.admin_members (user_id, role_id, status, full_name, email)
       select $1, id, 'active', 'Disposable Test Admin', $2
       from public.admin_roles where key = 'super_admin'`,
      [adminUser, `disposable-admin-${adminUser}@players.fablesol.invalid`],
    );
    await client.query(
      `insert into public.admin_members (user_id, role_id, status, full_name, email)
       select $1, id, 'active', 'Disposable Test Analyst', $2
       from public.admin_roles where key = 'read_only_analyst'`,
      [analystUser, `disposable-analyst-${analystUser}@players.fablesol.invalid`],
    );

    await asUser(client, adminUser);
    const adminDirectory = await rpcJson(client, `select public.get_player_directory() as value`);
    const directoryEntryA = Array.isArray(adminDirectory.data)
      ? adminDirectory.data.find((entry) => entry.userId === userA)
      : undefined;
    record(
      'admin permissioned read: the directory lists the disposable player, wallet masked',
      directoryEntryA !== undefined &&
        typeof directoryEntryA.walletMasked === 'string' &&
        directoryEntryA.walletMasked.length < WALLET_C.length,
      JSON.stringify(directoryEntryA ?? adminDirectory.error?.message),
    );

    const adminDetail = await rpcJson(client, `select public.get_player_detail($1) as value`, [
      userA,
    ]);
    const detailHasHistory =
      adminDetail.data?.found === true &&
      Array.isArray(adminDetail.data?.accessEvaluations) &&
      Array.isArray(adminDetail.data?.securityEvents) &&
      Array.isArray(adminDetail.data?.wallets);
    const detailPayload = JSON.stringify(adminDetail.data ?? {});
    record(
      'admin player detail includes wallet, access, and security history',
      detailHasHistory,
      adminDetail.error?.message ?? 'histories missing',
    );
    record(
      'admin player detail never contains signature or session material',
      detailHasHistory && !/nonce|signature|token_hash|session_token|secret/i.test(detailPayload),
      'sensitive-looking keys found in detail payload',
    );

    await asUser(client, analystUser);
    const analystDetail = await rpcJson(client, `select public.get_player_detail($1) as value`, [
      userA,
    ]);
    const analystWallet = analystDetail.data?.wallets?.[0]?.wallet ?? '';
    record(
      'read-only analyst: wallets stay masked and security events stay hidden',
      analystDetail.data?.found === true &&
        analystDetail.data?.permissions?.supportView === false &&
        analystDetail.data?.permissions?.securityEvents === false &&
        analystDetail.data?.securityEvents === null &&
        analystWallet.includes('…'),
      JSON.stringify(analystDetail.data?.permissions ?? analystDetail.error?.message),
    );

    const analystForbiddenWrite = await tryQuery(
      client,
      `update public.player_profiles set status = 'active' where user_id = $1`,
      [userA],
    );
    record(
      'read-only analyst cannot mutate player rows',
      analystForbiddenWrite.error !== null,
      'analyst mutation unexpectedly succeeded',
    );

    await asOwner(client);
  } finally {
    // Every disposable record above disappears here, pass or fail.
    await client.query('rollback').catch(() => undefined);
    await client.end().catch(() => undefined);
  }

  process.stdout.write(`1..${testNumber}\n`);
  if (failures > 0) {
    throw new Error(`${failures} of ${testNumber} hosted player schema tests failed.`);
  }
  process.stdout.write(
    `# All ${testNumber} hosted player schema tests passed. Rolled back cleanly.\n`,
  );
}

main().catch((error) => {
  console.error(`hosted-player-db-tests: ${error.message}`);
  process.exitCode = 1;
});
