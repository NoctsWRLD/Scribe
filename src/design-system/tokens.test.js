/**
 * The design system's contract.
 *
 * Two things are checked here, both of which are easy to break by eye:
 *   1. Every foreground/background token pairing meets WCAG AA.
 *   2. The dark theme is a complete token swap — it defines every token the
 *      light theme defines, so a component never needs a theme override.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

function readBlock(selector) {
  const start = css.indexOf(`${selector} {`);
  expect(start, `missing block ${selector}`).toBeGreaterThan(-1);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close);
  const tokens = {};
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const light = readBlock(':root');
const dark = readBlock(":root[data-theme='noc']");
const highContrast = readBlock(":root[data-contrast='high']");

function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const int = parseInt(hex[1], 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }
  const rgb = value.match(/^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function luminance([r, g, b]) {
  const channel = (value) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground, background) {
  const a = luminance(parseColor(foreground));
  const b = luminance(parseColor(background));
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const THEMES = [
  ['light', light],
  ['dark', dark],
];

/**
 * A token is theme-scoped when its value is a colour. Motion, radius and
 * easing are global and live in `:root` only — they must not be duplicated
 * per theme, and they must not be mistaken for a missing dark value.
 */
function isThemeScoped(value) {
  return /^#/.test(value) || /^rgb\(/.test(value) || value.includes('var(--rp-aurora-');
}

describe('token system', () => {
  it('defines the same token set in both themes (dark is a swap, not a second sheet)', () => {
    const scoped = Object.entries(light).filter(([, value]) => isThemeScoped(value)).map(([token]) => token);
    const missing = scoped.filter((token) => !(token in dark));
    expect(missing).toEqual([]);
  });

  it('keeps the high-contrast overrides inside the base token set', () => {
    const stray = Object.keys(highContrast).filter((token) => !(token in light));
    expect(stray).toEqual([]);
  });

  it.each(THEMES)('%s theme — text tiers on every surface meet WCAG AA', (_name, tokens) => {
    const surfaces = ['rp-canvas', 'rp-panel', 'rp-raised', 'rp-overlay'];
    for (const surface of surfaces) {
      for (const tier of ['rp-text', 'rp-subtle', 'rp-muted']) {
        const ratio = contrast(tokens[tier], tokens[surface]);
        expect(ratio, `${tier} on ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(THEMES)('%s theme — the primary action meets WCAG AA', (_name, tokens) => {
    const ratio = contrast(tokens['rp-accent-ink'], tokens['rp-accent']);
    expect(ratio, `accent-ink on accent is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEMES)('%s theme — text on the mauve fill meets WCAG AA', (_name, tokens) => {
    for (const fill of ['rp-mark', 'rp-mark-hover']) {
      const ratio = contrast(tokens['rp-mark-ink'], tokens[fill]);
      expect(ratio, `mark-ink on ${fill} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(THEMES)('%s theme — accent and status colours read as text on the canvas', (_name, tokens) => {
    for (const role of ['rp-accent', 'rp-warn', 'rp-danger', 'rp-success', 'rp-info']) {
      const ratio = contrast(tokens[role], tokens['rp-canvas']);
      expect(ratio, `${role} on canvas is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(THEMES)('%s theme — every subject hue reads on the canvas and on a card', (_name, tokens) => {
    for (let index = 1; index <= 10; index += 1) {
      const hue = tokens[`rp-subject-${index}`];
      expect(hue, `subject ${index} is not defined`).toBeTruthy();
      for (const surface of ['rp-canvas', 'rp-raised']) {
        const ratio = contrast(hue, tokens[surface]);
        expect(ratio, `subject ${index} on ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps the margin rule readable as a line on every surface', () => {
    for (const [name, tokens] of THEMES) {
      for (const surface of ['rp-canvas', 'rp-raised']) {
        const ratio = contrast(tokens['rp-rule'], tokens[surface]);
        expect(ratio, `${name} margin rule on ${surface} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('contains no gradient at all — the highlighter is data, never decoration', () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toMatch(/gradient/i);
  });

  it('keeps the aurora tokens out of the system entirely', () => {
    for (const [name, tokens] of THEMES) {
      const stray = Object.keys(tokens).filter((token) => token.includes('aurora'));
      expect(stray, `${name} still defines an aurora token`).toEqual([]);
    }
  });
});

describe('type and spacing roles', () => {
  it('pairs a display face, a reading face and a mono face', () => {
    expect(css).toMatch(/--font-display: 'Fraunces'/);
    expect(css).toMatch(/--font-sans: 'Karla'/);
    expect(css).toMatch(/--font-mono: 'JetBrains Mono'/);
  });

  it('serves all three faces from this origin', () => {
    for (const file of ['fraunces-latin', 'karla-latin', 'jetbrains-mono-latin']) {
      expect(css, `missing @font-face source ${file}`).toContain(`fonts/${file}.woff2`);
    }
  });

  it('does not fall back to the previous faces', () => {
    for (const retired of ['Space Grotesk', 'DM Sans', 'Geist']) {
      expect(css, `${retired} is still referenced`).not.toMatch(new RegExp(retired));
    }
  });

  it('builds the spacing scale on a 4px base unit', () => {
    const scale = ['--spacing-1: 0.25rem', '--spacing-2: 0.5rem', '--spacing-3: 0.75rem', '--spacing-4: 1rem'];
    for (const step of scale) {
      expect(css, `missing ${step}`).toContain(step);
    }
  });

  it('binds every display size to the display face', () => {
    const block = css.slice(css.indexOf('@layer utilities'));
    expect(block).toContain('font-family: var(--font-display)');
    for (const role of ['.text-display', '.text-hero', '.text-page', '.text-title']) {
      expect(block, `${role} is not bound to the display face`).toContain(role);
    }
  });
});

describe('shape', () => {
  it('cuts every corner to one 2px step', () => {
    for (const step of ['', '-xs', '-sm', '-md', '-lg', '-xl', '-2xl']) {
      expect(css, `--radius${step} is not 2px`).toContain(`--radius${step}: 2px;`);
    }
  });

  it('never uses a pill for a bar or a panel', () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toMatch(/border-radius:\s*(9|99|999|9999)px/);
  });
});

describe('the shipped page', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

  it('boots into the dark theme before the first paint', () => {
    expect(html).toMatch(/<html[^>]*data-theme="noc"/);
  });

  it('preloads the two reading-critical faces', () => {
    expect(html).toContain('fraunces-latin.woff2');
    expect(html).toContain('karla-latin.woff2');
  });
});
