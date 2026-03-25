import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't need auth
  const publicPaths = ["/login", "/register", "/sign", "/api/auth", "/api/sign"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic || pathname === "/") {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("auth_token")?.value;

  if (!token && pathname.startsWith("/documents")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/documents/:path*", "/api/documents/:path*", "/api/upload/:path*", "/settings/:path*"],
};
