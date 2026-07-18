import Link from 'next/link';

import { forgotPasswordAction } from '@/app/actions/auth';
import { AuthFrame } from '@/components/auth-frame';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { AUTH_MESSAGES } from '@/lib/auth/messages';

interface ForgotPasswordPageProps {
  readonly searchParams: Promise<{ readonly sent?: string }>;
}

export const metadata = { title: 'Forgot password' };

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const sent = (await searchParams).sent === '1';

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your staff email. If it can receive a reset email, instructions will arrive shortly."
      footer={<Link href="/login">Back to sign in</Link>}
    >
      {sent ? <Notice tone="success">{AUTH_MESSAGES.resetRequested}</Notice> : null}

      <form className="form-stack" action={forgotPasswordAction}>
        <div className="field">
          <label htmlFor="email">Staff email</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            maxLength={254}
            required
          />
        </div>

        <SubmitButton pendingLabel="Sending…">Send reset instructions</SubmitButton>
      </form>
    </AuthFrame>
  );
}
