import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@/lib/types';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/posts/create',
  '/posts/edit',
  '/destinations/create'
];
const adminRoutes = ['/admin'];
const editorRoutes = ['/posts/edit', '/destinations/manage'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isEditorRoute = editorRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Zaštićene rute - samo autentifikovani
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin rute - samo ADMIN
  if (isAdminRoute && token?.role !== UserRole.ADMIN) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Editor rute - ADMIN i EDITOR
  if (isEditorRoute) {
    const allowedRoles = [UserRole.ADMIN, UserRole.EDITOR];
    if (!token || !allowedRoles.includes(token.role as UserRole)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};