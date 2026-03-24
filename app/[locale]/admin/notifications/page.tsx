import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import AdminNotificationsClient from './AdminNotificationsClient';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const t = await getTranslations('Admin');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch all venue-owner profiles for targeting
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status')
        .neq('role', 'admin')
        .order('full_name', { ascending: true });

    // Fetch the 50 most recent notifications sent by this admin
    const { data: rawSent } = await supabase
        .from('notifications')
        .select('id, title, message, type, created_at, is_read, recipient_id, profiles!notifications_recipient_id_fkey(full_name, email)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    // Supabase returns the join result as an array; normalise to single object or null
    const sentNotifications = (rawSent ?? []).map(n => {
        const profilesRaw = n.profiles;
        const profile = Array.isArray(profilesRaw) ? (profilesRaw[0] ?? null) : (profilesRaw ?? null);
        return {
            ...n,
            profiles: profile as { full_name: string | null; email: string | null } | null,
        };
    });

    return (
        <AdminNotificationsClient
            users={users ?? []}
            sentNotifications={sentNotifications}
            pageTitle={t('nav.notifications')}
        />
    );
}
