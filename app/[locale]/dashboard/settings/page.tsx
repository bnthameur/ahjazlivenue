import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from './SettingsClient';
import { normalizeSubscriptionSummary } from '@/lib/owner-billing';

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
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
                duration_months,
                max_venues,
                max_images_per_venue,
                max_videos_per_venue
            )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const subscription = normalizeSubscriptionSummary(subscriptionData);

    const [{ data: plans }, { data: receipts }, { data: settingsRows }, { count: venuesCount }] = await Promise.all([
        supabase
            .from('subscription_plans')
            .select('id, name, name_ar, price_monthly, price_yearly, duration_months, max_venues, max_images_per_venue, max_videos_per_venue')
            .order('price_monthly', { ascending: true }),
        supabase
            .from('payment_receipts')
            .select('id, receipt_url, payment_method, amount, status, admin_note, created_at, reviewed_at')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false }),
        supabase.from('platform_settings').select('key, value'),
        supabase
            .from('venues')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user?.id),
    ]);

    return (
        <SettingsClient
            profile={profile}
            subscription={subscription}
            plans={plans || []}
            receipts={receipts || []}
            settings={settingsRows || []}
            usage={{ venuesCount: venuesCount || 0 }}
        />
    );
}
