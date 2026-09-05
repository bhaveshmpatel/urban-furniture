import NextAuth from "next-auth";
import { authConfig } from "@repo/auth";

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
