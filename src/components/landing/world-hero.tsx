'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { WorldSceneFallback } from './world-scene-fallback';

const WorldScene = dynamic(() => import('./world-scene'), {
  ssr: false,
  loading: () => null,
});

/**
 * Landing hero background. The static illustration renders immediately and
 * is progressively enhanced by the lazy-loaded animated scene. Reduced
 * motion gets a single stable rendered frame; WebGL failure keeps the
 * illustration. Title and CTAs never wait on this component.
 */
export function WorldHero() {
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="world-scene" aria-hidden="true">
      <WorldSceneFallback />
      {!failed ? (
        <div className="world-scene__enhanced" data-ready={ready ? 'true' : 'false'}>
          <WorldScene
            staticScene={reduced}
            onReady={() => setReady(true)}
            onFail={() => setFailed(true)}
          />
        </div>
      ) : null}
      <div className="world-scene__vignette" />
    </div>
  );
}
