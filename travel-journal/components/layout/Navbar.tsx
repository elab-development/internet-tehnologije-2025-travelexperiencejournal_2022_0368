'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { LogOut, User, Home, MapPin, PenSquare, FileText } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (status === 'loading') {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-32"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Travel Journal
            </span>
          </Link>

          {/* Navigation Links */}
          {session ? (
            <div className="flex items-center gap-4">
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
    >
      <Home className="w-5 h-5" />
      <span className="hidden sm:inline">Dashboard</span>
    </Link>

    <Link
      href="/posts/create"
      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
    >
      <PenSquare className="w-5 h-5" />
      <span className="hidden sm:inline">Novi putopis</span>
    </Link>

    {/* ✅ DODAJ OVO */}
    <Link
      href="/destinations/create"
      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
    >
      <MapPin className="w-5 h-5" />
      <span className="hidden sm:inline">Nova destinacija</span>
    </Link>

    <Link
      href="/profile"
      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
    >
      <User className="w-5 h-5" />
      <span className="hidden sm:inline">{session.user?.name}</span>
    </Link>

    <Link
      href="/api-docs"
      className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
    >
      <FileText className="w-5 h-5" />
      <span className="hidden sm:inline">API Docs</span>
    </Link>

    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Odjavi se</span>
    </Button>
  </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Prijavi se
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Registruj se
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}