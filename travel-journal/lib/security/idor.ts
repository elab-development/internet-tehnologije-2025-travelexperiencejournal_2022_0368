import { UserRole } from '@/lib/types';

interface AuthorizedUser {
  id: string;
  role: UserRole;
}

/**
 * Proverava da li korisnik ima pristup resursu.
 * Vraća true ako:
 * - korisnik je vlasnik resursa (authorId === user.id)
 * - korisnik je admin
 * - korisnik je editor (opciono, ako je allowEditor true)
 */
export function canAccessResource(
  user: AuthorizedUser,
  resourceAuthorId: string,
  options: { allowEditor?: boolean } = {}
): boolean {
  // Admin uvek ima pristup
  if (user.role === UserRole.ADMIN) return true;

  // Editor ima pristup ako je dozvoljeno
  if (options.allowEditor && user.role === UserRole.EDITOR) return true;

  // Vlasnik ima pristup
  return user.id === resourceAuthorId;
}

/**
 * Proverava da li korisnik pokušava da pristupi tuđem resursu.
 * Loguje potencijalne IDOR napade.
 */
export function logIDORAttempt(
  userId: string,
  resourceId: string,
  resourceType: string
): void {
  console.warn(
    `[SECURITY] Potential IDOR attempt: user=${userId} tried to access ${resourceType}=${resourceId}`
  );
}
