import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllowedRolesForPath } from "@/lib/roles";
import type { AdminRole } from "@/types/admin";

const PUBLIC_PATHS = ["/login"];

const SESSION_COOKIE = "admin_session";
const ROLE_COOKIE = "admin_role";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = getAllowedRolesForPath(pathname);
  if (allowedRoles) {
    const role = request.cookies.get(ROLE_COOKIE)?.value as
      AdminRole | undefined;
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
