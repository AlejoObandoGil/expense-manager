import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Single point of the app that refreshes the Supabase session token and
 * decides route-level session requirements. Redirects to `/login` whenever
 * there is no valid session, on every route except the ones excluded by
 * `config.matcher` below (Next.js internal assets and `/login` itself).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let hasUser = false;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasUser = user !== null;
  } catch {
    // Supabase Auth outage/network error: treat exactly like "no session"
    // instead of letting an unhandled exception take down the route.
    hasUser = false;
  }

  if (!hasUser) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl, 307);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth entry point; excluded to avoid a redirect loop before
     *   there is a session to protect it with)
     */
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
};
