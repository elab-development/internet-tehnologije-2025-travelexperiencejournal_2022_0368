import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { ratingSchema } from '@/lib/validation/schemas';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';

// GET - Ocene za destinaciju
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const destinationId = searchParams.get('destinationId');

    if (!destinationId) {
      return NextResponse.json(
        { error: 'destinationId je obavezan parametar' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authConfig);

    const ratingsSnapshot = await adminDb
      .collection('ratings')
      .where('destinationId', '==', destinationId)
      .get();

    const ratings: any[] = [];
    let total = 0;
    let userRating: number | null = null;

    ratingsSnapshot.forEach((doc) => {
      const data = doc.data();
      ratings.push({
        ratingId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
      total += data.score;
      if (session?.user?.id && data.userId === session.user.id) {
        userRating = data.score;
      }
    });

    const averageRating =
      ratings.length > 0 ? Math.round((total / ratings.length) * 10) / 10 : 0;

    return NextResponse.json(
      {
        ratings,
        averageRating,
        totalRatings: ratings.length,
        userRating,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju ocena' },
      { status: 500 }
    );
  }
}

// POST - Oceni destinaciju (kreiraj ili ažuriraj)
export async function POST(request: NextRequest) {
  // Rate limit provera
  const rateLimitResponse = await checkRateLimit(request, mutationLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Morate biti prijavljeni da biste ocenili destinaciju' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nevalidni podaci', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { destinationId, score } = parsed.data;

    // Proveri da destinacija postoji
    const destDoc = await adminDb
      .collection('destinations')
      .doc(destinationId)
      .get();

    if (!destDoc.exists) {
      return NextResponse.json(
        { error: 'Destinacija ne postoji' },
        { status: 404 }
      );
    }

    const userId = session.user.id;
    const now = new Date();

    // Proveri da li korisnik već ima ocenu za ovu destinaciju
    const existingSnapshot = await adminDb
      .collection('ratings')
      .where('destinationId', '==', destinationId)
      .where('userId', '==', userId)
      .get();

    if (!existingSnapshot.empty) {
      // Ažuriraj postojeću ocenu
      const existingDoc = existingSnapshot.docs[0];
      await existingDoc.ref.update({ score, updatedAt: now });
    } else {
      // Kreiraj novu ocenu
      await adminDb.collection('ratings').add({
        destinationId,
        userId,
        score,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Preračunaj prosečnu ocenu i ažuriraj destinaciju
    const allRatingsSnapshot = await adminDb
      .collection('ratings')
      .where('destinationId', '==', destinationId)
      .get();

    let total = 0;
    allRatingsSnapshot.forEach((doc) => {
      total += doc.data().score;
    });

    const averageRating =
      allRatingsSnapshot.size > 0
        ? Math.round((total / allRatingsSnapshot.size) * 10) / 10
        : 0;

    await adminDb.collection('destinations').doc(destinationId).update({
      averageRating,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: 'Ocena uspešno sačuvana',
        averageRating,
        totalRatings: allRatingsSnapshot.size,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Greška pri čuvanju ocene' },
      { status: 500 }
    );
  }
}
