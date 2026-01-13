import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { z } from 'zod';
import { Comment } from '@/lib/types';

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

// POST - Kreiranje novog komentara
const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID je obavezan'),
  content: z.string().min(1, 'Sadržaj komentara je obavezan'),
});

export async function POST(request: NextRequest) {
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

    // Proveri da li post postoji
    const postDoc = await adminDb
      .collection('posts')
      .doc(validatedData.postId)
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
      postId: validatedData.postId,
      authorId: session.user.id,
      content: validatedData.content,
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