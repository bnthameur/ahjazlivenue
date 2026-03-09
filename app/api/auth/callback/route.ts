import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { detectPreferredLocale } from '@/i18n/locale-utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const cookieStore = await cookies();
    const locale = detectPreferredLocale({
        cookieLocale: cookieStore.get('NEXT_LOCALE')?.value,
        referer: request.headers.get('referer'),
        acceptLanguage: request.headers.get('accept-language')
    });

    if (code) {
        const supabase = createClient(cookieStore);
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Get user and check role for redirect
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const appOrigin = 'https://app.ahjazliqaati.com';

                if (profile?.role === 'admin') {
                    return NextResponse.redirect(`${appOrigin}/${locale}/admin`);
                }

                return NextResponse.redirect(`${appOrigin}/${locale}/dashboard`);
            }

            // Fallback: user exists but no profile yet
            return NextResponse.redirect(`https://app.ahjazliqaati.com/${locale}/dashboard`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`https://app.ahjazliqaati.com/${locale}/login?error=auth_callback_error`);
}
