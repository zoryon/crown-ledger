import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { authReadyMarker, sessionCookieName } from "@/lib/auth-constants";

const publicPaths = new Set(["/login", "/setup"]);

function isAuthReady() {
  return fs.existsSync(path.join(process.cwd(), "data", authReadyMarker));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ready = isAuthReady();
  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);

  if (!ready && pathname !== "/setup") {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (ready && !hasSessionCookie && !publicPaths.has(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
