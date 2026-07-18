import { logoutAction } from '@/app/actions/auth';
import { AuthFrame } from '@/components/auth-frame';
import { SubmitButton } from '@/components/submit-button';

export const metadata = { title: 'Access unavailable' };

export default function UnauthorizedPage() {
  return (
    <AuthFrame
      eyebrow="Access unavailable"
      title="You cannot open Fablesol Administration"
      description="This identity does not currently have authorized administration access. No role or account details are disclosed here."
      footer={
        <p>
          If access was assigned recently, contact your Fablesol security administrator before
          trying again.
        </p>
      }
    >
      <div className="action-stack">
        <form action={logoutAction}>
          <SubmitButton variant="quiet" pendingLabel="Signing out…">
            Sign out of this identity
          </SubmitButton>
        </form>
      </div>
    </AuthFrame>
  );
}
