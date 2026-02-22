import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { UserRole } from '@/lib/types';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';
import { canAccessResource, logIDORAttempt } from '@/lib/security/idor';

// GET - Detalji jednog putopisa
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Uzmi post
    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Putopis ne postoji' },
        { status: 404 }
      );
    }

    const postData = postDoc.data();

    // Uzmi autora
    const authorDoc = await adminDb
      .collection('users')
      .doc(postData!.authorId)
      .get();
    const authorData = authorDoc.exists ? authorDoc.data() : null;

    // Uzmi destinaciju
    const destDoc = await adminDb
      .collection('destinations')
      .doc(postData!.destinationId)
      .get();
    const destData = destDoc.exists ? destDoc.data() : null;

    // Uzmi prosečnu ocenu destinacije
    let avgRating = destData?.averageRating ?? 0;
    if (destData && !destData.averageRating) {
      const ratingsSnapshot = await adminDb
        .collection('ratings')
        .where('destinationId', '==', postData!.destinationId)
        .get();
      if (!ratingsSnapshot.empty) {
        let total = 0;
        ratingsSnapshot.forEach((doc) => { total += doc.data().score; });
        avgRating = Math.round((total / ratingsSnapshot.size) * 10) / 10;
      }
    }

    // Uzmi komentare
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments: any[] = [];
    commentsSnapshot.forEach((doc) => {
      comments.push({
        commentId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      });
    });

    return NextResponse.json(
      {
        post: {
          postId: postDoc.id,
          ...postData,
          createdAt: postData?.createdAt?.toDate(),
          updatedAt: postData?.updatedAt?.toDate(),
          travelDate: postData?.travelDate?.toDate(),
        },
        author: authorData,
        destination: destData ? { ...destData, averageRating: avgRating } : null,
        comments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju putopisa' },
      { status: 500 }
    );
  }
}

// PUT - Ažuriranje putopisa (već postoji iz prethodnog commit-a)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit provera
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Morate biti prijavljeni' },
        { status: 401 }
      );
    }

    const postId = params.id;
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Putopis ne postoji' },
        { status: 404 }
      );
    }

    const postData = postDoc.data();

    // Proveri autorizaciju (IDOR helper)
    const canEdit = canAccessResource(
      { id: session.user.id, role: session.user.role },
      postData?.authorId,
      { allowEditor: true }
    );

    if (!canEdit) {
      logIDORAttempt(session.user.id, postId, 'post');
      return NextResponse.json(
        { error: 'Nemate dozvolu za izmenu ovog putopisa' },
        { status: 403 }
      );
    }

    // Ažuriraj
    await adminDb
      .collection('posts')
      .doc(postId)
      .update({
        title: sanitizedBody.title,
        content: sanitizedBody.content,
        destinationId: sanitizedBody.destinationId,
        travelDate: new Date(sanitizedBody.travelDate),
        updatedAt: new Date(),
      });

    return NextResponse.json(
      { message: 'Putopis uspešno ažuriran' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju putopisa' },
      { status: 500 }
    );
  }
}

// DELETE - Brisanje putopisa (već postoji)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limit provera
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Morate biti prijavljeni' },
        { status: 401 }
      );
    }

    const postId = params.id;

    const postDoc = await adminDb.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Putopis ne postoji' },
        { status: 404 }
      );
    }

    const postData = postDoc.data();

    // Proveri autorizaciju (IDOR helper — samo autor i admin mogu brisati)
    const canDelete = canAccessResource(
      { id: session.user.id, role: session.user.role },
      postData?.authorId,
      { allowEditor: false }
    );

    if (!canDelete) {
      logIDORAttempt(session.user.id, postId, 'post');
      return NextResponse.json(
        { error: 'Nemate dozvolu za brisanje ovog putopisa' },
        { status: 403 }
      );
    }

    // Obriši post
    await adminDb.collection('posts').doc(postId).delete();

    // Obriši sve komentare
    const commentsSnapshot = await adminDb
      .collection('comments')
      .where('postId', '==', postId)
      .get();

    const batch = adminDb.batch();
    commentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json(
      { message: 'Putopis uspešno obrisan' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju putopisa' },
      { status: 500 }
    );
  }
}