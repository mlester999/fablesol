'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { searchDocumentation } from '@/content/docs/search';

interface DocsSearchProps {
  /**
   * header — compact button for the site header (default).
   * hero — large search-bar-shaped trigger for the docs homepage.
   */
  readonly variant?: 'header' | 'hero';
}

export function DocsSearch({ variant = 'header' }: DocsSearchProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchDocumentation(query, 10), [query]);
  const safeActive = results.length === 0 ? 0 : Math.min(active, results.length - 1);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      queueMicrotask(() => inputRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function go(route: string) {
    setOpen(false);
    setQuery('');
    setActive(0);
    router.push(route);
  }

  return (
    <>
      {variant === 'hero' ? (
        <button type="button" className="dhome-search-btn" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" focusable="false">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Search the player guide…
          <kbd>⌘K</kbd>
        </button>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
          Search
          <kbd style={{ opacity: 0.7, fontSize: '0.78rem' }}>⌘K</kbd>
        </button>
      )}
      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="Search documentation"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="search-dialog__body">
          <div className="field">
            <label htmlFor={`${listId}-input`}>Search docs</label>
            <input
              id={`${listId}-input`}
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              placeholder="COPPER, Battle Power, Divine, UTC…"
              autoComplete="off"
              role="combobox"
              aria-controls={listId}
              aria-expanded={open}
              aria-autocomplete="list"
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActive((value) => Math.max(value - 1, 0));
                } else if (event.key === 'Enter') {
                  const target = results[safeActive];
                  if (target) {
                    event.preventDefault();
                    go(target.route);
                  }
                }
              }}
            />
          </div>
          <p className="live-region" aria-live="polite">
            {query.length < 2
              ? 'Type at least two characters.'
              : results.length === 0
                ? 'No results. Try COPPER, Divine, Energy, or tournament.'
                : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
          <ul className="search-results" id={listId} role="listbox">
            {results.map((result, index) => (
              <li key={result.id} role="option" aria-selected={index === safeActive}>
                <button
                  type="button"
                  data-active={index === safeActive}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(result.route)}
                >
                  <strong>
                    {result.title}
                    {result.heading ? ` · ${result.heading}` : ''}
                  </strong>
                  <small>
                    {result.category} · {result.route}
                  </small>
                  <span
                    style={{ display: 'block', marginTop: '0.25rem', color: 'var(--fb-ink-soft)' }}
                  >
                    {result.excerpt}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
