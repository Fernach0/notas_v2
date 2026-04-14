import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Permitir la página de login sin sesión
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(getRoleHome(session.user.roles), req.url));
    }
    return NextResponse.next();
  }

  // Sin sesión → login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const roles = session.user?.roles ?? [];

  // Proteger rutas por rol
  if (pathname.startsWith('/admin') && !roles.includes(1)) {
    return NextResponse.redirect(new URL(getRoleHome(roles), req.url));
  }
  if (pathname.startsWith('/profesor') && !roles.includes(2)) {
    return NextResponse.redirect(new URL(getRoleHome(roles), req.url));
  }
  if (pathname.startsWith('/estudiante') && !roles.includes(3)) {
    return NextResponse.redirect(new URL(getRoleHome(roles), req.url));
  }

  return NextResponse.next();
});

function getRoleHome(roles: number[]): string {
  if (roles.includes(1)) return '/admin';
  if (roles.includes(2)) return '/profesor';
  if (roles.includes(3)) return '/estudiante';
  return '/login';
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
