import { NextRequest } from 'next/server';

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

  // Same-origin request: origin mora da se poklapa sa hostom samog zahteva.
  // Ovo pokriva localhost, Vercel URL-ove, custom domene i preview deploymente —
  // bez potrebe da se svaki URL hardkoduje.
  const requestOrigin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const allowedOrigins = [
    requestOrigin,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Proveri Origin header
  if (origin) {
    return allowedOrigins.some((allowed) => origin.startsWith(allowed));
  }

  // Fallback: proveri Referer
  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }

  // Nema ni Origin ni Referer — sumnjivo za browser zahteve
  // Ali dozvoli za non-browser klijente (Postman, curl)
  const userAgent = request.headers.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome');

  return !isBrowser;
}
