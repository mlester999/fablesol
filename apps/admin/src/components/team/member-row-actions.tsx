'use client';

import {
  changeAdminRoleAction,
  restoreAdminAction,
  suspendAdminAction,
} from '@/app/actions/team';
import { ConfirmedSubmitButton } from '@/components/confirmed-submit-button';
import { ADMIN_ROLE_KEYS, ADMIN_ROLE_NAMES, type AdminRoleKey } from '@/lib/auth/catalog';

interface MemberRowActionsProps {
  readonly targetUserId: string;
  readonly fullName: string;
  readonly currentRoleKey: AdminRoleKey;
  readonly status: 'invited' | 'active' | 'suspended';
  readonly isSelf: boolean;
  readonly canManageRoles: boolean;
  readonly canSuspend: boolean;
  readonly canRestore: boolean;
}

export function MemberRowActions({
  targetUserId,
  fullName,
  currentRoleKey,
  status,
  isSelf,
  canManageRoles,
  canSuspend,
  canRestore,
}: MemberRowActionsProps) {
  const showRoleChange = canManageRoles && !isSelf;
  const showSuspend = canSuspend && !isSelf && status !== 'suspended';
  const showRestore = canRestore && status === 'suspended';

  if (!showRoleChange && !showSuspend && !showRestore) return null;

  return (
    <details className="row-actions">
      <summary>Manage</summary>
      <div className="row-actions__body">
        {showRoleChange ? (
          <form className="row-actions__form" action={changeAdminRoleAction}>
            <input name="targetUserId" type="hidden" value={targetUserId} />
            <label>
              New role
              <select defaultValue={currentRoleKey} name="roleKey">
                {ADMIN_ROLE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {ADMIN_ROLE_NAMES[key]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input maxLength={500} minLength={3} name="reason" required type="text" />
            </label>
            <ConfirmedSubmitButton
              confirmation={`Change the role for ${fullName}? The change applies on their next request.`}
              pendingLabel="Updating role…"
              variant="secondary"
            >
              Change role
            </ConfirmedSubmitButton>
          </form>
        ) : null}

        {showSuspend ? (
          <form className="row-actions__form" action={suspendAdminAction}>
            <input name="targetUserId" type="hidden" value={targetUserId} />
            <label>
              Reason
              <input maxLength={500} minLength={3} name="reason" required type="text" />
            </label>
            <ConfirmedSubmitButton
              confirmation={`Suspend ${fullName}? They lose access on their next request.`}
              pendingLabel="Suspending…"
              variant="danger"
            >
              Suspend
            </ConfirmedSubmitButton>
          </form>
        ) : null}

        {showRestore ? (
          <form className="row-actions__form" action={restoreAdminAction}>
            <input name="targetUserId" type="hidden" value={targetUserId} />
            <label>
              Reason
              <input maxLength={500} minLength={3} name="reason" required type="text" />
            </label>
            <ConfirmedSubmitButton
              confirmation={`Restore access for ${fullName}?`}
              pendingLabel="Restoring…"
              variant="secondary"
            >
              Restore access
            </ConfirmedSubmitButton>
          </form>
        ) : null}
      </div>
    </details>
  );
}
