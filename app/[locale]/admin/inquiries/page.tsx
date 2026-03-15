import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminInquiriesClient, { type UnifiedInquiry } from './AdminInquiriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch from inquiries table (joined with venue + owner)
    const { data: inquiriesData } = await supabase
        .from('inquiries')
        .select('*, venues(id, title, name, owner_id, profiles(full_name, email))')
        .order('created_at', { ascending: false })
        .limit(200);

    // Fetch from contact_inquiries table (joined with venue + owner)
    const { data: contactInquiriesData } = await supabase
        .from('contact_inquiries')
        .select('*, venues(id, title, name, owner_id, profiles(full_name, email))')
        .order('created_at', { ascending: false })
        .limit(200);

    // Normalize inquiries
    const normalizeVenue = (venueRaw: any) => {
        const venue = Array.isArray(venueRaw) ? venueRaw[0] : venueRaw;
        if (!venue) return { venueId: null, venueName: 'Unknown venue', ownerName: null, ownerEmail: null };
        const profiles = Array.isArray(venue.profiles) ? venue.profiles[0] : venue.profiles;
        return {
            venueId: venue.id || null,
            venueName: venue.title || venue.name || 'Unknown venue',
            ownerName: profiles?.full_name || null,
            ownerEmail: profiles?.email || null,
        };
    };

    const platformInquiries: UnifiedInquiry[] = (inquiriesData || []).map(i => {
        const v = normalizeVenue(i.venues);
        return {
            id: i.id,
            source: 'platform',
            customerName: i.customer_name || i.name || 'Unknown',
            customerEmail: i.email || null,
            customerPhone: i.customer_phone || i.phone || null,
            message: i.message || '',
            eventDate: i.event_date || null,
            eventType: i.event_type || null,
            guestCount: i.guest_count || null,
            status: i.status || 'new',
            createdAt: i.created_at,
            ...v,
        };
    });

    const directInquiries: UnifiedInquiry[] = (contactInquiriesData || []).map(i => {
        const v = normalizeVenue(i.venues);
        return {
            id: i.id,
            source: 'direct',
            customerName: i.customer_name || 'Unknown',
            customerEmail: i.customer_email || null,
            customerPhone: i.customer_phone || null,
            message: i.message || '',
            eventDate: i.event_date || null,
            eventType: i.event_type || null,
            guestCount: i.guest_count || null,
            status: i.status || 'new',
            createdAt: i.created_at,
            ...v,
        };
    });

    const allInquiries = [...platformInquiries, ...directInquiries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="p-4 sm:p-6">
            <AdminInquiriesClient inquiries={allInquiries} />
        </div>
    );
}
