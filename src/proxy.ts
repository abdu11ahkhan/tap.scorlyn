import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ------------------------------------------------------------------
  // Maintenance mode.
  //
  // Public cards are deliberately exempt. Someone tapping a physical card in
  // a meeting should never hit a maintenance page — the card is the product,
  // and the owner can't explain away a dead tap. Admins get through so they
  // can turn it back off.
  // ------------------------------------------------------------------
  const path = request.nextUrl.pathname
  const exempt =
    path.startsWith('/u/') ||
    path.startsWith('/api/') ||
    path.startsWith('/maintenance') ||
    path.startsWith('/login') ||
    path.startsWith('/admin') ||
    path.startsWith('/_next')

  if (!exempt) {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('maintenance_mode')
      .maybeSingle()

    if (settings?.maintenance_mode) {
      let isAdmin = false
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()
        isAdmin = Boolean(profile?.is_admin)
      }

      if (!isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/maintenance'
        url.search = ''
        return NextResponse.rewrite(url)
      }
    }
  }

  // Protected routes logic
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    // Remember where they were headed (e.g. /dashboard/card?template=bold) so
    // logging in resumes the action instead of dumping them on the dashboard.
    const next = request.nextUrl.pathname + request.nextUrl.search
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(url)
  }

  // Redirect signed-in users away from auth pages
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    const next = request.nextUrl.searchParams.get('next')
    // Only same-origin relative paths — never let ?next= bounce to another host.
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    const [nextPath, nextSearch] = safeNext.split('?')
    url.pathname = nextPath
    url.search = nextSearch ? `?${nextSearch}` : ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
