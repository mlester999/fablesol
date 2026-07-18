'use client';

import { useActionState } from 'react';

import { inviteAdminAction, type InvitationLinkState } from '@/app/actions/team';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { ADMIN_ROLE_KEYS, ADMIN_ROLE_NAMES, type AdminRoleKey } from '@/lib/auth/catalog';
import { InvitationLinkPanel } from './invitation-link-panel';

const IDLE_STATE: InvitationLinkState = { status: 'idle' };

interface InviteFormProps {
  /** Roles the current administrator may assign (super_admin needs admins.manage_roles). */
  readonly assignableRoleKeys: readonly AdminRoleKey[];
}

export function InviteForm({ assignableRoleKeys }: InviteFormProps) {
  const [state, formAction] = useActionState(inviteAdminAction, IDLE_STATE);

  return (
    <div className="invite-form">
      {state.status === 'error' && state.message ? (
        <Notice tone="warning">{state.message}</Notice>
      ) : null}
      <InvitationLinkPanel state={state} />

      <form className="form-grid" action={formAction}>
        <div className="field">
          <label htmlFor="invite-full-name">Full name</label>
          <input id="invite-full-name" maxLength={100} name="fullName" required type="text" />
        </div>
        <div className="field">
          <label htmlFor="invite-email">Email</label>
          <input id="invite-email" maxLength={254} name="email" required type="email" />
        </div>
        <div className="field">
          <label htmlFor="invite-role">Role</label>
          <select defaultValue="read_only_analyst" id="invite-role" name="roleKey">
            {ADMIN_ROLE_KEYS.filter((key) => assignableRoleKeys.includes(key)).map((key) => (
              <option key={key} value={key}>
                {ADMIN_ROLE_NAMES[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="invite-expiry">Expires in (hours)</label>
          <input
            defaultValue={72}
            id="invite-expiry"
            max={336}
            min={1}
            name="expiresInHours"
            type="number"
          />
        </div>
        <div className="field field--wide">
          <label htmlFor="invite-reason">Reason (recorded in the audit log)</label>
          <input
            id="invite-reason"
            maxLength={500}
            minLength={3}
            name="reason"
            placeholder="Why this person needs access"
            required
            type="text"
          />
        </div>
        <div className="field field--actions">
          <SubmitButton pendingLabel="Creating invitation…">Create invitation</SubmitButton>
        </div>
      </form>
    </div>
  );
}
