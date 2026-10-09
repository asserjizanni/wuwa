import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle root /control-center
  if (pathname === '/control-center' || pathname === '/control-center/') {
    const sessionCookie = request.cookies.get('ww_admin_session')
    const target = sessionCookie?.value ? '/control-center/dashboard' : '/control-center/login'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // Already logged in visiting /control-center/login -> redirect to dashboard
  if (pathname === '/control-center/login') {
    const sessionCookie = request.cookies.get('ww_admin_session')
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL('/control-center/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protect all other control-center dashboard pages
  if (pathname.startsWith('/control-center')) {
    const sessionCookie = request.cookies.get('ww_admin_session')
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/control-center/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/control-center', '/control-center/:path*'],
}
