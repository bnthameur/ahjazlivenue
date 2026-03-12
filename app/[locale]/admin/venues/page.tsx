import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminVenuesClient from './AdminVenuesClient';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function AdminVenuesPage({ searchParams }: PageProps) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const resolvedParams = await searchParams;
    const statusFilter = (resolvedParams?.status as string) || 'all';

    const { data: venues, error } = await supabase
        .from('venues')
        .select('*, profiles(full_name, email)')
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
