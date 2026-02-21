import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { UserRole } from '@/lib/types';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';
import { canAccessResource, logIDORAttempt } from '@/lib/security/idor';

// PUT - Izmena sadržaja komentara (autor, editor, admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Morate biti prijavljeni' }, { status: 401 });
    }

    const commentDoc = await adminDb.collection('comments').doc(params.id).get();
    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Komentar ne postoji' }, { status: 404 });
    }

    const canEdit = canAccessResource(
      { id: session.user.id, role: session.user.role },
      commentDoc.data()?.authorId,
      { allowEditor: true }
    );
    if (!canEdit) {
      logIDORAttempt(session.user.id, params.id, 'comment');
      return NextResponse.json({ error: 'Nemate dozvolu za izmenu ovog komentara' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = sanitizeObject(body);
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Sadržaj komentara je obavezan' }, { status: 400 });
    }

    await adminDb.collection('comments').doc(params.id).update({
      content,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Komentar uspešno izmenjen' }, { status: 200 });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Greška pri izmeni komentara' }, { status: 500 });
  }
}

// PATCH - Sakrivanje/prikazivanje komentara (samo editor i admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Morate biti prijavljeni' }, { status: 401 });
    }

    const { role } = session.user;
    if (role !== UserRole.EDITOR && role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nemate dozvolu za moderaciju komentara' }, { status: 403 });
    }

    const commentDoc = await adminDb.collection('comments').doc(params.id).get();
    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Komentar ne postoji' }, { status: 404 });
    }

    const currentHidden = commentDoc.data()?.isHidden ?? false;
    await adminDb.collection('comments').doc(params.id).update({
      isHidden: !currentHidden,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: currentHidden ? 'Komentar prikazan' : 'Komentar sakriven', isHidden: !currentHidden },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error toggling comment visibility:', error);
    return NextResponse.json({ error: 'Greška pri moderaciji komentara' }, { status: 500 });
  }
}

// DELETE - Brisanje komentara (autor, editor, admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Morate biti prijavljeni' }, { status: 401 });
    }

    const commentDoc = await adminDb.collection('comments').doc(params.id).get();
    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Komentar ne postoji' }, { status: 404 });
    }

    const canDelete = canAccessResource(
      { id: session.user.id, role: session.user.role },
      commentDoc.data()?.authorId,
      { allowEditor: true }
    );
    if (!canDelete) {
      logIDORAttempt(session.user.id, params.id, 'comment');
      return NextResponse.json({ error: 'Nemate dozvolu za brisanje ovog komentara' }, { status: 403 });
    }

    await adminDb.collection('comments').doc(params.id).delete();

    return NextResponse.json({ message: 'Komentar uspešno obrisan' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Greška pri brisanju komentara' }, { status: 500 });
  }
}
