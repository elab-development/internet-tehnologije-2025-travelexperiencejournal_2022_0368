import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";
import { UserRole } from "@/lib/types";

// Uzmi session na serveru
export async function getSession() {
  return await getServerSession(authConfig);
}

// Proveri da li je korisnik ulogovan
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

// Proveri da li korisnik ima određenu role
export async function hasRole(role: UserRole) {
  const session = await getSession();
  return session?.user?.role === role;
}

// Proveri da li korisnik ima jednu od više rola
export async function hasAnyRole(roles: UserRole[]) {
  const session = await getSession();
  return session?.user?.role && roles.includes(session.user.role);
}

// Uzmi trenutnog korisnika
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}