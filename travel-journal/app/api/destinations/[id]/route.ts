import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { z } from 'zod';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';
import { canAccessResource, logIDORAttempt } from '@/lib/security/idor';
import { createDestinationSchema } from '@/lib/validation/schemas';

// GET - Detalji destinacije (javno)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const destDoc = await adminDb.collection('destinations').doc(params.id).get();
    if (!destDoc.exists) {
      return NextResponse.json({ error: 'Destinacija ne postoji' }, { status: 404 });
    }

    const data = destDoc.data();
    return NextResponse.json({
      destination: {
        destinationId: destDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching destination:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju destinacije' }, { status: 500 });
  }
}

// PUT - Izmena destinacije (vlasnik, editor, admin)
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

    const destDoc = await adminDb.collection('destinations').doc(params.id).get();
    if (!destDoc.exists) {
      return NextResponse.json({ error: 'Destinacija ne postoji' }, { status: 404 });
    }

    const canEdit = canAccessResource(
      { id: session.user.id, role: session.user.role },
      destDoc.data()?.createdBy,
      { allowEditor: true }
    );
    if (!canEdit) {
      logIDORAttempt(session.user.id, params.id, 'destination');
      return NextResponse.json({ error: 'Nemate dozvolu za izmenu ove destinacije' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createDestinationSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    await adminDb.collection('destinations').doc(params.id).update({
      name: sanitizedData.name,
      country: sanitizedData.country,
      description: sanitizedData.description,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Destinacija uspešno ažurirana' }, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error updating destination:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju destinacije' }, { status: 500 });
  }
}

// DELETE - Brisanje destinacije (vlasnik ili admin; ne editor)
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

    const destDoc = await adminDb.collection('destinations').doc(params.id).get();
    if (!destDoc.exists) {
      return NextResponse.json({ error: 'Destinacija ne postoji' }, { status: 404 });
    }

    // Editor ne može brisati destinacije (allowEditor: false)
    const canDelete = canAccessResource(
      { id: session.user.id, role: session.user.role },
      destDoc.data()?.createdBy,
      { allowEditor: false }
    );
    if (!canDelete) {
      logIDORAttempt(session.user.id, params.id, 'destination');
      return NextResponse.json({ error: 'Nemate dozvolu za brisanje ove destinacije' }, { status: 403 });
    }

    await adminDb.collection('destinations').doc(params.id).delete();

    return NextResponse.json({ message: 'Destinacija uspešno obrisana' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting destination:', error);
    return NextResponse.json({ error: 'Greška pri brisanju destinacije' }, { status: 500 });
  }
}
