import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const secret =
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

const PUBLIC_PREFIXES = ["/login", "/register", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  const role = (token as { role?: string }).role;

  if (pathname.startsWith("/merchant") && role !== "merchant") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/creator") && role !== "creator") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
