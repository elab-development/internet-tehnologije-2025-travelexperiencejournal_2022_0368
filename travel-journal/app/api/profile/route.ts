import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';
import { updateProfileSchema } from '@/lib/validation/schemas';
import { sanitizeObject } from '@/lib/security/sanitize';
import { checkRateLimit } from '@/lib/security/withRateLimit';
import { mutationLimiter } from '@/lib/security/rateLimiter';

export async function PUT(request: NextRequest) {
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
    const validatedData = updateProfileSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    // Ažuriraj dokument u Firestore
    await adminDb
      .collection('users')
      .doc(session.user.id)
      .update({
        displayName: sanitizedData.displayName,
        bio: sanitizedData.bio || '',
        profilePhotoURL: sanitizedData.profilePhotoURL || '',
        updatedAt: new Date(),
      });

    return NextResponse.json(
      { message: 'Profil uspešno ažuriran' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating profile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Greška pri ažuriranju profila' },
      { status: 500 }
    );
  }
}