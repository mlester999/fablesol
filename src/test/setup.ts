import '@testing-library/jest-dom/vitest';

// jsdom implements neither matchMedia nor IntersectionObserver. Provide
// inert stand-ins so components using reduced-motion checks and scroll
// tracking can render in tests.
if (typeof window !== 'undefined') {
  if (window.matchMedia === undefined) {
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }

  if (window.IntersectionObserver === undefined) {
    class InertIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    window.IntersectionObserver =
      InertIntersectionObserver as unknown as typeof IntersectionObserver;
  }
}
