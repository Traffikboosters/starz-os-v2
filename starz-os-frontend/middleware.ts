import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const publicPaths = ['/login'];
  const isPublic = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && request.nextUrl.pathname === '/login') {
    const { data: role, error: rpcError } = await supabase
      .rpc('get_user_role', { p_email: user.email });

    console.log('[middleware] user:', user.email, 'role:', role, 'error:', rpcError?.message);

    if (role === 'sales_rep') {
      return NextResponse.redirect(new URL('/portal/rep', request.url));
    }
    if (role === 'sales_contractor') {
      return NextResponse.redirect(new URL('/portal/contractor', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/portal/rep') && user) {
    const { data: role } = await supabase.rpc('get_user_role', { p_email: user.email });
    if (!['sales_rep', 'sales_manager', 'admin', 'owner'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith('/portal/contractor') && user) {
    const { data: role } = await supabase.rpc('get_user_role', { p_email: user.email });
    if (!['sales_contractor', 'sales_manager', 'admin', 'owner'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};