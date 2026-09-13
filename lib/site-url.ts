const OFFICIAL_VERCEL = 'https://lg-agenda.vercel.app';

export function canonicalSiteUrl() {
  const raw = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (!raw) return OFFICIAL_VERCEL;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    // Evita deployments antigos/preview do mesmo projeto. Quando houver domínio próprio,
    // basta defini-lo em NEXT_PUBLIC_SITE_URL e ele será preservado.
    if (host.endsWith('.vercel.app') && host !== 'lg-agenda.vercel.app') return OFFICIAL_VERCEL;
    return `${u.protocol}//${u.host}`;
  } catch {
    return OFFICIAL_VERCEL;
  }
}

export function canonicalClientOrigin() {
  if (typeof window === 'undefined') return OFFICIAL_VERCEL;
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.vercel.app') && host !== 'lg-agenda.vercel.app') return OFFICIAL_VERCEL;
  return window.location.origin;
}
