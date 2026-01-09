import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/lib/types";

// Rute koje zahtevaju autentifikaciju
const protectedRoutes = ["/dashboard", "/profile", "/posts/create"];

// Rute dostupne samo admin-u
const adminRoutes = ["/admin"];

// Rute dostupne admin i editor rolama
const editorRoutes = ["/posts/edit", "/destinations/manage"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proveri da li je ruta zaštićena
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isEditorRoute = editorRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Uzmi JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Ako je zaštićena ruta i nema tokena, redirektuj na login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin rute - samo za ADMIN role
  if (isAdminRoute && token?.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Editor rute - za ADMIN i EDITOR role
  if (isEditorRoute) {
    const allowedRoles = [UserRole.ADMIN, UserRole.EDITOR];
    if (!token || !allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Konfiguriši na kojim putanjama middleware radi
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};