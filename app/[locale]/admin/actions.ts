'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function updateUserStatus(formData: FormData) {
    const userId = formData.get('userId') as string;
    const action = formData.get('action') as string;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!userId || !action) {
        return;
    }

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') return;

    try {
        let status = 'pending';
        let notificationMessage = '';
        let notificationTitle = '';

        if (action === 'approve') {
            status = 'active';
            notificationTitle = 'Account Approved';
            notificationMessage = 'Your venue owner account has been approved! You can now list your venues.';
        } else if (action === 'reject') {
            status = 'rejected';
            notificationTitle = 'Account Rejected';
            notificationMessage = 'Your venue owner account has been rejected. Please contact support for more details.';
        }

        // Update Profile
        const { error } = await supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId);

        if (error) throw error;

        // Send Notification
        await supabase.from('notifications').insert({
            recipient_id: userId,
            sender_id: user.id,
            title: notificationTitle,
            message: notificationMessage,
            type: action === 'approve' ? 'success' : 'error'
        });

        revalidatePath('/admin/users');
    } catch (error) {
        console.error('Error updating user status:', error);
    }
}

export async function updateVenueStatus(formData: FormData) {
    const venueId = formData.get('venueId') as string;
    const action = formData.get('action') as string;
    const rejectionReason = formData.get('rejectionReason') as string;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!venueId || !action) {
        return;
    }

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') return;

    try {
        let status: 'pending' | 'approved' | 'rejected' | 'published' = 'pending';
        let notificationMessage = '';
        let notificationTitle = '';
        let notificationType: 'success' | 'error' | 'info' = 'info';

        if (action === 'approve') {
            status = 'published';
            notificationTitle = 'Venue Approved';
            notificationMessage = 'Your venue has been approved and is now live on the marketplace!';
            notificationType = 'success';
        } else if (action === 'reject') {
            status = 'rejected';
            notificationTitle = 'Venue Rejected';
            notificationMessage = rejectionReason
                ? `Your venue has been rejected. Reason: ${rejectionReason}`
                : 'Your venue has been rejected. Please check the guidelines and try again.';
            notificationType = 'error';
        }

        // Update Venue
        const updateData: any = { status };
        if (action === 'reject' && rejectionReason) {
            updateData.rejection_reason = rejectionReason;
        }

        const { error, data: venue } = await supabase
            .from('venues')
            .update(updateData)
            .eq('id', venueId)
            .select('owner_id, title, name')
            .single();

        if (error) throw error;

        // Send Notification if we have the owner_id
        if (venue) {
            await supabase.from('notifications').insert({
                recipient_id: venue.owner_id,
                sender_id: user.id,
                title: notificationTitle,
                message: `${notificationMessage} (${venue.title || venue.name})`,
                type: notificationType
            });
        }

        revalidatePath('/admin/venues');
    } catch (error) {
        console.error('Error updating venue status:', error);
    }
}
