import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural contract for the public layout stylesheet. jsdom cannot lay
 * out CSS, so these assertions pin the layout decisions that owner review
 * required: the docs article gets priority width, the right TOC waits for
 * genuinely wide viewports, anchors clear the sticky header, and the flow
 * diagram composes on its container width instead of the viewport.
 */
const css = readFileSync(join(__dirname, 'globals.css'), 'utf8');

describe('docs layout contract', () => {
  it('gives the docs article a flexible priority column', () => {
    expect(css).toMatch(/\.docs-layout \{[^}]*grid-template-columns: 15rem minmax\(0, 1fr\);/);
  });

  it('hides the right TOC by default and shows it only extra-wide', () => {
    expect(css).toMatch(/\.docs-toc \{\s*display: none;\s*\}/);
    expect(css).toMatch(
      /@media \(min-width: 1360px\) \{[\s\S]*?\.docs-toc \{\s*display: block;\s*\}/,
    );
    // The compact article-outline disclosure retires once the TOC appears.
    expect(css).toMatch(
      /@media \(min-width: 1360px\) \{[\s\S]*?\.docs-outline \{\s*display: none;\s*\}/,
    );
  });

  it('keeps anchor destinations clear of the sticky header', () => {
    expect(css).toMatch(/html \{[^}]*scroll-padding-top: calc\(var\(--header-offset\)/);
    expect(css).toMatch(/\.docs-section \{[^}]*scroll-margin-top: calc\(var\(--header-offset\)/);
    expect(css).toMatch(/\.htp-chapter \{[^}]*scroll-margin-top: calc\(var\(--header-offset\)/);
  });

  it('never conceals overflow with overflow-x clip on the page body', () => {
    expect(css).not.toMatch(/body \{[^}]*overflow-x: clip/);
  });
});

describe('flow diagram composition contract', () => {
  it('recomposes on container width, not viewport width', () => {
    expect(css).toMatch(/\.flow-diagram-region \{[^}]*container-type: inline-size/);
    // Medium containers: two columns.
    expect(css).toMatch(
      /@container flowregion \(min-width: 34rem\) \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
    );
    // Wide containers: one horizontal progression.
    expect(css).toMatch(
      /@container flowregion \(min-width: 56rem\) \{[\s\S]*?grid-auto-flow: column/,
    );
  });

  it('has no viewport media query controlling flow diagram columns', () => {
    const mediaBlocks = css.match(/@media[^{]*\{[\s\S]*?\n\}/g) ?? [];
    for (const block of mediaBlocks) {
      expect(block).not.toContain('.flow-diagram__step');
    }
  });
});
