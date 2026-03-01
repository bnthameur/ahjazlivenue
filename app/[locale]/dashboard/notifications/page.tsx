import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ClientEmoji from '@/components/ClientEmoji';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch Notifications
    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

    // Mark all as read (simple implementation)
    if (notifications?.some(n => !n.is_read)) {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', user.id)
            .eq('is_read', false);
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <span className="text-3xl">🔔</span>
                Notifications
            </h1>

            <div className="space-y-4">
                {notifications?.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                        <div className="mb-4 opacity-50"><ClientEmoji name="bell-with-slash" width={64} /></div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications yet</h3>
                        <p className="text-slate-500">You're all caught up!</p>
                    </div>
                ) : (
                    notifications?.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-6 rounded-xl border ${notification.type === 'success' ? 'bg-green-50 border-green-200' :
                                notification.type === 'error' ? 'bg-red-50 border-red-200' :
                                    notification.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                                        'bg-white border-slate-200'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="text-2xl mt-1">
                                    {notification.type === 'success' && '✅'}
                                    {notification.type === 'error' && '❌'}
                                    {notification.type === 'warning' && '⚠️'}
                                    {notification.type === 'info' && 'ℹ️'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-bold ${notification.type === 'success' ? 'text-green-800' :
                                            notification.type === 'error' ? 'text-red-800' :
                                                notification.type === 'warning' ? 'text-amber-800' :
                                                    'text-slate-900'
                                            }`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-slate-500">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${notification.type === 'success' ? 'text-green-700' :
                                        notification.type === 'error' ? 'text-red-700' :
                                            notification.type === 'warning' ? 'text-amber-700' :
                                                'text-slate-600'
                                        }`}>
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
