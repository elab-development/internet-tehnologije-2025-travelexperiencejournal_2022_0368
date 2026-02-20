import { RateLimiterMemory } from 'rate-limiter-flexible';

// Generalni API limiter — 100 zahteva po minutu po IP-ju
export const generalLimiter = new RateLimiterMemory({
  points: 100,       // broj zahteva
  duration: 60,      // period u sekundama
  keyPrefix: 'general',
});

// Auth limiter — 10 pokušaja po minutu (brute-force zaštita)
export const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  keyPrefix: 'auth',
});

// Mutacioni limiter — 30 POST/PUT/DELETE zahteva po minutu
export const mutationLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
  keyPrefix: 'mutation',
});

/**
 * Vraća IP adresu iz zahteva.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
