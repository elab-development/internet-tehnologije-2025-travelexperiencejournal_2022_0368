import { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.NEXTAUTH_URL,
].filter(Boolean);

/**
 * Proverava da li je zahtev došao sa dozvoljenog origina.
 * Vraća true ako je zahtev validan, false ako je sumnjiv.
 */
export function validateCSRF(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // GET i HEAD su safe metode — ne treba CSRF
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // NextAuth rute imaju sopstvenu CSRF zaštitu
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return true;
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Proveri Origin header
  if (origin) {
    return ALLOWED_ORIGINS.some((allowed) =>
      origin.startsWith(allowed as string)
    );
  }

  // Fallback: proveri Referer
  if (referer) {
    return ALLOWED_ORIGINS.some((allowed) =>
      referer.startsWith(allowed as string)
    );
  }

  // Nema ni Origin ni Referer — sumnjivo za browser zahteve
  // Ali dozvoli za non-browser klijente (Postman, curl)
  const userAgent = request.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome');

  return !isBrowser;
}
