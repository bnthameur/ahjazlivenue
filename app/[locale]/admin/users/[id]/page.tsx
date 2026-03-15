import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';

import { updateUserStatus, updateReceiptStatus } from '../../actions';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        active: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-orange-100 text-orange-700 border-orange-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
        approved: 'bg-green-100 text-green-700 border-green-200',
        expired: 'bg-slate-100 text-slate-600 border-slate-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function ReceiptStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-orange-100 text-orange-700 border-orange-200',
        approved: 'bg-green-100 text-green-700 border-green-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export default async function AdminUserDetailPage({ params }: PageProps) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (!profile) notFound();

    // Fetch owned venues
    const { data: venues } = await supabase
        .from('venues')
        .select('id, title, name, location, status, images, created_at, is_featured')
        .eq('owner_id', id)
        .order('created_at', { ascending: false });

    // Fetch subscription with plan info
    const { data: subscription } = await supabase
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
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Fetch payment receipts
    const { data: receipts } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

    // Fetch inquiries from both tables for this user's venues
    const venueIds = (venues || []).map(v => v.id);

    let allInquiries: Array<{
        id: string;
        source: string;
        customerName: string;
        message: string;
        venueName: string;
        createdAt: string;
    }> = [];

    if (venueIds.length > 0) {
        const [{ data: inquiriesData }, { data: contactData }] = await Promise.all([
            supabase
                .from('inquiries')
                .select('id, customer_name, name, message, venue_id, created_at')
                .in('venue_id', venueIds)
                .order('created_at', { ascending: false })
                .limit(30),
            supabase
                .from('contact_inquiries')
                .select('id, customer_name, message, venue_id, created_at')
                .in('venue_id', venueIds)
                .order('created_at', { ascending: false })
                .limit(30),
        ]);

        const venueMap: Record<string, string> = {};
        (venues || []).forEach(v => { venueMap[v.id] = v.title || v.name || 'Unknown venue'; });

        allInquiries = [
            ...(inquiriesData || []).map(i => ({
                id: i.id,
                source: 'Platform',
                customerName: i.customer_name || i.name || 'Unknown',
                message: i.message || '',
                venueName: venueMap[i.venue_id] || '—',
                createdAt: i.created_at,
            })),
            ...(contactData || []).map(i => ({
                id: i.id,
                source: 'Direct',
                customerName: i.customer_name || 'Unknown',
                message: i.message || '',
                venueName: venueMap[i.venue_id] || '—',
                createdAt: i.created_at,
            })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const { full_name, email, phone, business_name, business_description, status, role, created_at, avatar_url } = profile;

    const plan = subscription?.subscription_plans as any;

    return (
        <div className="p-4 sm:p-6 max-w-5xl">
            {/* Back navigation */}
            <div className="mb-6">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Users
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {avatar_url ? (
                            <img src={avatar_url} alt={full_name || ''} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
                        ) : (
                            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xl font-bold shrink-0">
                                {full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{full_name || 'Unknown User'}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <StatusBadge status={status} />
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {status !== 'active' && (
                            <form action={updateUserStatus}>
                                <input type="hidden" name="userId" value={id} />
                                <input type="hidden" name="action" value="approve" />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    ✅
                                    Approve Account
                                </button>
                            </form>
                        )}
                        {status !== 'rejected' && (
                            <form action={updateUserStatus}>
                                <input type="hidden" name="userId" value={id} />
                                <input type="hidden" name="action" value="reject" />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    ❌
                                    Reject Account
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile + Venues + Subscription + Receipts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Info */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 font-semibold text-slate-800">
                            👤
                            Profile Information
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Email</p>
                                <p className="font-medium text-slate-900">{email || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Phone</p>
                                <p className="font-medium text-slate-900">{phone || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Business Name</p>
                                <p className="font-medium text-slate-900">{business_name || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Member Since</p>
                                <p className="font-medium text-slate-900">{new Date(created_at).toLocaleDateString()}</p>
                            </div>
                            {business_description && (
                                <div className="col-span-full">
                                    <p className="text-xs text-slate-500 mb-1">Business Description</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{business_description}</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Subscription & Payments */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 font-semibold text-slate-800">
                            💳
                            Subscription &amp; Payments
                        </div>
                        <div className="p-5">
                            {subscription && plan ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Plan</p>
                                        <p className="font-semibold text-slate-900">{plan.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        <StatusBadge status={subscription.status} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Started</p>
                                        <p className="font-medium text-slate-900">
                                            {subscription.started_at ? new Date(subscription.started_at).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Expires</p>
                                        <p className="font-medium text-slate-900">
                                            {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Max Venues</p>
                                        <p className="font-medium text-slate-900">{plan.max_venues ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Monthly Price</p>
                                        <p className="font-medium text-slate-900">
                                            {plan.price_monthly != null ? `${plan.price_monthly.toLocaleString()} DZD` : '—'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-slate-400 text-sm">No active subscription</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Payment Receipts */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                                🧾
                                Payment Receipts
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                {receipts?.length || 0} total
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {!receipts || receipts.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No payment receipts found.</div>
                            ) : (
                                receipts.map(receipt => (
                                    <div key={receipt.id} className="p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Receipt Thumbnail */}
                                            <div className="shrink-0">
                                                {receipt.receipt_url ? (
                                                    <a
                                                        href={receipt.receipt_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:border-primary-400 transition-colors group relative"
                                                    >
                                                        <img
                                                            src={receipt.receipt_url}
                                                            alt="Receipt"
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium">View</span>
                                                        </div>
                                                    </a>
                                                ) : (
                                                    <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl">
                                                        🧾
                                                    </div>
                                                )}
                                            </div>

                                            {/* Receipt Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <ReceiptStatusBadge status={receipt.status} />
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(receipt.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                    <span className="text-slate-900 font-semibold">
                                                        {receipt.amount != null ? `${Number(receipt.amount).toLocaleString()} DZD` : '—'}
                                                    </span>
                                                    {receipt.payment_method && (
                                                        <span className="text-slate-500 capitalize">{receipt.payment_method}</span>
                                                    )}
                                                </div>
                                                {receipt.admin_note && (
                                                    <p className="text-xs text-slate-500 mt-1 italic">Note: {receipt.admin_note}</p>
                                                )}
                                                {receipt.reviewed_at && (
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        Reviewed: {new Date(receipt.reviewed_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {receipt.status === 'pending' && (
                                                <div className="flex gap-2 shrink-0">
                                                    <form action={updateReceiptStatus}>
                                                        <input type="hidden" name="receiptId" value={receipt.id} />
                                                        <input type="hidden" name="action" value="approve" />
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                    </form>
                                                    <form action={updateReceiptStatus}>
                                                        <input type="hidden" name="receiptId" value={receipt.id} />
                                                        <input type="hidden" name="action" value="reject" />
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Venues */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                                🏛️
                                Venues
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{venues?.length || 0} total</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {!venues || venues.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No venues created yet.</div>
                            ) : (
                                venues.map(venue => (
                                    <div key={venue.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                        {venue.images?.[0] ? (
                                            <img src={venue.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                🏛️
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate">{venue.title || venue.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{venue.location}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                venue.status === 'published' ? 'bg-green-100 text-green-700' :
                                                venue.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {venue.status}
                                            </span>
                                            <Link
                                                href={`/admin/venues/${venue.id}`}
                                                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Inquiries */}
                    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                                💬
                                Recent Inquiries
                            </div>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{allInquiries.length} total</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {allInquiries.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">No inquiries received yet.</div>
                            ) : (
                                allInquiries.map(inquiry => (
                                    <div key={`${inquiry.source}-${inquiry.id}`} className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div>
                                                <p className="font-medium text-slate-900">{inquiry.customerName}</p>
                                                <p className="text-xs text-slate-500">For: {inquiry.venueName}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-xs text-slate-400">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{inquiry.source}</span>
                                            </div>
                                        </div>
                                        {inquiry.message && (
                                            <p className="text-sm text-slate-600 line-clamp-2 mt-1">{inquiry.message}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right: Quick stats */}
                <div className="space-y-4">
                    <section className="bg-white rounded-xl border border-slate-200 p-5">
                        <p className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            📈
                            Summary
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Total venues</span>
                                <span className="font-bold text-slate-900">{venues?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Published</span>
                                <span className="font-bold text-green-600">{venues?.filter(v => v.status === 'published').length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Pending</span>
                                <span className="font-bold text-orange-600">{venues?.filter(v => v.status === 'pending').length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500">Total inquiries</span>
                                <span className="font-bold text-slate-900">{allInquiries.length}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Receipts</span>
                                    <span className="font-bold text-slate-900">{receipts?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-orange-600">Pending</span>
                                    <span className="font-semibold text-orange-600">{receipts?.filter(r => r.status === 'pending').length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-green-600">Approved</span>
                                    <span className="font-semibold text-green-600">{receipts?.filter(r => r.status === 'approved').length || 0}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Subscription Quick Info */}
                    {subscription && plan && (
                        <section className="bg-white rounded-xl border border-slate-200 p-5">
                            <p className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                💳
                                Current Plan
                            </p>
                            <div className="text-center p-3 bg-primary-50 rounded-lg">
                                <p className="text-lg font-bold text-primary-700">{plan.name}</p>
                                <StatusBadge status={subscription.status} />
                                {subscription.expires_at && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Expires {new Date(subscription.expires_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
