'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { updateUserStatus } from '../actions';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
}

interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    onClick={() => onDismiss(toast.id)}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                        animate-in slide-in-from-top-2 fade-in duration-200 cursor-pointer select-none
                        ${toast.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Send Notification Modal ───────────────────────────────────────────────────

interface SendNotificationModalProps {
    /** null = bulk send to all users in the current list */
    targetUser: User | null;
    allUsers: User[];
    onClose: () => void;
    onSent: (count: number) => void;
}

function SendNotificationModal({ targetUser, allUsers, onClose, onSent }: SendNotificationModalProps) {
    const t = useTranslations('Admin');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    const isBulk = targetUser === null;
    const userIds = isBulk ? allUsers.map(u => u.id) : [targetUser.id];

    useEffect(() => {
        titleRef.current?.focus();
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);

        if (!title.trim()) { setFieldError(t('notifications.error_title_required')); return; }
        if (!message.trim()) { setFieldError(t('notifications.error_message_required')); return; }
        if (userIds.length === 0) { setFieldError(t('notifications.error_no_recipients')); return; }

        setIsSending(true);
        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: userIds,
                    title: title.trim(),
                    message: message.trim(),
                    type: 'info',
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setFieldError(json.error || t('notifications.error_send_failed'));
            } else {
                onSent(json.sent ?? userIds.length);
            }
        } catch {
            setFieldError(t('notifications.error_send_failed'));
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Emoji name="bell" width={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                {isBulk
                                    ? t('notifications.modal_title_bulk')
                                    : t('notifications.modal_title_single')}
                            </h2>
                            {isBulk ? (
                                <p className="text-xs text-slate-500">
                                    {t('notifications.modal_bulk_count', { count: userIds.length })}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                    {targetUser?.full_name || targetUser?.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {fieldError && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {fieldError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {t('notifications.field_title')}
                        </label>
                        <input
                            ref={titleRef}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={200}
                            placeholder={t('notifications.field_title_placeholder')}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {t('notifications.field_message')}
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            maxLength={2000}
                            rows={4}
                            placeholder={t('notifications.field_message_placeholder')}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1 text-right">{message.length}/2000</p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {t('notifications.btn_cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSending}
                            className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    {t('notifications.btn_sending')}
                                </>
                            ) : (
                                <>
                                    <Emoji name="bell" width={14} />
                                    {t('notifications.btn_send')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminUsersClient({ initialUsers, statusFilter }: { initialUsers: User[]; statusFilter: string }) {
    const t = useTranslations('Admin');
    const [users, setUsers] = useState(initialUsers);
    const [currentFilter, setCurrentFilter] = useState(statusFilter);

    // Toast system
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const toastCounterRef = useRef(0);

    // Notification modal: null targetUser = bulk
    const [notifModal, setNotifModal] = useState<{ open: boolean; targetUser: User | null }>({
        open: false,
        targetUser: null,
    });

    const addToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = ++toastCounterRef.current;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const openSingleNotif = (user: User) => setNotifModal({ open: true, targetUser: user });
    const openBulkNotif = () => setNotifModal({ open: true, targetUser: null });
    const closeNotifModal = () => setNotifModal({ open: false, targetUser: null });
    const handleNotifSent = (count: number) => {
        closeNotifModal();
        addToast('success', t('notifications.toast_sent', { count }));
    };

    // Derived list — computed from local state, no page refresh needed
    const filteredUsers = currentFilter === 'all'
        ? users
        : users.filter(u => u.status === currentFilter);

    const handleAction = async (user: User, action: 'approve' | 'reject') => {
        const newStatus = action === 'approve' ? 'active' : 'rejected';

        // Optimistic update — UI responds instantly
        setUsers(prev => prev.map(u =>
            u.id === user.id ? { ...u, status: newStatus as User['status'] } : u
        ));
        addToast('success', action === 'approve' ? t('users.approve_success') : t('users.reject_success'));

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('action', action);
        await updateUserStatus(formData);
        // No router.refresh() — local state is the source of truth after optimistic update
    };

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
        <>
            <Toast toasts={toasts} onDismiss={dismissToast} />

            {notifModal.open && (
                <SendNotificationModal
                    targetUser={notifModal.targetUser}
                    allUsers={filteredUsers}
                    onClose={closeNotifModal}
                    onSent={handleNotifSent}
                />
            )}

            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">{t('users.title')}</h1>

                    {/* Bulk send notification to all currently visible users */}
                    {filteredUsers.length > 0 && (
                        <button
                            type="button"
                            onClick={openBulkNotif}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            <Emoji name="bell" width={14} />
                            {t('notifications.btn_send_all', { count: filteredUsers.length })}
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto">
                    {(['all', 'pending', 'active', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setCurrentFilter(status)}
                            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors capitalize whitespace-nowrap ${
                                currentFilter === status
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            {status === 'all'
                                ? (t.has('status.all') ? t('status.all') : 'All')
                                : t(`status.${status}`)}
                        </button>
                    ))}
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <div className="mb-4 opacity-50 flex justify-center">
                                <Emoji name="bust-in-silhouette" width={48} />
                            </div>
                            <p className="text-slate-500">
                                {t('users.no_users', { status: currentFilter === 'all' ? 'All' : t(`status.${currentFilter}`) })}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-all"
                            >
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
                                            {user.status !== 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(user, 'approve')}
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Emoji name="check-mark-button" width={14} className="inline mr-1" />
                                                    {t('users.approve')}
                                                </button>
                                            )}
                                            {user.status !== 'rejected' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(user, 'reject')}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Emoji name="cross-mark" width={14} className="inline mr-1" />
                                                    {t('users.reject')}
                                                </button>
                                            )}
                                            {/* Per-user notification button */}
                                            <button
                                                type="button"
                                                onClick={() => openSingleNotif(user)}
                                                className="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Emoji name="bell" width={14} className="inline mr-1" />
                                                {t('notifications.btn_send_single')}
                                            </button>

                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Emoji name="eyes" width={14} className="inline mr-1" />
                                                {t.has('users.view') ? t('users.view') : 'View'}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
