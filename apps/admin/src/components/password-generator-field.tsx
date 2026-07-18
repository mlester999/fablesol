'use client';

import { useId, useState } from 'react';

import { generateStrongPassword } from '@/lib/auth/password';

interface PasswordGeneratorFieldProps {
  readonly label: string;
  readonly confirmationLabel: string;
}

/**
 * Password + confirmation pair with an optional crypto-random suggestion.
 * The generated value is filled into both fields and shown once so it can be
 * saved into a password manager; nothing is stored anywhere else.
 */
export function PasswordGeneratorField({ label, confirmationLabel }: PasswordGeneratorFieldProps) {
  const passwordId = useId();
  const confirmationId = useId();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [revealGenerated, setRevealGenerated] = useState(false);

  function fillGenerated() {
    const generated = generateStrongPassword();
    setPassword(generated);
    setConfirmation(generated);
    setRevealGenerated(true);
  }

  return (
    <>
      <div className="field">
        <div className="field__heading">
          <label htmlFor={passwordId}>{label}</label>
          <button className="linklike" onClick={fillGenerated} type="button">
            Suggest a strong password
          </button>
        </div>
        <input
          autoComplete="new-password"
          id={passwordId}
          maxLength={128}
          minLength={12}
          name="password"
          onChange={(event) => {
            setPassword(event.target.value);
            setRevealGenerated(false);
          }}
          required
          type={revealGenerated ? 'text' : 'password'}
          value={password}
        />
        {revealGenerated ? (
          <p className="field__hint" role="status">
            Save this generated password in your password manager before continuing.
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor={confirmationId}>{confirmationLabel}</label>
        <input
          autoComplete="new-password"
          id={confirmationId}
          maxLength={128}
          minLength={12}
          name="passwordConfirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type={revealGenerated ? 'text' : 'password'}
          value={confirmation}
        />
      </div>
    </>
  );
}
