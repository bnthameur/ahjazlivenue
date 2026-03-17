import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import { normalizeSubscriptionSummary } from '@/lib/owner-billing';

export default async function Layout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select(`
            id,
            status,
            started_at,
            expires_at,
            created_at,
            subscription_plans (
                id,
                name,
                name_ar,
                price_monthly,
                price_yearly,
                max_venues,
                max_images_per_venue,
                max_videos_per_venue
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const subscription = normalizeSubscriptionSummary(subscriptionData);

    return (
        <DashboardLayout
            user={user}
            profile={profile}
            subscription={subscription}
        >
            {children}
        </DashboardLayout>
    );
}
