import { getServerSession } from "next-auth";
import { authConfig } from "./config";

export async function getSession() {
  return await getServerSession(authConfig);
}

export async function withAuth(handler: Function) {
  return async (...args: any[]) => {
    const session = await getSession();
    if (!session || !session.user) {
      throw new Error("Unauthorized");
    }
    return handler(session, ...args);
  };
}

export async function withRole(role: string, handler: Function) {
  return async (...args: any[]) => {
    const session = await getSession();
    if (!session || !session.user || (session.user as any).role !== role) {
      throw new Error("Forbidden");
    }
    return handler(session, ...args);
  };
}

export async function withAdmin(handler: Function) {
  return withRole("ADMIN", handler);
}
