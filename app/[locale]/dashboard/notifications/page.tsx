import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ClientEmoji from '@/components/ClientEmoji';

export const dynamic = 'force-dynamic';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const typeConfig: Record<string, { bg: string; border: string; titleColor: string; textColor: string; icon: string }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        titleColor: 'text-green-800',
        textColor: 'text-green-700',
        icon: '✅',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        icon: '❌',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        titleColor: 'text-amber-800',
        textColor: 'text-amber-700',
        icon: '⚠️',
    },
    info: {
        bg: 'bg-white',
        border: 'border-slate-200',
        titleColor: 'text-slate-900',
        textColor: 'text-slate-600',
        icon: 'ℹ️',
    },
};

export default async function NotificationsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch notifications for this user
    const { data: notifications } = await supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

    const typedNotifications = (notifications ?? []) as Notification[];

    // Mark unread notifications as read in the background
    const unreadIds = typedNotifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
    }

    const unreadCount = unreadIds.length;

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">🔔</span>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="text-sm text-slate-500">
                            {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {typedNotifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                        <div className="mb-4 opacity-50 flex justify-center">
                            <ClientEmoji name="bell-with-slash" width={64} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications yet</h3>
                        <p className="text-slate-500 text-sm">You're all caught up!</p>
                    </div>
                ) : (
                    typedNotifications.map((notification) => {
                        const cfg = typeConfig[notification.type] ?? typeConfig.info;
                        return (
                            <div
                                key={notification.id}
                                className={`p-5 rounded-xl border ${cfg.bg} ${cfg.border} transition-all`}
                            >
                                <div className="flex items-start gap-4">
                                    <span className="text-2xl mt-0.5 shrink-0">{cfg.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <h3 className={`font-semibold text-sm ${cfg.titleColor}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-slate-400 shrink-0">
                                                {new Date(notification.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${cfg.textColor}`}>
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
