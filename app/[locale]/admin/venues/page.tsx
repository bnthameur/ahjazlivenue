import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminVenuesClient from './AdminVenuesClient';

export const dynamic = 'force-dynamic';

export default async function AdminVenuesPage({ searchParams }: { searchParams: { status?: string } }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const statusFilter = searchParams.status || 'pending';

    const { data: venues, error } = await supabase
        .from('venues')
        .select('*, profiles(full_name, email)')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error loading venues: {error.message}
            </div>
        );
    }

    return <AdminVenuesClient initialVenues={venues || []} statusFilter={statusFilter} />;
}
