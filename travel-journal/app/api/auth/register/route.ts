import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/lib/types";
import { z } from "zod";
import { registerSchema } from "@/lib/validation/schemas";
import { sanitizeObject } from "@/lib/security/sanitize";
import { checkRateLimit } from "@/lib/security/withRateLimit";
import { authLimiter } from "@/lib/security/rateLimiter";

export async function POST(request: NextRequest) {
  // Rate limit provera
  const rateLimitResponse = await checkRateLimit(request, authLimiter);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Parse i validiraj body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const sanitizedData = sanitizeObject(validatedData);

    // Proveri da li korisnik već postoji
    try {
      await adminAuth.getUserByEmail(sanitizedData.email);
      return NextResponse.json(
        { error: "Korisnik sa ovom email adresom već postoji" },
        { status: 400 }
      );
    } catch (error: any) {
      // Ako korisnik ne postoji, nastavi sa registracijom
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Kreiraj korisnika u Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: sanitizedData.email,
      password: sanitizedData.password,
      displayName: sanitizedData.displayName,
    });

    // Kreiraj dokument u Firestore
    const userData = {
      uid: userRecord.uid,
      email: sanitizedData.email,
      displayName: sanitizedData.displayName,
      bio: "",
      profilePhotoURL: "",
      role: UserRole.USER, // Default role
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userData);

    return NextResponse.json(
      {
        message: "Korisnik uspešno registrovan",
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: sanitizedData.displayName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Zod validacione greške
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Firebase greške
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Email adresa je već u upotrebi" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Greška pri registraciji korisnika" },
      { status: 500 }
    );
  }
}