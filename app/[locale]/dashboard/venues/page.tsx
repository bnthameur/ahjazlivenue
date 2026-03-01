'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { Emoji } from 'react-apple-emojis';

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
    const [venues, setVenues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('venues')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching venues:', error);
            } else {
                setVenues(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredVenues = filter === 'all'
        ? venues
        : venues.filter(v => v.status === filter);

    if (loading) {
        return (
            <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
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
                    <Link
                        href="/dashboard/venues/new"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {t('dashboard.btn.add_venue')}
                    </Link>
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
                                        <img src={venue.images[0]} alt={venue.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl opacity-50"><Emoji name="classical-building" width={48} /></span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-slate-900 truncate">{venue.name || "Untitled"}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${statusColors[venue.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>
                                            {t(`status.${venue.status}`)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
                                        <span className="flex items-center gap-1">
                                            <span><Emoji name="round-pushpin" width={14} /></span> {venue.location || "No Location"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span><Emoji name="label" width={14} /></span> {venue.category || "Uncategorized"}
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
                                            <Emoji name="hourglass-not-done" width={14} /> Under review. This usually takes 24-48 hours.
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/dashboard/venues/${venue.id}`}
                                            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg text-center transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        {venue.status === 'approved' && (
                                            <Link
                                                href={`/venues/${venue.slug}`}
                                                target="_blank"
                                                className="px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 text-sm font-medium rounded-lg transition-colors"
                                            >
                                                View
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
                        {filter === 'all' && (
                            <Link
                                href="/dashboard/venues/new"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
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
