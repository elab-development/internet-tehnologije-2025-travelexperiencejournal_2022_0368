import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { UserRole } from '@/lib/types';

// GET - Lista svih korisnika (samo admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Morate biti prijavljeni' }, { status: 401 });
    }
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nemate dozvolu pristupa' }, { status: 403 });
    }

    const snapshot = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        isBlocked: data.isBlocked ?? false,
        createdAt: data.createdAt?.toDate()?.toISOString() ?? null,
      });
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju korisnika' }, { status: 500 });
  }
}
