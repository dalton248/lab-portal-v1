import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname (e.g., labopsdental.com, labopsdentallab.com, localhost:3000)
  const hostname = req.headers.get('host') || '';

  // Define the Doctor domains (including localhost for testing)
  const doctorDomains = [
    'labopsdentallab.com',
    'doctor.localhost:3000',
    'doctor.localhost'
  ];

  // If the hostname is one of the doctor domains, rewrite the request to the /doctor path
  if (doctorDomains.some(domain => hostname.includes(domain))) {
    // Only rewrite the root path to the Doctor landing page
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL(`/doctor`, req.url));
    }
    // Allow other routes like /login and /dashboard to pass through to the main shared app routes
  }

  // Otherwise, allow the request to proceed normally to the Lab Owner side
  return NextResponse.next();
}
