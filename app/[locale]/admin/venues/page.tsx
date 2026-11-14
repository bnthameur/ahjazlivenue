import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminVenuesClient from './AdminVenuesClient';
import { LISTING_CATEGORIES } from '@/lib/listing-types';

const INDIVIDUAL_CATEGORIES = LISTING_CATEGORIES.filter((c) => c.group !== 'venue').map((c) => c.id);

export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function AdminVenuesPage({ searchParams }: PageProps) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const resolvedParams = await searchParams;
    const statusFilter = (resolvedParams?.status as string) || 'all';

    const { data: venues, error } = await supabase
        .from('venues')
        .select('*, profiles(full_name, email, phone)')
        // Individual requests (jobs, DJs, services, rentals) live in /admin/demandes
        .or(`category.is.null,category.not.in.(${INDIVIDUAL_CATEGORIES.join(',')})`)
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
