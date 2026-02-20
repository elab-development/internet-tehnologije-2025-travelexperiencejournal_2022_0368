import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { z } from 'zod';
import { Destination } from '@/lib/types';

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

    // Proveri da li destinacija već postoji
    const existingDestination = await adminDb
      .collection('destinations')
      .where('name', '==', validatedData.name)
      .where('country', '==', validatedData.country)
      .get();

    if (!existingDestination.empty) {
      return NextResponse.json(
        { error: 'Destinacija već postoji' },
        { status: 400 }
      );
    }

    const destRef = adminDb.collection('destinations').doc();
    const destData = {
      destinationId: destRef.id,
      name: validatedData.name,
      country: validatedData.country,
      description: validatedData.description,
      createdBy: session.user.id,
      averageRating: 0,
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