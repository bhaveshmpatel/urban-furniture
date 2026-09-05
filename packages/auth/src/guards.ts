import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Role } from "@repo/db";
import { authOptions } from "./config.js";

export interface SessionUser {
  id: string;
  loginId: string;
  email: string;
  role: Role;
  contactId?: string | null;
}

export interface AuthenticatedRequest extends NextRequest {
  user: SessionUser;
}

/**
 * Get the current session user from the server session.
 * Returns null if no session exists.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/**
 * Role guard factory. Returns a handler that checks the user's role before proceeding.
 * Usage: export const GET = withRole(['ADMIN', 'ACCOUNTANT'], async (req, user) => { ... });
 */
export function withRole(
  allowedRoles: Role[],
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}

/**
 * Convenience guard for Admin only
 */
export function withAdmin(
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
) {
  return withRole(["ADMIN"], handler);
}

/**
 * Convenience guard for Admin or Accountant
 */
export function withAccountant(
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
) {
  return withRole(["ADMIN", "ACCOUNTANT"], handler);
}

/**
 * Convenience guard for any authenticated user (Admin, Accountant, or Contact)
 */
export function withAuth(
  handler: (req: NextRequest, user: SessionUser) => Promise<NextResponse>
) {
  return withRole(["ADMIN", "ACCOUNTANT", "CONTACT"], handler);
}
