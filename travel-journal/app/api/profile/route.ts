import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';
import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Ime mora imati najmanje 2 karaktera'),
  bio: z.string().optional(),
  profilePhotoURL: z.string().url().optional().or(z.literal('')),
});

export async function PUT(request: NextRequest) {
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

    // Ažuriraj dokument u Firestore
    await adminDb
      .collection('users')
      .doc(session.user.id)
      .update({
        displayName: validatedData.displayName,
        bio: validatedData.bio || '',
        profilePhotoURL: validatedData.profilePhotoURL || '',
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