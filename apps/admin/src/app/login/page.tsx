import Link from 'next/link';

import { loginAction } from '@/app/actions/auth';
import { AuthFrame } from '@/components/auth-frame';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { loginNoticeMessage } from '@/lib/auth/messages';

interface LoginPageProps {
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const notice = loginNoticeMessage((await searchParams).notice);

  return (
    <AuthFrame
      eyebrow="Administrator access"
      title="Sign in to Fablesol Administration"
      description="Use your staff credentials. Every session is checked against trusted database records."
      footer={
        <p>
          Need help? Contact your Fablesol security administrator through your approved internal
          channel.
        </p>
      }
    >
      {notice ? (
        <Notice tone={notice.includes('updated') || notice.includes('signed out') ? 'success' : 'warning'}>
          {notice}
        </Notice>
      ) : null}

      <form className="form-stack" action={loginAction}>
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

        <div className="field">
          <div className="field__heading">
            <label htmlFor="password">Password</label>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={1024}
            required
          />
        </div>

        <SubmitButton pendingLabel="Verifying access…">Continue securely</SubmitButton>
      </form>

      <p className="security-note">
        <span aria-hidden="true">◆</span>
        Administrator actions are recorded in an append-only audit log.
      </p>
    </AuthFrame>
  );
}
