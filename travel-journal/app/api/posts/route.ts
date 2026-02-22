import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Post } from '@/lib/types';

import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { z } from 'zod';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const destinationId = searchParams.get('destinationId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = adminDb.collection('posts').orderBy('createdAt', 'desc');

    // Filter po autoru
    if (authorId) {
      query = query.where('authorId', '==', authorId) as any;
    }

    // Filter po destinaciji
    if (destinationId) {
      query = query.where('destinationId', '==', destinationId) as any;
    }

    // Limit rezultata
    query = query.limit(limit) as any;

    const snapshot = await query.get();

    const posts: Post[] = [];
    snapshot.forEach((doc) => {
      posts.push({
        postId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        travelDate: doc.data().travelDate?.toDate(),
      } as Post);
    });

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju putopisa' },
      { status: 500 }
    );
  }
}



import { createPostSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  // Rate limit provera
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Proveri autentifikaciju
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Morate biti prijavljeni' },
        { status: 401 }
      );
    }

    // Parse i validiraj body
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    // Proveri da li destinacija postoji
    const destinationDoc = await adminDb
      .collection('destinations')
      .doc(sanitizedData.destinationId)
      .get();

    if (!destinationDoc.exists) {
      return NextResponse.json(
        { error: 'Destinacija ne postoji' },
        { status: 400 }
      );
    }

    // Kreiraj novi putopis
    const postRef = adminDb.collection('posts').doc();
    const postData = {
      postId: postRef.id,
      title: sanitizedData.title,
      content: sanitizedData.content,
      authorId: session.user.id,
      destinationId: sanitizedData.destinationId,
      travelDate: new Date(sanitizedData.travelDate),
      isPublished: sanitizedData.isPublished ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await postRef.set(postData);

    return NextResponse.json(
      {
        message: 'Putopis uspešno kreiran',
        post: { ...postData, postId: postRef.id },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating post:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Greška pri kreiranju putopisa' },
      { status: 500 }
    );
  }
}