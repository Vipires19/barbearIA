import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isInternalRole } from "@/lib/auth-constants";

const PROTECTED_PREFIX = "/dashboard";
const AUTH_ROUTES = ["/login"];
const PUBLIC_PREFIXES = ["/services", "/my-appointments", "/booking"];

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  response.cookies.delete("user_role");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublic = isPublicRoute(pathname);
  const hasInternalSession = Boolean(accessToken && isInternalRole(userRole));
  const hasStaleAuth = Boolean(accessToken && !isInternalRole(userRole));

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic && hasStaleAuth) {
    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  if (isPublic) {
    if (pathname === "/" && hasInternalSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isProtected) {
    if (!accessToken || !isInternalRole(userRole)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      if (accessToken) clearAuthCookies(response);
      return response;
    }
    return NextResponse.next();
  }

  if (isAuthRoute && hasInternalSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (hasStaleAuth) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
