import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('static deployment policy', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as {
    globalHeaders: Record<string, string>;
    routes: Array<{ route: string; headers: Record<string, string> }>;
  };

  it('ships CSP, permissions, and anti-framing headers', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("script-src 'self'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('uses immutable caching for static assets and revalidates the worker', () => {
    const route = (path: string) => config.routes.find((item) => item.route === path)?.headers['Cache-Control'];
    expect(route('/assets/*')).toBe('public, max-age=31536000, immutable');
    expect(route('/icons/*')).toBe('public, max-age=31536000, immutable');
    expect(route('/sw.js')).toBe('no-cache');
  });
});
