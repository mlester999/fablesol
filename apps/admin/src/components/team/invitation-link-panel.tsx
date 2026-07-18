'use client';

import { useState } from 'react';

import type { InvitationLinkState } from '@/app/actions/team';

/**
 * Shows a freshly minted acceptance link exactly once. The token exists only
 * in this response; once the panel is dismissed the link cannot be recovered,
 * only resent.
 */
export function InvitationLinkPanel({ state }: { readonly state: InvitationLinkState }) {
  const [copied, setCopied] = useState(false);

  if (state.status !== 'created' && state.status !== 'resent') return null;
  if (state.acceptanceUrl === undefined) return null;

  async function copyLink() {
    if (state.acceptanceUrl === undefined) return;
    try {
      await navigator.clipboard.writeText(state.acceptanceUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="invite-link" role="status">
      <p className="invite-link__title">
        {state.status === 'created' ? 'Invitation created' : 'Invitation resent'}
        {state.email ? ` for ${state.email}` : ''}. Share this single-use link through an approved
        channel — it is shown only once:
      </p>
      <p className="invite-link__url">
        <code>{state.acceptanceUrl}</code>
      </p>
      <div className="invite-link__actions">
        <button className="button button--secondary" onClick={copyLink} type="button">
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {state.expiresAt ? (
          <span className="invite-link__expiry">
            Expires {new Date(state.expiresAt).toLocaleString()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
