import { Notice } from '@/components/notice';
import { InviteForm } from '@/components/team/invite-form';
import { InvitationRowActions } from '@/components/team/invitation-row-actions';
import { MemberRowActions } from '@/components/team/member-row-actions';
import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { ADMIN_ROLE_KEYS, type AdminRoleKey } from '@/lib/auth/catalog';
import { hasAdminPermission } from '@/lib/auth/types';
import { loadAdminInvitations, loadAdminMembers } from '@/lib/team';

export const metadata = { title: 'Team' };
export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Readonly<
  Record<string, { readonly tone: 'success' | 'warning'; readonly text: string }>
> = {
  'invitation-revoked': { tone: 'success', text: 'The invitation was revoked.' },
  'role-updated': { tone: 'success', text: 'The role was updated.' },
  'member-suspended': { tone: 'success', text: 'The administrator was suspended.' },
  'member-restored': { tone: 'success', text: 'The administrator was restored.' },
  'reason-required': { tone: 'warning', text: 'A reason of 3-500 characters is required.' },
  'action-failed': { tone: 'warning', text: 'That action could not be completed.' },
  'last-super-admin': {
    tone: 'warning',
    text: 'The final active Super Admin cannot be removed, demoted, or suspended.',
  },
};

function formatTimestamp(value: string | null): string {
  if (value === null) return '—';
  return new Date(value).toLocaleString();
}

interface TeamPageProps {
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const context = await requireAuthorizedAdmin('admins.view');
  const notice = NOTICE_MESSAGES[(await searchParams).notice ?? ''];

  const [members, invitations] = await Promise.all([loadAdminMembers(), loadAdminInvitations()]);

  const canInvite = hasAdminPermission(context, 'admins.invite');
  const canManageRoles = hasAdminPermission(context, 'admins.manage_roles');
  const canSuspend = hasAdminPermission(context, 'admins.suspend');
  const canRestore = hasAdminPermission(context, 'admins.restore');
  const canResend = hasAdminPermission(context, 'admins.resend_invite');
  const canRevoke = hasAdminPermission(context, 'admins.revoke_invite');

  // Inviting as Super Admin additionally requires admins.manage_roles (the
  // database enforces the same rule).
  const assignableRoleKeys: readonly AdminRoleKey[] = canManageRoles
    ? ADMIN_ROLE_KEYS
    : ADMIN_ROLE_KEYS.filter((key) => key !== 'super_admin');

  const openInvitations = invitations.filter(
    (invitation) => invitation.status === 'pending' || invitation.status === 'link_opened',
  );
  const closedInvitations = invitations.filter(
    (invitation) => invitation.status !== 'pending' && invitation.status !== 'link_opened',
  );

  return (
    <div className="page-stack">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {canInvite ? (
        <section className="card" aria-labelledby="team-invite">
          <h2 id="team-invite">Invite an administrator</h2>
          <p className="card__note">
            Invitations are single-use links that expire automatically. The database stores only a
            hash of the link token, and every step is recorded in the audit log.
          </p>
          <InviteForm assignableRoleKeys={assignableRoleKeys} />
        </section>
      ) : null}

      <section className="card" aria-labelledby="team-members">
        <h2 id="team-members">Administrators ({members.length})</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Last sign-in</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userId}>
                  <td>
                    <strong>{member.fullName}</strong>
                    <span className="table-sub">{member.email}</span>
                  </td>
                  <td>{member.roleName}</td>
                  <td>
                    <span className={`status-pill status-pill--${member.status}`}>
                      {member.status}
                    </span>
                    {member.status === 'suspended' && member.suspensionReason ? (
                      <span className="table-sub">{member.suspensionReason}</span>
                    ) : null}
                  </td>
                  <td>{formatTimestamp(member.lastSignInAt)}</td>
                  <td>
                    <MemberRowActions
                      canManageRoles={canManageRoles}
                      canRestore={canRestore}
                      canSuspend={canSuspend}
                      currentRoleKey={member.roleKey}
                      fullName={member.fullName}
                      isSelf={member.userId === context.userId}
                      status={member.status}
                      targetUserId={member.userId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="team-invitations">
        <h2 id="team-invitations">Open invitations ({openInvitations.length})</h2>
        {openInvitations.length === 0 ? (
          <p className="card__note">No open invitations.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Invitee</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Expires</th>
                  <th scope="col">Invited by</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {openInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>
                      <strong>{invitation.fullName}</strong>
                      <span className="table-sub">{invitation.email}</span>
                    </td>
                    <td>{invitation.roleName}</td>
                    <td>
                      <span className={`status-pill status-pill--${invitation.status}`}>
                        {invitation.status === 'link_opened' ? 'link opened' : invitation.status}
                      </span>
                      {invitation.resendCount > 0 ? (
                        <span className="table-sub">resent ×{invitation.resendCount}</span>
                      ) : null}
                    </td>
                    <td>{formatTimestamp(invitation.expiresAt)}</td>
                    <td>{invitation.invitedBy ?? '—'}</td>
                    <td>
                      <InvitationRowActions
                        canResend={canResend}
                        canRevoke={canRevoke}
                        email={invitation.email}
                        invitationId={invitation.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {closedInvitations.length > 0 ? (
        <section className="card card--muted" aria-labelledby="team-closed">
          <h2 id="team-closed">Invitation history ({closedInvitations.length})</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Invitee</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {closedInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>
                      <strong>{invitation.fullName}</strong>
                      <span className="table-sub">{invitation.email}</span>
                    </td>
                    <td>{invitation.roleName}</td>
                    <td>
                      <span className={`status-pill status-pill--${invitation.status}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td>{formatTimestamp(invitation.createdAt)}</td>
                    <td>
                      {formatTimestamp(
                        invitation.acceptedAt ?? invitation.revokedAt ?? invitation.expiresAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
