import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Auth middleware will be handled client-side
  // This is a placeholder for future server-side auth checks
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/stream/:path*'],
};

