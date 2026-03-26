'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { SubscriptionRequiredBlock } from '@/app/[locale]/dashboard/DashboardLayout';
import { Emoji } from 'react-apple-emojis';

type VenueCard = {
    id: string;
    name: string | null;
    title?: string | null;
    location?: string | null;
    category?: string | null;
    images?: string[] | null;
    status: string;
    views_count?: number | null;
    inquiries_count?: number | null;
    slug?: string | null;
};

type SubscriptionSummary = {
    id: string;
    status: string | null;
    expires_at?: string | null;
    subscription_plans?: {
        id: string;
        name: string | null;
        max_venues?: number | null;
    } | Array<{
        id: string;
        name: string | null;
        max_venues?: number | null;
    }> | null;
} | null;

const statusColors = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-700',
    archived: 'bg-slate-100 text-slate-500',
    published: 'bg-green-100 text-green-700', // Map published to approved style
};

export default function VenuesPage() {
    const supabase = createClient();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [venues, setVenues] = useState<VenueCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>(searchParams.get('status') || 'all');
    const [subscription, setSubscription] = useState<SubscriptionSummary>(null);
    const [profileStatus, setProfileStatus] = useState<string | null>(null);

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch profile status for second-layer gate check
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('status')
                    .eq('id', user.id)
                    .single();
                setProfileStatus(profileData?.status ?? null);

                const { data: subscriptionData } = await supabase
                    .from('user_subscriptions')
                    .select(`
                        id,
                        status,
                        expires_at,
                        created_at,
                        subscription_plans (
                            id,
                            name,
                            max_venues
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const { data, error } = await supabase
                    .from('venues')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching venues:', error);
                } else {
                    setVenues((data || []) as VenueCard[]);
                }

                setSubscription((subscriptionData as SubscriptionSummary) || null);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        void fetchVenues();
    }, [supabase]);

    const filteredVenues = filter === 'all'
        ? venues
        : venues.filter(v => v.status === filter);
    const plan = Array.isArray(subscription?.subscription_plans)
        ? subscription.subscription_plans[0]
        : subscription?.subscription_plans;
    const subStatus = (subscription?.status || '').toLowerCase();
    const isActiveSub = ['active', 'trial'].includes(subStatus);
    const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
    const hasPaidSubscription = subscription && isActiveSub && !isExpired;
    const maxVenues = typeof plan?.max_venues === 'number' ? plan.max_venues : null;
    const canAddMore = hasPaidSubscription ? (maxVenues == null ? true : venues.length < maxVenues) : false;

    if (loading) {
        return (
            <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    // Second-layer gate: block if profile is not active or no active subscription
    if (profileStatus !== null && profileStatus !== 'active') {
        return <SubscriptionRequiredBlock t={t} />;
    }
    if (!hasPaidSubscription) {
        return <SubscriptionRequiredBlock t={t} />;
    }

    return (
        <div className="p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {t('venues.title')}
                        </h1>
                        <p className="mt-1 text-slate-600">
                            {t('venues.subtitle')}
                        </p>
                    </div>
                    {canAddMore ? (
                        <Link
                            href="/dashboard/venues/new"
                            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('dashboard.btn.add_venue')}
                        </Link>
                    ) : (
                        <span className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium cursor-not-allowed bg-slate-300 text-slate-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('dashboard.btn.add_venue')}
                        </span>
                    )}
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('venues.pages_label')}</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900">{t('venues.pages_title')}</h2>
                        <p className="mt-2 text-sm text-slate-600">{t('venues.pages_desc')}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('venues.plan_capacity')}</p>
                        <p className="mt-1 text-2xl font-bold">{venues.length}{maxVenues == null ? '' : ` / ${maxVenues}`}</p>
                        <p className="mt-2 text-sm text-slate-300">
                            {maxVenues == null
                                ? t('venues.choose_pack')
                                : canAddMore
                                    ? t('venues.can_add_more')
                                    : t('venues.limit_reached')}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {['all', 'approved', 'pending', 'draft', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {t(`status.${status}`)}
                        </button>
                    ))}
                </div>

                {/* Venues Grid */}
                {filteredVenues.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVenues.map((venue) => (
                            <motion.div
                                key={venue.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary-200 hover:shadow-lg transition-all"
                            >
                                {/* Cover Image */}
                                <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
                                    {venue.images && venue.images[0] ? (
                                        <img src={venue.images[0]} alt={venue.title || venue.name || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl opacity-50"><Emoji name="classical-building" width={48} /></span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-900 truncate">{venue.title || venue.name || t('venues.untitled')}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${statusColors[venue.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
                                            {t(`status.${venue.status}`)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
                                        <span className="flex items-center gap-1">
                                            <span><Emoji name="round-pushpin" width={14} /></span> {venue.location || t('venues.no_location')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span><Emoji name="label" width={14} /></span> {venue.category || t('venues.uncategorized')}
                                        </span>
                                    </div>

                                    {venue.status === 'approved' && (
                                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <span><Emoji name="eye" width={14} /></span> {venue.views_count || 0} views
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span><Emoji name="speech-balloon" width={14} /></span> {venue.inquiries_count || 0} inquiries
                                            </span>
                                        </div>
                                    )}

                                    {venue.status === 'pending' && (
                                        <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-700 mb-4 flex items-center gap-1.5">
                                            <Emoji name="hourglass-not-done" width={14} /> {t('venues.under_review')}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/dashboard/venues/${venue.id}`}
                                            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg text-center transition-colors"
                                        >
                                            {t('venues.btn.edit')}
                                        </Link>
                                        {(venue.status === 'approved' || venue.status === 'published') && (
                                            <Link
                                                href={`/venues/${venue.slug || venue.id}`}
                                                target="_blank"
                                                className="px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 text-sm font-medium rounded-lg transition-colors"
                                            >
                                                {t('venues.btn.view')}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
                        <div className="text-5xl mb-4"><Emoji name="classical-building" width={48} /></div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('venues.empty')}</h3>
                        <p className="text-slate-600 mb-6">
                            {filter === 'all'
                                ? t('venues.empty_all')
                                : `${t('venues.empty')} (${t(`status.${filter}`)})`}
                        </p>
                        {filter === 'all' && canAddMore && (
                            <Link
                                href="/dashboard/venues/new"
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                {t('dashboard.btn.add_venue')}
                            </Link>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
