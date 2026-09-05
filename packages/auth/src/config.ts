import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@repo/db";

export const authConfig: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        loginId: { label: "Login ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) return null;
        
        const user = await prisma.user.findFirst({
          where: { loginId: credentials.loginId, isActive: true }
        });
        
        if (!user) return null;
        
        const match = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!match) return null;
        
        return {
          id: user.id,
          name: user.loginId,
          email: user.email,
          role: user.role,
          contactId: user.contactId
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.contactId = (user as any).contactId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).contactId = token.contactId;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }
};
