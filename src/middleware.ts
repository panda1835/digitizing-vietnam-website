import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Any host whose first label is "admin" — covers the prod admin subdomain
// (admin.digitizingvietnam.com) plus a local-dev alias like admin.localhost
// (set up in /etc/hosts or Windows hosts file). Vercel preview deploys do
// not route an "admin.*" hostname by default, so previews behave as the
// public host: /admin paths return 404 in production builds.
function isAdminHost(host: string): boolean {
  return host.startsWith("admin.");
}

export default function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  if (isAdminHost(host)) {
    // Admin subdomain. Every page request resolves under /en/admin/*.
    // Strip a leading locale ("/en", "/vi") and any redundant "/admin"
    // so all of these map to the same target:
    //   admin.host.com/                       → /en/admin
    //   admin.host.com/admin                  → /en/admin
    //   admin.host.com/ocr/test               → /en/admin/ocr/test
    //   admin.host.com/admin/ocr/test         → /en/admin/ocr/test
    //   admin.host.com/en/admin/ocr/test      → /en/admin/ocr/test (no-op)
    const stripped = pathname
      .replace(/^\/(en|vi)(?=\/|$)/, "")
      .replace(/^\/admin(?=\/|$)/, "");
    const target = `/en/admin${stripped}`.replace(/\/+$/, "") || "/en/admin";
    if (target !== pathname) {
      const url = req.nextUrl.clone();
      url.pathname = target;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Non-admin host: in production, refuse any path that points at admin so
  // a leaked URL just 404s. Skipped in dev so localhost can serve admin
  // pages directly without setting up an admin.* alias.
  if (
    process.env.NODE_ENV === "production" &&
    (pathname.startsWith("/admin") || /^\/(en|vi)\/admin(\/|$)/.test(pathname))
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return intlMiddleware(req);
}

export const config = {
  // Match only internationalized pathnames
  // matcher: ["/", "/(vi|en)/:path*"],
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  localeDetection: true,
};
