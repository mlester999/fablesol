import Link from 'next/link';

import { acceptInvitationAction } from '@/app/actions/invite';
import { AuthFrame } from '@/components/auth-frame';
import { Notice } from '@/components/notice';
import { PasswordGeneratorField } from '@/components/password-generator-field';
import { SubmitButton } from '@/components/submit-button';
import { hashInvitationToken, isWellFormedInvitationToken } from '@/lib/auth/invitation-token';
import { createAdminServerClient } from '@/lib/supabase/server';

interface InvitePageProps {
  readonly params: Promise<{ readonly token: string }>;
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export const metadata = { title: 'Accept invitation' };
export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Readonly<Record<string, string>> = {
  mismatch: 'The passwords do not match.',
  weak: 'Use 12-128 characters with uppercase, lowercase, a number, and a symbol.',
  'email-mismatch':
    'You are signed in with a different email than this invitation. Sign out, then open the link again.',
  'existing-account':
    'This email already has an account. Sign in with your existing credentials, then open this link again.',
  unavailable: 'The invitation service is temporarily unavailable. Please try again.',
  'service-unconfigured':
    'Account provisioning is not configured on this deployment. Contact your administrator.',
  'already-accepted': 'This invitation has already been accepted.',
  expired: 'This invitation has expired. Ask your administrator to send a new one.',
  revoked: 'This invitation has been revoked.',
  invalid: 'This invitation link is not valid.',
};

function ClosedState({ title, message }: { readonly title: string; readonly message: string }) {
  return (
    <AuthFrame eyebrow="Invitation" title={title} description={message}>
      <div className="action-stack">
        <Link className="button button--quiet" href="/login">
          Go to sign in
        </Link>
      </div>
    </AuthFrame>
  );
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { token } = await params;
  const notice = NOTICE_MESSAGES[(await searchParams).notice ?? ''];

  if (!isWellFormedInvitationToken(token)) {
    return <ClosedState title="Invitation not valid" message={NOTICE_MESSAGES['invalid'] ?? ''} />;
  }

  const tokenHash = await hashInvitationToken(token);
  const supabase = await createAdminServerClient();

  // Opening with a valid token genuinely marks the invitation "link_opened".
  const openResult = await supabase.rpc('open_admin_invitation', { p_token_hash: tokenHash });
  const state =
    !openResult.error && typeof openResult.data === 'object' && openResult.data !== null
      ? openResult.data
      : undefined;
  const status = state === undefined ? 'invalid' : String(Reflect.get(state, 'status'));

  if (status !== 'open') {
    const closedMessage =
      status === 'expired'
        ? (NOTICE_MESSAGES['expired'] ?? '')
        : status === 'revoked'
          ? (NOTICE_MESSAGES['revoked'] ?? '')
          : status === 'accepted'
            ? (NOTICE_MESSAGES['already-accepted'] ?? '')
            : (NOTICE_MESSAGES['invalid'] ?? '');
    return <ClosedState title="Invitation unavailable" message={closedMessage} />;
  }

  const email = String(Reflect.get(state as object, 'email'));
  const fullName = String(Reflect.get(state as object, 'fullName'));
  const roleName = String(Reflect.get(state as object, 'roleName'));

  const userResult = await supabase.auth.getUser();
  const sessionEmail = userResult.error ? undefined : userResult.data.user?.email?.toLowerCase();
  const hasMatchingSession = sessionEmail !== undefined && sessionEmail === email.toLowerCase();

  return (
    <AuthFrame
      eyebrow="Invitation"
      title={`Welcome, ${fullName}`}
      description={`You have been invited to Fablesol Administration as ${roleName} (${email}).`}
    >
      {notice ? <Notice tone="warning">{notice}</Notice> : null}

      {hasMatchingSession ? (
        <form className="form-stack" action={acceptInvitationAction}>
          <input name="token" type="hidden" value={token} />
          <SubmitButton pendingLabel="Accepting…">Accept invitation</SubmitButton>
        </form>
      ) : sessionEmail !== undefined ? (
        <Notice tone="warning">
          {NOTICE_MESSAGES['email-mismatch'] ?? ''}
        </Notice>
      ) : (
        <form className="form-stack" action={acceptInvitationAction}>
          <input name="token" type="hidden" value={token} />
          <PasswordGeneratorField confirmationLabel="Confirm password" label="Choose a password" />
          <SubmitButton pendingLabel="Creating account…">
            Create account and accept
          </SubmitButton>
        </form>
      )}

      <p className="security-note">
        <span aria-hidden="true">◆</span>
        This link is single-use and expires automatically.
      </p>
    </AuthFrame>
  );
}
