'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TargetUser {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    status: string;
}

interface SentNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
    is_read: boolean;
    recipient_id: string;
    profiles: { full_name: string | null; email: string | null } | null;
}

interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    onClick={() => onDismiss(t.id)}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer select-none
                        ${t.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    <span>{t.type === 'success' ? '✓' : '✕'}</span>
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function AdminNotificationsClient({
    users,
    sentNotifications: initialSent,
    pageTitle,
}: {
    users: TargetUser[];
    sentNotifications: SentNotification[];
    pageTitle: string;
}) {
    const t = useTranslations('Admin');

    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [sendToAll, setSendToAll] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Sent history state (optimistically prepended after sends)
    const [sentNotifications, setSentNotifications] = useState<SentNotification[]>(initialSent);

    // Toast system
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const toastCounter = useRef(0);
    const addToast = useCallback((type: 'success' | 'error', msg: string) => {
        const id = ++toastCounter.current;
        setToasts(prev => [...prev, { id, type, message: msg }]);
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    }, []);
    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(x => x.id !== id));
    }, []);

    const filteredUsers = users.filter(u => {
        const q = search.toLowerCase();
        return (
            (u.full_name?.toLowerCase().includes(q) ?? false) ||
            (u.email?.toLowerCase().includes(q) ?? false)
        );
    });

    const toggleUser = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        setSendToAll(v => !v);
        if (!sendToAll) setSelectedUserIds([]);
    };

    const recipientCount = sendToAll ? users.length : selectedUserIds.length;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);

        if (!title.trim()) { setFieldError(t('notifications.error_title_required')); return; }
        if (!message.trim()) { setFieldError(t('notifications.error_message_required')); return; }
        if (recipientCount === 0) { setFieldError(t('notifications.error_no_recipients')); return; }

        const ids = sendToAll ? users.map(u => u.id) : selectedUserIds;

        setIsSending(true);
        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_ids: ids,
                    title: title.trim(),
                    message: message.trim(),
                    type: notifType,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setFieldError(json.error || t('notifications.error_send_failed'));
            } else {
                addToast('success', t('notifications.toast_sent', { count: json.sent ?? ids.length }));
                // Reset form
                setTitle('');
                setMessage('');
                setSelectedUserIds([]);
                setSendToAll(false);
                setNotifType('info');
            }
        } catch {
            setFieldError(t('notifications.error_send_failed'));
        } finally {
            setIsSending(false);
        }
    };

    const typeColors: Record<string, string> = {
        info: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        error: 'bg-red-100 text-red-700',
    };

    return (
        <>
            <Toast toasts={toasts} onDismiss={dismissToast} />

            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                {/* Page header */}
                <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <span className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Emoji name="bell" width={18} />
                    </span>
                    {pageTitle}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ── Compose form ── */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-slate-900 mb-5">
                            {t('notifications.modal_title_single')}
                        </h2>

                        <form onSubmit={handleSend} className="space-y-4">
                            {fieldError && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {fieldError}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    {t('notifications.field_title')}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    maxLength={200}
                                    placeholder={t('notifications.field_title_placeholder')}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Message */}
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
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">{message.length}/2000</p>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Type
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {(['info', 'success', 'warning', 'error'] as const).map(tp => (
                                        <button
                                            key={tp}
                                            type="button"
                                            onClick={() => setNotifType(tp)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                                                notifType === tp
                                                    ? typeColors[tp] + ' border-current'
                                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tp}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recipient selector */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Recipients
                                        {recipientCount > 0 && (
                                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                {recipientCount}
                                            </span>
                                        )}
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sendToAll}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded accent-purple-600"
                                        />
                                        {t('notifications.btn_send_all', { count: users.length })}
                                    </label>
                                </div>

                                {!sendToAll && (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="p-2 border-b border-slate-100">
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                placeholder="Search users..."
                                                className="w-full px-2 py-1.5 text-sm focus:outline-none"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                                            {filteredUsers.length === 0 ? (
                                                <p className="p-4 text-sm text-slate-400 text-center">No users found</p>
                                            ) : (
                                                filteredUsers.map(u => (
                                                    <label
                                                        key={u.id}
                                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUserIds.includes(u.id)}
                                                            onChange={() => toggleUser(u.id)}
                                                            className="w-4 h-4 rounded accent-purple-600 shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 truncate">
                                                                {u.full_name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSending || recipientCount === 0}
                                className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                                        {recipientCount > 0 && ` (${recipientCount})`}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* ── Sent history ── */}
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Sent</h2>
                        <div className="space-y-3">
                            {sentNotifications.length === 0 ? (
                                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                                    <div className="mb-3 opacity-40 flex justify-center">
                                        <Emoji name="bell-with-slash" width={40} />
                                    </div>
                                    <p className="text-sm text-slate-500">No notifications sent yet.</p>
                                </div>
                            ) : (
                                sentNotifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`bg-white rounded-xl border p-4 ${
                                            n.type === 'success' ? 'border-green-200' :
                                            n.type === 'error' ? 'border-red-200' :
                                            n.type === 'warning' ? 'border-amber-200' :
                                            'border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColors[n.type] ?? typeColors.info}`}>
                                                {n.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-2">{n.message}</p>
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span className="truncate max-w-[180px]">
                                                {(n.profiles as { full_name: string | null; email: string | null } | null)?.full_name
                                                    || (n.profiles as { full_name: string | null; email: string | null } | null)?.email
                                                    || n.recipient_id}
                                            </span>
                                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
