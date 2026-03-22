import { NextRequest, NextResponse } from 'next/server';
  
export async function proxy(req: NextRequest) {
  // Allow direct access in local development while dashboard UI is being built.
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const isAuthenticated = req.cookies.get('auth')?.value === '1';

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/Notes/:path*', '/Tasks/:path*'],
};