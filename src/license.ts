const SLUG = 'sprite-frame-lab';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const API = 'https://api.sociobot.in/api/v1';

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

export function acceptReturnedLicense(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return null;
  localStorage.setItem(KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token;
}

export function storeLicense(token: string): void {
  localStorage.setItem(KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function licenseState(): { token: string | null; unlocked: boolean } {
  const token = localStorage.getItem(KEY);
  const raw = localStorage.getItem(VERDICT_KEY);
  let verdict: Verdict | null = null;
  try { verdict = raw ? JSON.parse(raw) as Verdict : null; } catch { verdict = null; }
  return { token, unlocked: Boolean(token && (!verdict || verdict.valid)) };
}

export async function verifyLicense(force = false): Promise<{ valid: boolean; reason?: string } | null> {
  const token = localStorage.getItem(KEY);
  if (!token) return null;
  const raw = localStorage.getItem(VERDICT_KEY);
  try {
    const cached = raw ? JSON.parse(raw) as Verdict : null;
    if (!force && cached && Date.now() - cached.checkedAt < 86_400_000) return cached;
  } catch { /* fetch a fresh verdict */ }
  const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service unavailable');
  const payload = await response.json() as { valid: boolean; reason?: string };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ ...payload, checkedAt: Date.now() }));
  return payload;
}

export const checkoutUrl = `${API}/products/${SLUG}/checkout`;
