import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const sendNotificationSchema = z.object({
    user_ids: z.array(z.string().uuid()).min(1, 'At least one user_id is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
    message: z.string().min(1, 'Message is required').max(2000, 'Message must be under 2000 characters'),
    type: z.enum(['info', 'success', 'warning', 'error']).optional().default('info'),
});

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin role check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = sendNotificationSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { user_ids, title, message, type } = parsed.data;

    // Build rows — one notification per recipient
    const rows = user_ids.map((recipientId) => ({
        recipient_id: recipientId,
        sender_id: user.id,
        title,
        message,
        type,
        is_read: false,
    }));

    const { data, error } = await supabase
        .from('notifications')
        .insert(rows)
        .select('id');

    if (error) {
        console.error('[admin/notifications] insert error:', error);
        return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
    }

    // Log the bulk action
    await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action: 'sent_notifications',
        entity_type: 'notification',
        entity_id: null,
        details: {
            recipient_count: user_ids.length,
            user_ids,
            title,
        },
    });

    return NextResponse.json(
        { success: true, sent: data?.length ?? rows.length },
        { status: 201 }
    );
}
