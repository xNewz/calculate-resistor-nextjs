import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development-only-123456";
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });
      session = payload;
    } catch (e) {
      // Token is invalid/expired
    }
  }

  // Paths requiring authentication
  const isProtectedRoute = pathname.startsWith("/classroom");

  // Paths for login/register
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isProtectedRoute && !session) {
    // Redirect to login if trying to access classroom pages without session
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Clear cookie just in case it was invalid
    response.cookies.delete("auth_token");
    return response;
  }

  if (isAuthRoute && session) {
    // Redirect to classroom if already logged in
    return NextResponse.redirect(new URL("/classroom", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/classroom/:path*",
    "/login",
    "/register",
  ],
};
