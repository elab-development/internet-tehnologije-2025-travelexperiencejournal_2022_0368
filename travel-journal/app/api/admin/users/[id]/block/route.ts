import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { UserRole } from '@/lib/types';

function adminOnly(role: UserRole) {
  return role === UserRole.ADMIN;
}

// POST - Blokiranje korisnika (samo admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || !adminOnly(session.user.role)) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Ne možete blokirati vlastiti nalog' }, { status: 400 });
    }

    const userDoc = await adminDb.collection('users').doc(params.id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Korisnik ne postoji' }, { status: 404 });
    }

    // Ne može blokirati drugog admina
    if (userDoc.data()?.role === UserRole.ADMIN) {
      return NextResponse.json({ error: 'Ne možete blokirati administratora' }, { status: 400 });
    }

    await adminDb.collection('users').doc(params.id).update({
      isBlocked: true,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Korisnik blokiran' }, { status: 200 });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'Greška pri blokiranju korisnika' }, { status: 500 });
  }
}

// DELETE - Odblokiranje korisnika (samo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user || !adminOnly(session.user.role)) {
      return NextResponse.json({ error: 'Nemate dozvolu' }, { status: 403 });
    }

    const userDoc = await adminDb.collection('users').doc(params.id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Korisnik ne postoji' }, { status: 404 });
    }

    await adminDb.collection('users').doc(params.id).update({
      isBlocked: false,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Korisnik odblokiran' }, { status: 200 });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json({ error: 'Greška pri odblokiranju korisnika' }, { status: 500 });
  }
}
