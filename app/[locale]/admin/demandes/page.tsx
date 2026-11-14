import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { LISTING_CATEGORIES } from '@/lib/listing-types';
import AdminRequestsClient, { type ListingRequest, type IndividualPlan } from './AdminRequestsClient';

export const dynamic = 'force-dynamic';

// Individual listings only — halls stay in /admin/venues
const INDIVIDUAL_CATEGORIES = LISTING_CATEGORIES.filter((c) => c.group !== 'venue').map((c) => c.id);

export default async function AdminRequestsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const [{ data: requests, error }, { data: plans }] = await Promise.all([
        supabase
            .from('venues')
            .select('id, slug, title, name, description, category, wilaya, city, address, latitude, longitude, phone, whatsapp, website, instagram_url, facebook_url, tiktok_url, images, price, status, rejection_reason, created_at, plan_id, payment_receipt_url, listing_expires_at, submitted_via')
            .in('category', INDIVIDUAL_CATEGORIES)
            .order('created_at', { ascending: false }),
        supabase
            .from('subscription_plans')
            .select('id, name, name_ar, name_fr, price_monthly, duration_months, is_active')
            .eq('audience', 'individual')
            .order('price_monthly', { ascending: true }),
    ]);

    if (error) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error loading requests: {error.message}</div>;
    }

    return (
        <AdminRequestsClient
            initialRequests={(requests || []) as ListingRequest[]}
            plans={(plans || []) as IndividualPlan[]}
        />
    );
}
