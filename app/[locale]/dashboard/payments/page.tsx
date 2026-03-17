import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PaymentsClient from './PaymentsClient';
import { normalizeSubscriptionSummary } from '@/lib/owner-billing';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const [{ data: profile }, { data: plans }, { data: subscriptionData }, { data: receipts }, { data: settingsRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
            .from('subscription_plans')
            .select('id, name, name_ar, price_monthly, price_yearly, max_venues, max_images_per_venue, max_videos_per_venue')
            .order('price_monthly', { ascending: true }),
        supabase
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
            .maybeSingle(),
        supabase
            .from('payment_receipts')
            .select('id, receipt_url, payment_method, amount, status, admin_note, created_at, reviewed_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        supabase.from('platform_settings').select('key, value'),
    ]);

    const subscription = normalizeSubscriptionSummary(subscriptionData);

    return (
        <PaymentsClient
            userId={user.id}
            profile={profile}
            plans={plans || []}
            subscription={subscription}
            receipts={receipts || []}
            settings={settingsRows || []}
        />
    );
}
