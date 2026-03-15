import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Link } from '@/i18n/navigation';
import { updateVenueStatus } from '../../actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-orange-100 text-orange-700 border-orange-200',
        approved: 'bg-blue-100 text-blue-700 border-blue-200',
        published: 'bg-green-100 text-green-700 border-green-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export default async function AdminVenueDetailPage({ params }: PageProps) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch venue with owner profile
    const { data: venue } = await supabase
        .from('venues')
        .select('*, profiles(id, full_name, email, phone, business_name, status)')
        .eq('id', id)
        .single();

    if (!venue) notFound();

    // Fetch venue media
    const { data: mediaRows } = await supabase
        .from('venue_media')
        .select('*')
        .eq('venue_id', id)
        .order('display_order', { ascending: true });

    // Fetch inquiries from inquiries table
    const { data: inquiriesData } = await supabase
        .from('inquiries')
        .select('*')
        .eq('venue_id', id)
        .order('created_at', { ascending: false });

    // Fetch inquiries from contact_inquiries table
    const { data: contactInquiriesData } = await supabase
        .from('contact_inquiries')
        .select('*')
        .eq('venue_id', id)
        .order('created_at', { ascending: false });

    // Merge both inquiry sources
    const allInquiries = [
        ...(inquiriesData || []).map(i => ({
            id: i.id,
            source: 'inquiries' as const,
            customerName: i.customer_name || i.name || 'Unknown',
            customerEmail: i.email || null,
            customerPhone: i.customer_phone || i.phone || null,
            eventDate: i.event_date || null,
            eventType: i.event_type || null,
            guestCount: i.guest_count || null,
            message: i.message || '',
            status: i.status || 'new',
            createdAt: i.created_at,
        })),
        ...(contactInquiriesData || []).map(i => ({
            id: i.id,
            source: 'contact_inquiries' as const,
            customerName: i.customer_name || 'Unknown',
            customerEmail: i.customer_email || null,
            customerPhone: i.customer_phone || null,
            eventDate: i.event_date || null,
            eventType: i.event_type || null,
            guestCount: i.guest_count || null,
            message: i.message || '',
            status: i.status || 'new',
            createdAt: i.created_at,
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const owner = Array.isArray(venue.profiles) ? venue.profiles[0] : venue.profiles;

    // Build gallery: prefer venue_media rows, fall back to images array
    const galleryImages: string[] = mediaRows?.length
        ? mediaRows.filter(m => m.media_type === 'image').map(m => m.url)
        : (venue.images || []);

    return (
        <div className="p-4 sm:p-6 max-w-5xl">
            {/* Back + Header */}
            <div className="mb-6">
                <Link
                    href="/admin/venues"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Venues
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{venue.title || venue.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <StatusBadge status={venue.status} />
                            {venue.is_featured && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    ⭐ Featured
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {venue.status !== 'published' && (
                            <form action={updateVenueStatus}>
                                <input type="hidden" name="venueId" value={id} />
                                <input type="hidden" name="action" value="approve" />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    ✅
                                    Approve
                                </button>
                            </form>
                        )}
                        {venue.status !== 'rejected' && (
                            <Link
                                href={`/admin/venues?reject=${id}`}
                                className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                ❌
                                Reject
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Gallery */}
            {galleryImages.length > 0 && (
                <section className="mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {galleryImages.map((img, idx) => (
                            <div key={idx} className={`relative overflow-hidden rounded-xl bg-slate-100 ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
                                <img
                                    src={img}
                                    alt={`${venue.title} - image ${idx + 1}`}
                                    className="w-full h-full object-cover aspect-video"
                                />
                                {idx === 0 && (
                                    <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                        Cover
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column: Venue details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Venue Info */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 font-semibold text-slate-800">
                            🏛️
                            Venue Information
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Location</p>
                                <p className="font-medium text-slate-900">{venue.location || venue.city || venue.wilaya || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Wilaya</p>
                                <p className="font-medium text-slate-900">{venue.wilaya || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Price</p>
                                <p className="font-medium text-slate-900">{venue.price ? `${venue.price.toLocaleString()} DZD` : 'Contact for price'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Capacity</p>
                                <p className="font-medium text-slate-900">{venue.capacity ? `${venue.capacity} guests` : '—'}</p>
                            </div>
                            {venue.phone && (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Phone</p>
                                    <p className="font-medium text-slate-900">{venue.phone}</p>
                                </div>
                            )}
                            {venue.email || venue.contact_email ? (
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Email</p>
                                    <p className="font-medium text-slate-900">{venue.email || venue.contact_email}</p>
                                </div>
                            ) : null}
                            {venue.slug && (
                                <div className="col-span-full">
                                    <p className="text-xs text-slate-500 mb-1">Slug</p>
                                    <p className="font-medium text-slate-900 font-mono text-sm">{venue.slug}</p>
                                </div>
                            )}
                        </div>
                        {venue.description && (
                            <div className="px-5 pb-5">
                                <p className="text-xs text-slate-500 mb-2">Description</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{venue.description}</p>
                            </div>
                        )}
                        {venue.amenities && Array.isArray(venue.amenities) && venue.amenities.length > 0 && (
                            <div className="px-5 pb-5">
                                <p className="text-xs text-slate-500 mb-2">Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                    {venue.amenities.map((a: string) => (
                                        <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {venue.rejection_reason && venue.status === 'rejected' && (
                            <div className="px-5 pb-5">
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    <span className="font-semibold">Rejection Reason: </span>
                                    {venue.rejection_reason}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Inquiries */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                                💬
                                Inquiries
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{allInquiries.length} total</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {allInquiries.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No inquiries for this venue yet.</div>
                            ) : (
                                allInquiries.map(inquiry => (
                                    <div key={`${inquiry.source}-${inquiry.id}`} className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="font-medium text-slate-900">{inquiry.customerName}</p>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                                    {inquiry.customerEmail && <p className="text-xs text-slate-500">{inquiry.customerEmail}</p>}
                                                    {inquiry.customerPhone && <p className="text-xs text-slate-500">{inquiry.customerPhone}</p>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-xs text-slate-400">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{inquiry.source === 'contact_inquiries' ? 'Direct' : 'Platform'}</span>
                                            </div>
                                        </div>
                                        {(inquiry.eventDate || inquiry.eventType || inquiry.guestCount) && (
                                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-2">
                                                {inquiry.eventDate && <p className="text-xs text-slate-500">Date: {new Date(inquiry.eventDate).toLocaleDateString()}</p>}
                                                {inquiry.eventType && <p className="text-xs text-slate-500">Type: {inquiry.eventType}</p>}
                                                {inquiry.guestCount && <p className="text-xs text-slate-500">Guests: {inquiry.guestCount}</p>}
                                            </div>
                                        )}
                                        {inquiry.message && (
                                            <p className="text-sm text-slate-600 line-clamp-3">{inquiry.message}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right column: Owner info */}
                <div className="space-y-4">
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 font-semibold text-slate-800">
                            👤
                            Owner
                        </div>
                        {owner ? (
                            <div className="p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold shrink-0">
                                        {owner.full_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{owner.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">{owner.email}</p>
                                    </div>
                                </div>
                                {owner.phone && (
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <p className="text-sm font-medium text-slate-800">{owner.phone}</p>
                                    </div>
                                )}
                                {owner.business_name && (
                                    <div>
                                        <p className="text-xs text-slate-500">Business</p>
                                        <p className="text-sm font-medium text-slate-800">{owner.business_name}</p>
                                    </div>
                                )}
                                {owner.status && (
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Account Status</p>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            owner.status === 'active' ? 'bg-green-100 text-green-700' :
                                            owner.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}
                                        </span>
                                    </div>
                                )}
                                {owner.id && (
                                    <Link
                                        href={`/admin/users/${owner.id}`}
                                        className="mt-2 w-full block text-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                                    >
                                        View Owner Profile
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="p-5 text-sm text-slate-500">Owner information not available.</div>
                        )}
                    </section>

                    {/* Timestamps */}
                    <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
                            📅
                            Timeline
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Submitted</p>
                            <p className="text-sm font-medium text-slate-800">{new Date(venue.created_at).toLocaleDateString()}</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
