import Link from 'next/link';

import { AuthFrame } from '@/components/auth-frame';

export const metadata = { title: 'Session expired' };

export default function SessionExpiredPage() {
  return (
    <AuthFrame
      eyebrow="Session ended"
      title="That session is no longer valid"
      description="The link may have expired or already been used. Sign in again or request a new reset link."
    >
      <div className="action-stack">
        <Link className="button button--primary" href="/login">
          Back to sign in
        </Link>
        <Link className="button button--quiet" href="/forgot-password">
          Request a new reset link
        </Link>
      </div>
    </AuthFrame>
  );
}
