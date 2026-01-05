import { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/lib/types";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email i lozinka su obavezni");
        }

        try {
          // Proveri korisnika u Firebase Auth
          const userRecord = await adminAuth.getUserByEmail(
            credentials.email as string
          );

          // Uzmi dodatne podatke iz Firestore
          const userDoc = await adminDb
            .collection("users")
            .doc(userRecord.uid)
            .get();

          if (!userDoc.exists) {
            throw new Error("Korisnik ne postoji u bazi");
          }

          const userData = userDoc.data();

          return {
            id: userRecord.uid,
            email: userRecord.email!,
            name: userData?.displayName || userRecord.displayName,
            role: userData?.role || UserRole.USER,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error("Neispravni kredencijali");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Dodaj role u JWT token
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Dodaj role u session objekat
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dana
  },
  secret: process.env.NEXTAUTH_SECRET,
};