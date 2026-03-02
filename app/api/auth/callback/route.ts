import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();
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

                // Detect locale from referer or default to 'fr'
                const locale = 'fr';

                if (profile?.role === 'admin') {
                    return NextResponse.redirect(`${origin}/${locale}/admin`);
                }

                return NextResponse.redirect(`${origin}/${locale}/dashboard`);
            }

            // Fallback: user exists but no profile yet
            return NextResponse.redirect(`${origin}/fr/dashboard`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/fr/login?error=auth_callback_error`);
}
