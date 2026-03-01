'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Emoji } from 'react-apple-emojis';

interface DashboardStats {
    venuesCount: number;
    pendingVenues: number;
    inquiriesCount: number;
    viewsCount: number;
}

interface UserProfile {
    full_name: string | null;
    status: 'pending' | 'active' | 'rejected';
}

export default function DashboardPage() {
    const supabase = createClient();
    const t = useTranslations('dashboard');
    const [stats, setStats] = useState<DashboardStats>({
        venuesCount: 0,
        pendingVenues: 0,
        inquiriesCount: 0,
        viewsCount: 0,
    });
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, status')
                    .eq('id', user.id)
                    .single();

                setProfile(profileData);

                // Fetch Venues Stats
                const { count: totalVenues } = await supabase
                    .from('venues')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id);

                const { count: pendingVenues } = await supabase
                    .from('venues')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id)
                    .eq('status', 'pending');

                // Fetch Inquiries Count
                const { count: inquiriesCount } = await supabase
                    .from('inquiries')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    venuesCount: totalVenues || 0,
                    pendingVenues: pendingVenues || 0,
                    inquiriesCount: inquiriesCount || 0,
                    viewsCount: 0,
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const isApproved = profile?.status === 'active';
    const isPending = profile?.status === 'pending';
    const isRejected = profile?.status === 'rejected';

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
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                        {t('welcome.title')}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! <Emoji name="waving-hand" width={32} />
                    </h1>
                    <p className="mt-1 text-slate-600">
                        {t('welcome.subtitle')}
                    </p>
                </div>

                {/* Pending Approval Notice */}
                {isPending && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <Emoji name="hourglass-not-done" width={48} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-800 mb-1">{t('status.pending')}</h3>
                                <p className="text-amber-700">
                                    {t('status.pending_desc')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Rejected Notice */}
                {isRejected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">
                                <Emoji name="cross-mark" width={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-800 mb-1">{t('status.rejected')}</h3>
                                <p className="text-red-700 mb-3">
                                    {t('status.rejected_desc')}
                                </p>
                                <a
                                    href="mailto:support@ahjazliqaati.dz"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Stats Grid - Only for approved users */}
                {isApproved && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <Emoji name="classical-building" width={40} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.venuesCount}</div>
                                    <div className="text-xs text-slate-600">{t('stats.total_venues')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <Emoji name="hourglass-not-done" width={40} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.pendingVenues}</div>
                                    <div className="text-xs text-slate-600">{t('stats.pending')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <Emoji name="speech-balloon" width={40} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.inquiriesCount}</div>
                                    <div className="text-xs text-slate-600">{t('stats.inquiries')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <Emoji name="eye" width={40} />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.viewsCount}</div>
                                    <div className="text-xs text-slate-600">{t('stats.views')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('actions.add_title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isApproved && (
                        <Link href="/dashboard/venues/new">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white cursor-pointer"
                            >
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold mb-1">{t('actions.add_title')}</h3>
                                <p className="text-primary-100 text-sm">{t('actions.add_desc')}</p>
                            </motion.div>
                        </Link>
                    )}

                    <Link href={isApproved ? "/dashboard/venues" : "#"}>
                        <motion.div
                            whileHover={isApproved ? { scale: 1.02 } : {}}
                            className={`bg-white border border-slate-200 rounded-2xl p-6 ${isApproved ? 'cursor-pointer hover:border-slate-300' : 'opacity-50 cursor-not-allowed'} transition-colors`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <Emoji name="classical-building" width={48} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('actions.venues_title')}</h3>
                            <p className="text-slate-600 text-sm">{t('actions.venues_desc')}</p>
                        </motion.div>
                    </Link>

                    <Link href={isApproved ? "/dashboard/inquiries" : "#"}>
                        <motion.div
                            whileHover={isApproved ? { scale: 1.02 } : {}}
                            className={`bg-white border border-slate-200 rounded-2xl p-6 ${isApproved ? 'cursor-pointer hover:border-slate-300' : 'opacity-50 cursor-not-allowed'} transition-colors`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <Emoji name="speech-balloon" width={48} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('actions.inquiries_title')}</h3>
                            <p className="text-slate-600 text-sm">{t('actions.inquiries_desc')}</p>
                        </motion.div>
                    </Link>

                    <Link href="/dashboard/settings">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-slate-300 transition-colors"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <Emoji name="gear" width={48} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('actions.settings_title')}</h3>
                            <p className="text-slate-600 text-sm">{t('actions.settings_desc')}</p>
                        </motion.div>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
