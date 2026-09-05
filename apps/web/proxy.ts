import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate Limiting for auth routes
    if (path.startsWith("/api/auth")) {
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const limit = 5; // 5 requests per minute

      let rateData = rateLimitMap.get(ip);
      if (!rateData || rateData.resetTime < now) {
        rateData = { count: 1, resetTime: now + windowMs };
        rateLimitMap.set(ip, rateData);
      } else {
        rateData.count++;
        if (rateData.count > limit) {
          return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
        }
      }
    }

    // If the user is a CONTACT role, restrict access to only portal routes
    if (role === "CONTACT") {
      if (
        !path.startsWith("/portal") && 
        !path.startsWith("/api/portal") &&
        !path.startsWith("/api/auth") &&
        path !== "/"
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // If the user is ACCOUNTANT or ADMIN, they probably shouldn't see portal (optional, but let's allow it or just ignore)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - signup (signup page)
     * - exactly / (landing page)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|signup|$).*)",
  ],
};
