/**
 * First Super Admin bootstrap for the hosted Fablesol project.
 *
 *   npm run admin:bootstrap -- --email you@example.com --full-name "Your Name"
 *   npm run admin:bootstrap -- --email … --full-name … --apply
 *   npm run admin:bootstrap -- --email … --full-name … --apply --print-recovery-link
 *
 * Dry-run is the default: it verifies the target and evaluates the trusted
 * database preview without writing anything. `--apply` additionally requires
 * ADMIN_BOOTSTRAP_ENABLED=true in the environment.
 *
 * The database refuses a second active Super Admin, so this is single-use by
 * construction. No secrets are printed unless --print-recovery-link is passed
 * explicitly (it prints a one-time password-recovery link for the new user).
 */

import { randomBytes, randomUUID } from 'node:crypto';
import process from 'node:process';

import { loadEnvironment, printSummary, verifyFablesolTarget } from './guard.mjs';

function parseArguments(argv) {
  const options = { apply: false, printRecoveryLink: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--print-recovery-link') options.printRecoveryLink = true;
    else if (argument === '--email') options.email = argv[(index += 1)];
    else if (argument === '--full-name') options.fullName = argv[(index += 1)];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.email || !options.email.includes('@')) {
    throw new Error('--email is required (the Super Admin staff email)');
  }
  if (!options.fullName || options.fullName.trim() === '') {
    throw new Error('--full-name is required');
  }
  return options;
}

async function createServiceClient(environment) {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env.local',
    );
  }
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function findAuthUserByEmail(client, email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const result = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (result.error) {
      throw new Error('Unable to list auth users on the Fablesol project');
    }
    const match = result.data.users.find((user) => user.email?.toLowerCase() === target);
    if (match) return match;
    if (result.data.users.length < 100) return undefined;
  }
  return undefined;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const environment = loadEnvironment();
  const summary = verifyFablesolTarget(environment);

  printSummary(summary, { mode: options.apply ? 'apply' : 'dry-run' });

  const client = await createServiceClient(environment);

  const preview = await client.rpc('preview_super_admin_bootstrap', { p_email: options.email });
  if (preview.error) {
    throw new Error('The trusted bootstrap preview could not be evaluated');
  }
  const allowed = preview.data?.allowed === true;
  printSummary({
    bootstrapAllowed: allowed,
    reasonCode: preview.data?.reasonCode ?? null,
    operation: preview.data?.operation ?? null,
  });

  if (!options.apply) {
    process.stdout.write('Bootstrap dry run complete; no database write was performed.\n');
    return;
  }

  if (!summary.bootstrapEnabled) {
    throw new Error(
      'Bootstrap writes are not approved. Set ADMIN_BOOTSTRAP_ENABLED=true for this session, then retry.',
    );
  }
  if (!allowed) {
    throw new Error('The trusted bootstrap preview refused the operation');
  }

  let authUser = await findAuthUserByEmail(client, options.email);
  let createdAuthUser = false;

  if (authUser === undefined) {
    // The random password is never printed; the owner signs in through a
    // recovery link (--print-recovery-link) or the portal's forgot-password flow.
    const throwawayPassword = `${randomBytes(24).toString('base64url')}Aa1!`;
    const created = await client.auth.admin.createUser({
      email: options.email,
      password: throwawayPassword,
      email_confirm: true,
      user_metadata: { full_name: options.fullName.trim() },
    });
    if (created.error || !created.data.user) {
      throw new Error('The bootstrap auth user could not be created');
    }
    authUser = created.data.user;
    createdAuthUser = true;
  }

  const bootstrap = await client.rpc('bootstrap_super_admin', {
    p_user_id: authUser.id,
    p_email: options.email,
    p_full_name: options.fullName.trim(),
    p_request_id: randomUUID(),
  });
  if (bootstrap.error) {
    throw new Error(`The trusted bootstrap operation was refused: ${bootstrap.error.message}`);
  }

  printSummary({
    operation: bootstrap.data?.operation ?? 'created',
    roleKey: bootstrap.data?.roleKey ?? 'super_admin',
    createdAuthUser,
  });

  if (options.printRecoveryLink) {
    const link = await client.auth.admin.generateLink({
      type: 'recovery',
      email: options.email,
    });
    if (link.error || !link.data.properties?.action_link) {
      throw new Error('The recovery link could not be generated');
    }
    process.stdout.write(
      '\nOne-time recovery link (treat as a secret; expires quickly):\n' +
        `${link.data.properties.action_link}\n`,
    );
  } else {
    process.stdout.write(
      'Done. Sign in via the portal "Forgot password?" flow, or re-run with --print-recovery-link.\n',
    );
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Bootstrap failed'}\n`);
  process.exitCode = 1;
});
