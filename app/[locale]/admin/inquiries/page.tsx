import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
    const t = await getTranslations('Admin');
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fix: join owner profile through venue's owner_id FK, not directly from inquiries
    const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select('*, venues(title, name, owner_id, profiles(full_name, email))')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error loading inquiries: {error.message}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{t('inquiries.title')}</h1>
            </div>

            {/* Inquiries Grid */}
            <div className="grid grid-cols-1 gap-4">
                {inquiries?.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="mb-4 opacity-50 flex justify-center text-4xl">
                            ✉️
                        </div>
                        <p className="text-slate-500">{t('inquiries.no_inquiries')}</p>
                    </div>
                ) : (
                    inquiries?.map((inquiry: any) => {
                        const venueData = Array.isArray(inquiry.venues) ? inquiry.venues[0] : inquiry.venues;
                        const venueName = venueData?.title || venueData?.name || '-';
                        const ownerProfile = venueData?.profiles;
                        const ownerData = Array.isArray(ownerProfile) ? ownerProfile[0] : ownerProfile;

                        return (
                            <div key={inquiry.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col gap-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-900">{inquiry.name}</h3>
                                            <p className="text-sm text-slate-500">{inquiry.email}</p>
                                            {inquiry.phone && <p className="text-sm text-slate-500">{inquiry.phone}</p>}
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(inquiry.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Venue Info */}
                                    {venueData && (
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500">{t('inquiries.fields.venue')}:</p>
                                            <p className="text-sm font-medium text-slate-700">{venueName}</p>
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-700">{inquiry.message}</p>
                                    </div>

                                    {/* Venue Owner Info */}
                                    {ownerData && (
                                        <div className="text-xs text-slate-500">
                                            {t('inquiries.fields.owner')}: {ownerData.full_name} ({ownerData.email})
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
