import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        loginId: { label: "Login ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { loginId: credentials.loginId },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          loginId: user.loginId,
          email: user.email,
          role: user.role,
          contactId: user.contactId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token["id"] = user.id;
        token["loginId"] = (user as Record<string, unknown>)["loginId"];
        token["role"] = (user as Record<string, unknown>)["role"];
        token["contactId"] = (user as Record<string, unknown>)["contactId"];
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as Record<string, unknown>)["id"] = token["id"];
        (session.user as Record<string, unknown>)["loginId"] = token["loginId"];
        (session.user as Record<string, unknown>)["role"] = token["role"];
        (session.user as Record<string, unknown>)["contactId"] = token["contactId"];
      }
      return session;
    },
  },
};
