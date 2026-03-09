'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { updateUserStatus } from '../actions';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
}

export default function AdminUsersClient({ initialUsers, statusFilter }: { initialUsers: User[], statusFilter: string }) {
    const t = useTranslations('Admin');
    const [users, setUsers] = useState(initialUsers);

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('status.pending') },
            active: { bg: 'bg-green-100', text: 'text-green-700', label: t('status.active') },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: t('status.rejected') },
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const badges = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: t('roles.admin') },
            venue_owner: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('roles.venue_owner') },
            user: { bg: 'bg-slate-100', text: 'text-slate-700', label: t('roles.user') },
        };
        const badge = badges[role as keyof typeof badges] || badges.user;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-slate-900">{t('users.title')}</h1>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto">
                {['pending', 'active', 'rejected'].map((status) => (
                    <Link
                        key={status}
                        href={`/admin/users?status=${status}`}
                        className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors capitalize whitespace-nowrap ${statusFilter === status
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        {t(`status.${status}`)}
                    </Link>
                ))}
            </div>

            {/* Users Grid - Mobile Responsive */}
            <div className="grid grid-cols-1 gap-4">
                {users?.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="mb-4 opacity-50 flex justify-center">
                            <Emoji name="bust-in-silhouette" width={48} />
                        </div>
                        <p className="text-slate-500">{t('users.no_users', { status: t(`status.${statusFilter}`) })}</p>
                    </div>
                ) : (
                    users?.map((user) => (
                        <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                {/* User Info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900 truncate">{user.full_name || t('fallbacks.unknown_user')}</h3>
                                            {getRoleBadge(user.role)}
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {t('labels.joined')}: {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex flex-col sm:items-end gap-3">
                                    {getStatusBadge(user.status)}
                                    <div className="flex flex-wrap gap-2">
                                        {statusFilter !== 'active' && (
                                            <form action={updateUserStatus}>
                                                <input type="hidden" name="userId" value={user.id} />
                                                <input type="hidden" name="action" value="approve" />
                                                <button type="submit" className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors">
                                                    <Emoji name="check-mark-button" width={14} className="inline mr-1" />
                                                    {t('users.approve')}
                                                </button>
                                            </form>
                                        )}
                                        {statusFilter !== 'rejected' && (
                                            <form action={updateUserStatus}>
                                                <input type="hidden" name="userId" value={user.id} />
                                                <input type="hidden" name="action" value="reject" />
                                                <button type="submit" className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors">
                                                    <Emoji name="cross-mark" width={14} className="inline mr-1" />
                                                    {t('users.reject')}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
