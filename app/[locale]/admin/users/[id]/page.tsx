import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import ClientEmoji from '@/components/ClientEmoji';
import { updateUserStatus } from '../../actions';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const userId = params.id;

    // Fetch User Profile with Venues and Inquiries (deep fetching might need separate queries if relationships not perfect)
    // Supabase can do deep joins but RLS must allow it.
    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    // Fetch Venues
    const { data: venues } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

    // Fetch Inquiries for this user's venues
    // We can join through venues
    const { data: venuesWithInquiries } = await supabase
        .from('venues')
        .select('id, title, inquiries(*)')
        .eq('owner_id', userId);

    // Flatten inquiries
    const inquiries = venuesWithInquiries?.flatMap(v =>
        (v.inquiries as any[])?.map(i => ({ ...i, venue_title: v.title }))
    ) || [];

    if (!profile) {
        return <div className="p-8">User not found</div>;
    }

    const { full_name, email, phone, business_name, description, status, role, created_at, avatar_url } = profile;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-900 mb-2 inline-flex items-center gap-1">
                        ← Back to Users
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        {full_name}
                        <span className={`px-2 py-1 rounded-full text-sm font-medium border ${status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {status.toUpperCase()}
                        </span>
                    </h1>
                </div>

                <div className="flex gap-3">
                    {status !== 'active' && (
                        <form action={updateUserStatus}>
                            <input type="hidden" name="userId" value={userId} />
                            <input type="hidden" name="action" value="approve" />
                            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                                Approve Account
                            </button>
                        </form>
                    )}
                    {status !== 'rejected' && (
                        <form action={updateUserStatus}>
                            <input type="hidden" name="userId" value={userId} />
                            <input type="hidden" name="action" value="reject" />
                            <button type="submit" className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                                Reject Account
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 font-medium text-slate-700 flex items-center gap-2">
                    <ClientEmoji name="bust-in-silhouette" width={20} />
                    Profile Information
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <div className="text-sm text-slate-500 mb-1">Email</div>
                        <div className="font-medium text-slate-900">{email}</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 mb-1">Phone</div>
                        <div className="font-medium text-slate-900">{phone || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 mb-1">Joined</div>
                        <div className="font-medium text-slate-900">{new Date(created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 mb-1">Business Name</div>
                        <div className="font-medium text-slate-900">{business_name || 'N/A'}</div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <div className="text-sm text-slate-500 mb-1">About</div>
                        <div className="font-medium text-slate-900">{description || 'No description provided.'}</div>
                    </div>
                </div>
            </div>

            {/* Venues Section */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ClientEmoji name="classical-building" width={24} />
                    Venues ({venues?.length || 0})
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {venues?.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No venues created yet.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {venues?.map(venue => (
                                <div key={venue.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-4">
                                        {venue.images?.[0] ? (
                                            <img src={venue.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">🏠</div>
                                        )}
                                        <div>
                                            <div className="font-semibold text-slate-900">{venue.title}</div>
                                            <div className="text-xs text-slate-500">{venue.location}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${venue.status === 'published' ? 'bg-green-100 text-green-700' :
                                                venue.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {venue.status}
                                        </span>
                                        {/* Simple link to admin venues list - ideally detail view for venue too */}
                                        <Link href={`/admin/venues?search=${venue.title}`} className="text-sm text-primary-600 hover:underline">
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Inquiries Section */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ClientEmoji name="speech-balloon" width={24} />
                    Inquiries ({inquiries?.length || 0})
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {inquiries?.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No inquiries received yet.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {inquiries.map((inquiry: any) => (
                                <div key={inquiry.id} className="p-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase">For: {inquiry.venue_title}</span>
                                        <span className="text-xs text-slate-400">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="font-medium text-slate-900 mb-0.5">{inquiry.customer_name}</div>
                                    <div className="text-slate-600 text-sm line-clamp-2">{inquiry.message}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
