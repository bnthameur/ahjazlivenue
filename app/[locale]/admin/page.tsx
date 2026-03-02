'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';
import { useLanguage } from '@/components/LanguageProvider';

interface Stats {
    pendingVenues: number;
    approvedVenues: number;
    pendingUsers: number;
    activeUsers: number;
    totalInquiries: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        pendingVenues: 0,
        approvedVenues: 0,
        pendingUsers: 0,
        activeUsers: 0,
        totalInquiries: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { t, dir } = useLanguage();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: pendingVenuesCount },
                { count: approvedVenuesCount },
                { count: pendingUsersCount },
                { count: activeUsersCount },
            ] = await Promise.all([
                supabase.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('venues').select('*', { count: 'exact', head: true }).in('status', ['approved', 'published']),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            ]);

            setStats({
                pendingVenues: pendingVenuesCount || 0,
                approvedVenues: approvedVenuesCount || 0,
                pendingUsers: pendingUsersCount || 0,
                activeUsers: activeUsersCount || 0,
                totalInquiries: 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6" dir={dir}>
                {/* Skeleton header */}
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                </div>
                {/* Skeleton stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                <div className="w-16 h-5 bg-slate-100 rounded-full" />
                            </div>
                            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                            <div className="h-8 w-12 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        {
            label: t('admin.stats.pending_venues'),
            count: stats.pendingVenues,
            emoji: 'hourglass-not-done',
            badge: t('admin.status.pending'),
            color: 'orange',
            href: '/admin/venues?status=pending',
            linkText: t('admin.stats.review_now'),
        },
        {
            label: t('admin.stats.active_venues'),
            count: stats.approvedVenues,
            emoji: 'check-mark-button',
            badge: t('admin.status.active'),
            color: 'green',
            href: '/admin/venues?status=approved',
            linkText: t('admin.stats.view_all'),
        },
        {
            label: t('admin.stats.pending_users'),
            count: stats.pendingUsers,
            emoji: 'bust-in-silhouette',
            badge: t('admin.stats.review'),
            color: 'purple',
            href: '/admin/users?status=pending',
            linkText: t('admin.stats.review_now'),
        },
        {
            label: t('admin.stats.active_users'),
            count: stats.activeUsers,
            emoji: 'busts-in-silhouette',
            badge: t('admin.stats.total'),
            color: 'blue',
            href: '/admin/users?status=active',
            linkText: t('admin.stats.view_all'),
        },
    ];

    const colorMap: Record<string, { bg: string; border: string; badgeBg: string; badgeText: string; heading: string; value: string; link: string }> = {
        orange: { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', badgeBg: 'bg-orange-200', badgeText: 'text-orange-700', heading: 'text-orange-900', value: 'text-orange-700', link: 'text-orange-600 hover:text-orange-700' },
        green: { bg: 'from-green-50 to-green-100', border: 'border-green-200', badgeBg: 'bg-green-200', badgeText: 'text-green-700', heading: 'text-green-900', value: 'text-green-700', link: 'text-green-600 hover:text-green-700' },
        purple: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', badgeBg: 'bg-purple-200', badgeText: 'text-purple-700', heading: 'text-purple-900', value: 'text-purple-700', link: 'text-purple-600 hover:text-purple-700' },
        blue: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', badgeBg: 'bg-blue-200', badgeText: 'text-blue-700', heading: 'text-blue-900', value: 'text-blue-700', link: 'text-blue-600 hover:text-blue-700' },
    };

    const quickActions = [
        {
            label: t('admin.actions.manage_venues'),
            desc: t('admin.actions.manage_venues_desc'),
            emoji: 'classical-building',
            href: '/admin/venues',
            hoverBorder: 'hover:border-primary-300',
            hoverBg: 'hover:bg-primary-50',
            iconBg: 'bg-primary-100',
            iconHover: 'group-hover:bg-primary-200',
        },
        {
            label: t('admin.actions.manage_users'),
            desc: t('admin.actions.manage_users_desc'),
            emoji: 'busts-in-silhouette',
            href: '/admin/users',
            hoverBorder: 'hover:border-purple-300',
            hoverBg: 'hover:bg-purple-50',
            iconBg: 'bg-purple-100',
            iconHover: 'group-hover:bg-purple-200',
        },
        {
            label: t('admin.actions.view_inquiries'),
            desc: t('admin.actions.view_inquiries_desc'),
            emoji: 'envelope',
            href: '/admin/inquiries',
            hoverBorder: 'hover:border-blue-300',
            hoverBg: 'hover:bg-blue-50',
            iconBg: 'bg-blue-100',
            iconHover: 'group-hover:bg-blue-200',
        },
    ];

    return (
        <div className="p-6 space-y-8" dir={dir}>
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Emoji name="chart-increasing" width={28} />
                    {t('admin.dashboard.title')}
                </h1>
                <p className="text-slate-500 mt-1 text-sm">{t('admin.dashboard.subtitle')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((card) => {
                    const c = colorMap[card.color];
                    return (
                        <div key={card.color} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 hover:shadow-lg transition-shadow`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-11 h-11 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                                    <Emoji name={card.emoji} width={22} />
                                </div>
                                <span className={`text-xs font-medium ${c.badgeText} ${c.badgeBg} px-2 py-0.5 rounded-full`}>
                                    {card.badge}
                                </span>
                            </div>
                            <h3 className={`text-sm font-medium ${c.heading} mb-1`}>{card.label}</h3>
                            <p className={`text-3xl font-bold ${c.value}`}>{card.count}</p>
                            <Link
                                href={card.href}
                                className={`text-xs ${c.link} mt-2 inline-flex items-center gap-1`}
                            >
                                {card.linkText} <Emoji name="right-arrow" width={12} />
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Emoji name="rocket" width={20} />
                    {t('admin.actions.title')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className={`flex items-center gap-3 p-4 border border-slate-200 rounded-xl ${action.hoverBorder} ${action.hoverBg} transition-all group`}
                        >
                            <div className={`w-10 h-10 ${action.iconBg} rounded-lg flex items-center justify-center ${action.iconHover} transition-colors`}>
                                <Emoji name={action.emoji} width={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">{action.label}</h3>
                                <p className="text-xs text-slate-500">{action.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Emoji name="alarm-clock" width={20} />
                    {t('admin.activity.title')}
                </h2>
                <div className="text-center py-8 text-slate-400">
                    <Emoji name="inbox-tray" width={40} />
                    <p className="mt-3 text-sm font-medium">{t('admin.activity.empty')}</p>
                    <p className="text-xs mt-1">{t('admin.activity.empty_desc')}</p>
                </div>
            </div>
        </div>
    );
}
