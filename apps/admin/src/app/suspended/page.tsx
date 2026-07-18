import { logoutAction } from '@/app/actions/auth';
import { AuthFrame } from '@/components/auth-frame';
import { SubmitButton } from '@/components/submit-button';

export const metadata = { title: 'Access suspended' };

export default function SuspendedPage() {
  return (
    <AuthFrame
      eyebrow="Access suspended"
      title="This administrator account is suspended"
      description="A security administrator has suspended this account. Access can be restored only by an authorized administrator."
      footer={
        <p>Contact your Fablesol security administrator through your approved internal channel.</p>
      }
    >
      <div className="action-stack">
        <form action={logoutAction}>
          <SubmitButton variant="quiet" pendingLabel="Signing out…">
            Sign out
          </SubmitButton>
        </form>
      </div>
    </AuthFrame>
  );
}
