import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from '@/lib/types';
import { validateCSRF } from '@/lib/security/csrf';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/posts/create',
  '/posts/edit',
  '/destinations/create',
];
const adminRoutes = ['/admin'];
const editorRoutes = ['/posts/edit', '/destinations/manage'];

export default withAuth(
  async function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    // ── CSRF zaštita ──
    if (pathname.startsWith('/api/') && !validateCSRF(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed — zahtev odbijen' },
        { status: 403 }
      );
    }

    // Admin rute - samo ADMIN
    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    );
    if (isAdminRoute && token?.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Editor rute - ADMIN i EDITOR
    const isEditorRoute = editorRoutes.some((route) =>
      pathname.startsWith(route)
    );
    if (isEditorRoute) {
      const allowedRoles = [UserRole.ADMIN, UserRole.EDITOR];
      if (!allowedRoles.includes(token?.role as UserRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        const isProtected = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );
        const isAdmin = adminRoutes.some((route) =>
          pathname.startsWith(route)
        );
        // Ako je zaštićena ruta, mora biti autentifikovan
        if (isProtected || isAdmin) {
          return !!token;
        }
        // Sve ostale rute su slobodne
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};