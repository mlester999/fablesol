import { redirect } from 'next/navigation';

import { resetPasswordAction } from '@/app/actions/auth';
import { AuthFrame } from '@/components/auth-frame';
import { Notice } from '@/components/notice';
import { PasswordGeneratorField } from '@/components/password-generator-field';
import { SubmitButton } from '@/components/submit-button';
import { resetNoticeMessage } from '@/lib/auth/messages';
import { hasVerifiedRecoverySession } from '@/lib/auth/recovery';
import { ADMIN_ROUTES } from '@/lib/auth/redirects';

interface ResetPasswordPageProps {
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export const metadata = { title: 'Choose a new password' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  if (!(await hasVerifiedRecoverySession())) {
    redirect(ADMIN_ROUTES.sessionExpired);
  }

  const notice = resetNoticeMessage((await searchParams).notice);

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use 12-128 characters with uppercase, lowercase, a number, and a symbol."
    >
      {notice ? <Notice tone="warning">{notice}</Notice> : null}

      <form className="form-stack" action={resetPasswordAction}>
        <PasswordGeneratorField confirmationLabel="Confirm new password" label="New password" />
        <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
      </form>
    </AuthFrame>
  );
}
