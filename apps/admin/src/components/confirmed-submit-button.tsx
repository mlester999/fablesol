'use client';

import { useFormStatus } from 'react-dom';

interface ConfirmedSubmitButtonProps {
  readonly children: string;
  readonly pendingLabel: string;
  readonly confirmation: string;
  readonly variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
}

/** Submit button that requires an explicit confirmation before the form posts. */
export function ConfirmedSubmitButton({
  children,
  pendingLabel,
  confirmation,
  variant = 'primary',
}: ConfirmedSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`button button--${variant}`}
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
