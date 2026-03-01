'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';

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
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Check if admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            // Fetch real stats
            await fetchStats();
        };

        checkAdminAndFetch();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch venue stats
            const { count: pendingVenuesCount } = await supabase
                .from('venues')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: approvedVenuesCount } = await supabase
                .from('venues')
                .select('*', { count: 'exact', head: true })
                .in('status', ['approved', 'published']);

            // Fetch user stats
            const { count: pendingUsersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: activeUsersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            setStats({
                pendingVenues: pendingVenuesCount || 0,
                approvedVenues: approvedVenuesCount || 0,
                pendingUsers: pendingUsersCount || 0,
                activeUsers: activeUsersCount || 0,
                totalInquiries: 0 // Add inquiries table later
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Emoji name="chart-increasing" width={32} />
                    Admin Dashboard
                </h1>
                <p className="text-slate-600 mt-2">Monitor and manage your platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Pending Venues */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                            <Emoji name="hourglass-not-done" width={24} />
                        </div>
                        <span className="text-xs font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded-full">
                            Pending
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-orange-900 mb-1">Pending Venues</h3>
                    <p className="text-3xl font-bold text-orange-700">{stats.pendingVenues}</p>
                    <Link
                        href="/admin/venues?status=pending"
                        className="text-xs text-orange-600 hover:text-orange-700 mt-2 inline-flex items-center gap-1"
                    >
                        Review now <Emoji name="right-arrow" width={12} />
                    </Link>
                </div>

                {/* Approved Venues */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                            <Emoji name="check-mark-button" width={24} />
                        </div>
                        <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                            Active
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-green-900 mb-1">Active Venues</h3>
                    <p className="text-3xl font-bold text-green-700">{stats.approvedVenues}</p>
                    <Link
                        href="/admin/venues?status=approved"
                        className="text-xs text-green-600 hover:text-green-700 mt-2 inline-flex items-center gap-1"
                    >
                        View all <Emoji name="right-arrow" width={12} />
                    </Link>
                </div>

                {/* Pending Users */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                            <Emoji name="bust-in-silhouette" width={24} />
                        </div>
                        <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                            Review
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-purple-900 mb-1">Pending Users</h3>
                    <p className="text-3xl font-bold text-purple-700">{stats.pendingUsers}</p>
                    <Link
                        href="/admin/users?status=pending"
                        className="text-xs text-purple-600 hover:text-purple-700 mt-2 inline-flex items-center gap-1"
                    >
                        Review now <Emoji name="right-arrow" width={12} />
                    </Link>
                </div>

                {/* Active Users */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <Emoji name="busts-in-silhouette" width={24} />
                        </div>
                        <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                            Total
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Active Users</h3>
                    <p className="text-3xl font-bold text-blue-700">{stats.activeUsers}</p>
                    <Link
                        href="/admin/users?status=active"
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center gap-1"
                    >
                        View all <Emoji name="right-arrow" width={12} />
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Emoji name="rocket" width={20} />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                        href="/admin/venues"
                        className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                    >
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                            <Emoji name="classical-building" width={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900">Manage Venues</h3>
                            <p className="text-xs text-slate-500">Review and approve venues</p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
                    >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Emoji name="busts-in-silhouette" width={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900">Manage Users</h3>
                            <p className="text-xs text-slate-500">Review venue owners</p>
                        </div>
                    </Link>

                    <Link
                        href="/admin/inquiries"
                        className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Emoji name="envelope" width={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900">View Inquiries</h3>
                            <p className="text-xs text-slate-500">Monitor customer requests</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Emoji name="alarm-clock" width={20} />
                    Recent Activity
                </h2>
                <div className="text-center py-8 text-slate-500">
                    <Emoji name="inbox-tray" width={48} />
                    <p className="mt-2">No recent activity to display</p>
                    <p className="text-sm">Activity logs will appear here</p>
                </div>
            </div>
        </div>
    );
}
