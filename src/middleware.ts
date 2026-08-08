import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";

// Fast presence check only (Edge runtime). The real signature verification
// happens in the admin layout (Node runtime) which redirects if the token is
// invalid. This just avoids rendering admin pages for logged-out visitors.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const hasCookie = Boolean(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
