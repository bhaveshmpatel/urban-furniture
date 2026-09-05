import { getServerSession } from "next-auth";
import { authConfig } from "./config";

export async function getSession() {
  return await getServerSession(authConfig);
}

import { NextResponse } from "next/server";

export async function withAuth(handler: Function) {
  return async (...args: any[]) => {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(session, ...args);
  };
}

export async function withRole(role: string, handler: Function) {
  return async (...args: any[]) => {
    const session = await getSession();
    if (!session || !session.user || (session.user as any).role !== role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(session, ...args);
  };
}

export async function withAdmin(handler: Function) {
  return withRole("ADMIN", handler);
}
