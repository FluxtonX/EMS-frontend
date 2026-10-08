import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that never require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/activate-invite',
];

// Routes strictly restricted for OPERATOR / SUPERVISOR
const OPERATOR_RESTRICTED_PATHS = [
  '/team',
  '/jobs',
  '/payroll',
  '/clients',
  '/compliance',
  '/leave',
  '/reports',
  '/audit',
  '/timesheets',
];

// Routes strictly restricted for MANAGER
const MANAGER_RESTRICTED_PATHS = [
  '/team',
  '/payroll',
  '/clients',
  '/audit',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public paths without check
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`))
  );

  const token = req.cookies.get('workforce_auth_token')?.value;
  const rawRole = req.cookies.get('workforce_auth_role')?.value || '';
  const role = rawRole.toLowerCase().trim();

  // If visiting login or register while already authenticated
  if (token && (pathname === '/login' || pathname === '/register')) {
    const destination = role === 'employee' ? '/employee/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // If public route, allow immediately
  if (isPublic) {
    return NextResponse.next();
  }

  // 2. Unauthenticated check for all protected routes
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Employee Portal Route Guard (e.g. /employee/dashboard, /employee/profile, but NOT /employees)
  const isEmployeePortalRoute = pathname === '/employee' || pathname.startsWith('/employee/');
  if (isEmployeePortalRoute) {
    // If not employee role, redirect to main portal
    if (role && role !== 'employee') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 4. Company Portal Route Guards for Employee role
  if (role === 'employee') {
    return NextResponse.redirect(new URL('/employee/dashboard', req.url));
  }

  // 5. Operator / Supervisor Role Restrictions
  if (role === 'operator' || role === 'supervisor') {
    const isRestricted = OPERATOR_RESTRICTED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isRestricted) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
    }
  }

  // 6. Manager Role Restrictions
  if (role === 'manager') {
    const isRestricted = MANAGER_RESTRICTED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (isRestricted) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and static assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
