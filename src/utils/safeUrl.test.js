import { describe, expect, it } from 'vitest';
import { safeHttpsUrl } from './safeUrl';

describe('safeHttpsUrl', () => {
  it('keeps an https address', () => {
    expect(safeHttpsUrl('https://firebasestorage.googleapis.com/v0/b/x/o/a.png')).toBe(
      'https://firebasestorage.googleapis.com/v0/b/x/o/a.png',
    );
  });

  it('drops script, data and plain http addresses', () => {
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpsUrl(' JavaScript:alert(1)')).toBeNull();
    expect(safeHttpsUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHttpsUrl('http://example.com/a.png')).toBeNull();
  });

  it('drops anything that is not a string or not a URL', () => {
    expect(safeHttpsUrl(null)).toBeNull();
    expect(safeHttpsUrl({})).toBeNull();
    expect(safeHttpsUrl('not a url')).toBeNull();
    expect(safeHttpsUrl(`https://a.com/${'x'.repeat(3000)}`)).toBeNull();
  });
});
