import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { z } from 'zod';
import { Destination } from '@/lib/types';
import { getDestinationImage } from '@/lib/external/unsplash';
import { geocodeDestination } from '@/lib/external/geocoding';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';

// GET - Lista destinacija
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    let query = adminDb.collection('destinations').orderBy('name', 'asc');

    if (country) {
      query = query.where('country', '==', country) as any;
    }

    const snapshot = await query.get();

    const destinations: Destination[] = [];
    snapshot.forEach((doc) => {
      destinations.push({
        destinationId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Destination);
    });

    return NextResponse.json({ destinations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju destinacija' },
      { status: 500 }
    );
  }
}

import { createDestinationSchema } from '@/lib/validation/schemas';

// POST - Kreiranje nove destinacije

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
    const validatedData = createDestinationSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    // Proveri da li destinacija već postoji
    const existingDestination = await adminDb
      .collection('destinations')
      .where('name', '==', sanitizedData.name)
      .where('country', '==', sanitizedData.country)
      .get();

    if (!existingDestination.empty) {
      return NextResponse.json(
        { error: 'Destinacija već postoji' },
        { status: 400 }
      );
    }

    // Dohvati sliku iz Unsplash-a
    const imageData = await getDestinationImage(
      sanitizedData.name,
      sanitizedData.country
    );

    // Dohvati koordinate
    const coords = await geocodeDestination(
      sanitizedData.name,
      sanitizedData.country
    );

    const destRef = adminDb.collection('destinations').doc();
    const destData = {
      destinationId: destRef.id,
      name: sanitizedData.name,
      country: sanitizedData.country,
      description: sanitizedData.description,
      createdBy: session.user.id,
      averageRating: 0,
      imageURL: imageData?.imageURL || '',
      imageAttribution: imageData?.imageAttribution || '',
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await destRef.set(destData);

    return NextResponse.json(
      {
        message: 'Destinacija uspešno kreirana',
        destination: destData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating destination:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Greška pri kreiranju destinacije' },
      { status: 500 }
    );
  }
}