import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminSettingsClient from './AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch platform settings
    const { data: settingsRows } = await supabase
        .from('platform_settings')
        .select('key, value');

    // Fetch published venues for featured toggle
    const { data: venuesData } = await supabase
        .from('venues')
        .select('id, title, name, location, images, is_featured, status')
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

    // Fetch platform stats
    const [
        { count: totalVenues },
        { count: publishedVenues },
        { count: pendingVenues },
        { count: totalUsers },
        { count: activeUsers },
        { count: totalInquiries },
    ] = await Promise.all([
        supabase.from('venues').select('*', { count: 'exact', head: true }),
        supabase.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'venue_owner'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'venue_owner').eq('status', 'active'),
        supabase.from('contact_inquiries').select('*', { count: 'exact', head: true }),
    ]);

    return (
        <AdminSettingsClient
            settings={settingsRows || []}
            venues={venuesData || []}
            stats={{
                totalVenues: totalVenues || 0,
                publishedVenues: publishedVenues || 0,
                pendingVenues: pendingVenues || 0,
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalInquiries: totalInquiries || 0,
            }}
        />
    );
}
