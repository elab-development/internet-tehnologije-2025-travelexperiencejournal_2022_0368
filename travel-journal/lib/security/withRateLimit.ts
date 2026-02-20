import { NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getClientIP } from './rateLimiter';

/**
 * Proverava rate limit za dati zahtev.
 * Vraća null ako je OK, ili NextResponse ako je limit prekoračen.
 */
export async function checkRateLimit(
  request: Request,
  limiter: RateLimiterMemory
): Promise<NextResponse | null> {
  const ip = getClientIP(request);

  try {
    await limiter.consume(ip);
    return null; // OK — nije prekoračen
  } catch (rateLimiterRes) {
    return NextResponse.json(
      { error: 'Previše zahteva. Pokušajte ponovo za minut.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limiter.points),
        },
      }
    );
  }
}
