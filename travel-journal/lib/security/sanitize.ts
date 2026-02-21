/**
 * Sanitizuje HTML string — uklanja sve opasne tagove i atribute.
 * Koristi se za SVE korisničke inpute pre čuvanja u bazu.
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;

  // Ukloni SVE HTML tagove — čist tekst
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitizuje objekat — prolazi kroz sva string polja.
 * Koristi se za sanitizaciju celih request body-ja.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]) as any;
    }
  }

  return sanitized;
}
