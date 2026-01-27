import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/lib/types";

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userRecord = await adminAuth.getUserByEmail(
            credentials.email as string
          );

          const userDoc = await adminDb
            .collection("users")
            .doc(userRecord.uid)
            .get();

          if (!userDoc.exists) {
            return null;
          }

          const userData = userDoc.data();

          return {
            id: userRecord.uid,
            email: userRecord.email!,
            name: userData?.displayName || userRecord.displayName || '',
            role: userData?.role || UserRole.USER,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};