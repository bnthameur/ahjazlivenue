import { createClient } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/navigation';
import { VALID_LOCALES } from './i18n/routing';

export async function proxy(request: NextRequest) {
    const handleI18n = createMiddleware(routing);

    const pathname = request.nextUrl.pathname;
    
    // CRITICAL: Check for double locale pattern FIRST (before anything else)
    // Pattern: /xx/yy/... where both xx and yy are valid locales
    const localePattern = new RegExp(`^/(${VALID_LOCALES.join('|')})/(${VALID_LOCALES.join('|')})/?(.*)`);
    const match = pathname.match(localePattern);
    
    if (match) {
        // Double locale detected: /ar/en/dashboard/venues
        // match[1] = first locale (ar), match[2] = second locale (en), match[3] = rest
        const secondLocale = match[2];
        const rest = match[3] || '';
        
        // Redirect to the correct URL with only the second locale
        const correctPath = `/${secondLocale}${rest ? '/' + rest : ''}`;
        const url = new URL(correctPath, request.url);
        
        console.log(`[Proxy] Redirecting double locale: ${pathname} -> ${correctPath}`);
        return NextResponse.redirect(url);
    }
    
    // Check if it's the root path (needs redirection to dashboard)
    const isRootPath = pathname === '/' || routing.locales.some(loc => pathname === `/${loc}`);
    
    // Check if path contains /dashboard or /admin (and handle locale prefix)
    const isProtectedRoute = routing.locales.some(loc =>
        pathname.startsWith(`/${loc}/dashboard`) ||
        pathname.startsWith(`/${loc}/admin`)
    ) || pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

    // Check if it's an auth page
    const isAuthPage = routing.locales.some(loc =>
        pathname === `/${loc}/login` ||
        pathname === `/${loc}/register`
    ) || pathname === '/login' || pathname === '/register';

    // Check auth for protected routes, auth pages, or root path
    if (isProtectedRoute || isAuthPage || isRootPath) {
        const { supabase, response } = createClient(request);
        const { data: { user } } = await supabase.auth.getUser();

        // Handle root path - redirect to dashboard or login
        if (isRootPath) {
            const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
            const url = request.nextUrl.clone();
            
            if (!user) {
                // Not logged in - redirect to login
                url.pathname = `/${locale}/login`;
            } else {
                // Logged in - redirect to dashboard
                url.pathname = `/${locale}/dashboard`;
            }
            return NextResponse.redirect(url);
        }

        if (!user && isProtectedRoute) {
            // Redirect to login (maintaining locale if present, or defaulting)
            const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/login`;
            return NextResponse.redirect(url);
        }

        // Redirect authenticated users from login/register based on their role
        if (user && isAuthPage) {
            const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';

            // Check if user is admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const url = request.nextUrl.clone();
            // Redirect admins to /admin, others to /dashboard
            url.pathname = profile?.role === 'admin'
                ? `/${locale}/admin`
                : `/${locale}/dashboard`;
            return NextResponse.redirect(url);
        }

        // Run i18n middleware and merge Supabase cookies
        const i18nResponse = handleI18n(request);
        const supabaseCookies = response.cookies.getAll();
        supabaseCookies.forEach((cookie) => {
            i18nResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        return i18nResponse;
    }

    // For public routes, just run i18n middleware (no Supabase call)
    return handleI18n(request);
}

export const config = {
    matcher: [
        '/',
        '/(fr|en|ar)/:path*',
        // Enable redirects that add missing locales
        // (e.g. `/pathnames` -> `/en/pathnames`)
        '/((?!api|_next|_vercel|.*\..*).*)'
    ]
};

export default proxy;
