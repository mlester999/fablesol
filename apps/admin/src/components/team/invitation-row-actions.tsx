'use client';

import { useActionState } from 'react';

import {
  resendInvitationAction,
  revokeInvitationAction,
  type InvitationLinkState,
} from '@/app/actions/team';
import { ConfirmedSubmitButton } from '@/components/confirmed-submit-button';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { InvitationLinkPanel } from './invitation-link-panel';

const IDLE_STATE: InvitationLinkState = { status: 'idle' };

interface InvitationRowActionsProps {
  readonly invitationId: string;
  readonly email: string;
  readonly canResend: boolean;
  readonly canRevoke: boolean;
}

export function InvitationRowActions({
  invitationId,
  email,
  canResend,
  canRevoke,
}: InvitationRowActionsProps) {
  const [resendState, resendFormAction] = useActionState(resendInvitationAction, IDLE_STATE);

  if (!canResend && !canRevoke) return null;

  return (
    <details className="row-actions">
      <summary>Manage</summary>
      <div className="row-actions__body">
        {resendState.status === 'error' && resendState.message ? (
          <Notice tone="warning">{resendState.message}</Notice>
        ) : null}
        <InvitationLinkPanel state={resendState} />

        {canResend ? (
          <form className="row-actions__form" action={resendFormAction}>
            <input name="invitationId" type="hidden" value={invitationId} />
            <input name="email" type="hidden" value={email} />
            <label>
              Reason
              <input maxLength={500} minLength={3} name="reason" required type="text" />
            </label>
            <SubmitButton variant="secondary" pendingLabel="Resending…">
              Resend with a new link
            </SubmitButton>
          </form>
        ) : null}

        {canRevoke ? (
          <form className="row-actions__form" action={revokeInvitationAction}>
            <input name="invitationId" type="hidden" value={invitationId} />
            <label>
              Reason
              <input maxLength={500} minLength={3} name="reason" required type="text" />
            </label>
            <ConfirmedSubmitButton
              confirmation={`Revoke the invitation for ${email}? The link stops working immediately.`}
              pendingLabel="Revoking…"
              variant="danger"
            >
              Revoke invitation
            </ConfirmedSubmitButton>
          </form>
        ) : null}
      </div>
    </details>
  );
}
