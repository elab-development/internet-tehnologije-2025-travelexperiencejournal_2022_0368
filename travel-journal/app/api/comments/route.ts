import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { z } from 'zod';
import { Comment } from '@/lib/types';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';

// GET - Komentari za određeni post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId parametar je obavezan' },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')
      .get();

    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      comments.push({
        commentId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Comment);
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju komentara' },
      { status: 500 }
    );
  }
}

import { createCommentSchema } from '@/lib/validation/schemas';

// POST - Kreiranje novog komentara

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    // Proveri da li post postoji
    const postDoc = await adminDb
      .collection('posts')
      .doc(sanitizedData.postId)
      .get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Putopis ne postoji' },
        { status: 400 }
      );
    }

    const commentRef = adminDb.collection('comments').doc();
    const commentData = {
      commentId: commentRef.id,
      postId: sanitizedData.postId,
      authorId: session.user.id,
      content: sanitizedData.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await commentRef.set(commentData);

    return NextResponse.json(
      {
        message: 'Komentar uspešno dodat',
        comment: commentData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating comment:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Greška pri dodavanju komentara' },
      { status: 500 }
    );
  }
}