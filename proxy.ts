import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected route prefixes
const protectedPrefixes = ["/dashboard", "/settings"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    // TODO: Replace with real auth check (e.g. session token / cookie)
    // const session = request.cookies.get("session");
    // if (!session) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
