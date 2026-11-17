import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/sessionToken";

/** App pages require a valid, signed session cookie; anyone else goes to the sign-in page. */
export async function proxy(req: NextRequest) {
  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    const res = NextResponse.redirect(new URL("/Login", req.url));
    if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE); // expired or tampered
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/Notes/:path*", "/Tasks/:path*", "/Alerts/:path*", "/Focus/:path*", "/Records/:path*"],
};
