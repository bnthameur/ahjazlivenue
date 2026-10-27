'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { detectPreferredLocale } from '@/i18n/locale-utils';
import { FREE_MODE_SETTING_KEY } from '@/lib/platform-mode';

/**
 * Verifies the current session user is an admin, then returns both:
 * - `supabase`: anon-key client (used only for auth/profile reads, notifications)
 * - `adminDb`: service-role client (bypasses RLS — use for all writes/deletes)
 * - `user`: the authenticated admin user
 */
async function getAdminClient() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') return null;
    const adminDb = createAdminClient();
    return { supabase, adminDb, user };
}

export async function updateUserStatus(formData: FormData) {
    const userId = formData.get('userId') as string;
    const action = formData.get('action') as string;
    const cookieStore = await cookies();
    const locale = detectPreferredLocale({
        cookieLocale: cookieStore.get('NEXT_LOCALE')?.value
    });
    const t = await getTranslations({ locale, namespace: 'Admin' });
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
            notificationTitle = t('notifications.user_approved_title');
            notificationMessage = t('notifications.user_approved_message');
        } else if (action === 'reject') {
            status = 'rejected';
            notificationTitle = t('notifications.user_rejected_title');
            notificationMessage = t('notifications.user_rejected_message');
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
    const locale = detectPreferredLocale({
        cookieLocale: cookieStore.get('NEXT_LOCALE')?.value
    });
    const t = await getTranslations({ locale, namespace: 'Admin' });
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
            notificationTitle = t('notifications.venue_approved_title');
            notificationMessage = t('notifications.venue_approved_message');
            notificationType = 'success';
        } else if (action === 'reject') {
            status = 'rejected';
            notificationTitle = t('notifications.venue_rejected_title');
            notificationMessage = rejectionReason
                ? t('notifications.venue_rejected_message_with_reason', { reason: rejectionReason })
                : t('notifications.venue_rejected_message');
            notificationType = 'error';
        }

        // Update Venue
        const updateData: { status: typeof status; rejection_reason?: string } = { status };
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

export async function updatePlatformSetting(formData: FormData) {
    const key = formData.get('key') as string;
    const value = formData.get('value') as string;

    if (!key) return { error: 'Key is required' };

    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    const { adminDb, user } = admin;

    try {
        const { error } = await adminDb
            .from('platform_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

        if (error) throw error;

        if (key === FREE_MODE_SETTING_KEY) {
            // Platform-wide switch: keep an audit trail and refresh every owner dashboard
            await adminDb.from('admin_logs').insert({
                admin_id: user.id,
                action: value === 'true' ? 'enabled_free_mode' : 'disabled_free_mode',
                entity_type: 'platform',
                details: { key, value },
            });
            revalidatePath('/[locale]/dashboard', 'layout');
        }

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating platform setting:', error);
        return { error: error instanceof Error ? error.message : 'Failed to update setting' };
    }
}

export async function updateReceiptStatus(formData: FormData): Promise<void> {
    const receiptId = formData.get('receiptId') as string;
    const action = formData.get('action') as string; // 'approve' | 'reject'
    const adminNote = formData.get('adminNote') as string;

    if (!receiptId || !action) return;

    const admin = await getAdminClient();
    if (!admin) return;
    const { supabase, adminDb, user } = admin;

    try {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const extractPlanIdFromReceiptUrl = (receiptUrl?: string | null) => {
            if (!receiptUrl) return null;
            const decodedUrl = decodeURIComponent(receiptUrl);
            const match = decodedUrl.match(/payment-receipts\/[^/]+\/([0-9a-f-]{36})-\d+\./i);
            return match?.[1] || null;
        };

        const { data: receipt, error: receiptError } = await adminDb
            .from('payment_receipts')
            .update({
                status,
                admin_note: adminNote || null,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id,
            })
            .eq('id', receiptId)
            .select('user_id, amount, receipt_url')
            .single();

        if (receiptError) throw receiptError;

        // If approved, also activate the user's account if currently pending
        if (action === 'approve' && receipt?.user_id) {
            await adminDb
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', receipt.user_id)
                .eq('status', 'pending');

            const { data: pendingSubscription } = await adminDb
                .from('user_subscriptions')
                .select('id, expires_at, created_at')
                .eq('user_id', receipt.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const now = new Date();
            const currentExpiry = pendingSubscription?.expires_at ? new Date(pendingSubscription.expires_at) : null;
            const startDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
            const expiryDate = new Date(startDate);
            expiryDate.setDate(expiryDate.getDate() + 30);
            const selectedPlanId = extractPlanIdFromReceiptUrl(receipt.receipt_url);

            if (pendingSubscription?.id) {
                await adminDb
                    .from('user_subscriptions')
                    .update({
                        status: 'active',
                        started_at: now.toISOString(),
                        expires_at: expiryDate.toISOString(),
                    })
                    .eq('id', pendingSubscription.id);
            } else if (selectedPlanId) {
                await adminDb
                    .from('user_subscriptions')
                    .insert({
                        user_id: receipt.user_id,
                        plan_id: selectedPlanId,
                        status: 'active',
                        started_at: now.toISOString(),
                        expires_at: expiryDate.toISOString(),
                    });
            }
        }

        // Send notification to the user (anon client is fine here for inserts if RLS allows it,
        // but use adminDb to be safe)
        if (receipt?.user_id) {
            const notificationTitle = action === 'approve'
                ? 'Payment Approved'
                : 'Payment Rejected';
            const notificationMessage = action === 'approve'
                ? `Your payment of ${receipt.amount} DZD has been approved. Your account and subscription are now active.`
                : `Your payment receipt has been rejected.${adminNote ? ' Reason: ' + adminNote : ''}`;

            await adminDb.from('notifications').insert({
                recipient_id: receipt.user_id,
                sender_id: user.id,
                title: notificationTitle,
                message: notificationMessage,
                type: action === 'approve' ? 'success' : 'error',
            });
        }

        revalidatePath('/admin/users');
        revalidatePath('/admin/payments');
    } catch (error: unknown) {
        console.error('Error updating receipt status:', error);
    }
}

type AdminDb = ReturnType<typeof createAdminClient>;

/** Deletes a venue and every row that references it. Throws on failure. */
async function deleteVenueCascade(adminDb: AdminDb, venueId: string) {
    // Delete all FK-dependent rows first, in dependency order.
    // Each step is awaited individually so errors are not swallowed.

    const { error: analyticsError } = await adminDb
        .from('analytics')
        .delete()
        .eq('venue_id', venueId);
    if (analyticsError) console.error('analytics cleanup error:', analyticsError.message);

    const { error: mediaError } = await adminDb
        .from('venue_media')
        .delete()
        .eq('venue_id', venueId);
    if (mediaError) throw new Error(`venue_media cleanup failed: ${mediaError.message}`);

    const { error: inquiriesError } = await adminDb
        .from('inquiries')
        .delete()
        .eq('venue_id', venueId);
    if (inquiriesError) throw new Error(`inquiries cleanup failed: ${inquiriesError.message}`);

    const { error: contactError } = await adminDb
        .from('contact_inquiries')
        .delete()
        .eq('venue_id', venueId);
    if (contactError) throw new Error(`contact_inquiries cleanup failed: ${contactError.message}`);

    const { error: venueError } = await adminDb
        .from('venues')
        .delete()
        .eq('id', venueId);
    if (venueError) throw new Error(`venues delete failed: ${venueError.message}`);
}

export async function deleteVenue(formData: FormData): Promise<{ success?: boolean; error?: string }> {
    const venueId = formData.get('venueId') as string;
    if (!venueId) return { error: 'Venue ID is required' };

    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    // Use the service-role client so RLS does not block the deletes.
    const { adminDb } = admin;

    try {
        await deleteVenueCascade(adminDb, venueId);
        revalidatePath('/admin/venues');
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting venue:', error);
        return { error: error instanceof Error ? error.message : 'Failed to delete venue' };
    }
}

// Fields an admin may set when creating or editing a listing for a user.
const ADMIN_VENUE_FIELDS = [
    'name', 'slug', 'title', 'description', 'category', 'location', 'wilaya', 'city', 'address',
    'latitude', 'longitude', 'capacity_min', 'capacity_max', 'capacity',
    'price_min', 'price_max', 'price', 'phone', 'whatsapp', 'contact_email',
    'facebook_url', 'instagram_url', 'amenities', 'images', 'offers',
] as const;

function pickVenueFields(input: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const key of ADMIN_VENUE_FIELDS) {
        if (input[key] !== undefined) out[key] = input[key];
    }
    // An empty slug would collide with other listings; leave it to the database default.
    if (!out.slug) delete out.slug;
    return out;
}

/** Admin creates a listing owned by another user. It is published right away. */
export async function adminCreateVenue(
    ownerId: string,
    input: Record<string, unknown>
): Promise<{ id?: string; error?: string }> {
    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    const { adminDb, user } = admin;

    const fields = pickVenueFields(input);
    if (!fields.name || !fields.description || !fields.phone) return { error: 'Missing required fields' };

    const { data: owner } = await adminDb.from('profiles').select('id').eq('id', ownerId).maybeSingle();
    if (!owner) return { error: 'User not found' };

    const { data, error } = await adminDb
        .from('venues')
        .insert({ ...fields, owner_id: ownerId, status: 'published' })
        .select('id')
        .single();
    if (error) return { error: error.message };

    await adminDb.from('admin_logs').insert({
        admin_id: user.id,
        action: 'created_venue_for_user',
        entity_type: 'venue',
        entity_id: data.id,
        details: { owner_id: ownerId, category: fields.category ?? null },
    });

    revalidatePath('/admin/venues');
    revalidatePath(`/admin/users/${ownerId}`);
    return { id: data.id };
}

/** Admin edits any listing. */
export async function adminUpdateVenue(
    venueId: string,
    input: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    const { adminDb, user } = admin;

    const { error } = await adminDb.from('venues').update(pickVenueFields(input)).eq('id', venueId);
    if (error) return { error: error.message };

    await adminDb.from('admin_logs').insert({
        admin_id: user.id,
        action: 'updated_venue',
        entity_type: 'venue',
        entity_id: venueId,
    });

    revalidatePath('/admin/venues');
    revalidatePath(`/admin/venues/${venueId}`);
    return { success: true };
}

/**
 * Permanently deletes a user account with all of its listings, subscriptions,
 * receipts and notifications. Admin accounts (including your own) cannot be deleted here.
 */
export async function deleteUser(userId: string): Promise<{ success?: boolean; error?: string }> {
    if (!userId) return { error: 'User ID is required' };

    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    const { adminDb, user } = admin;

    if (userId === user.id) return { error: 'You cannot delete your own account' };

    const { data: target } = await adminDb
        .from('profiles')
        .select('id, email, role')
        .eq('id', userId)
        .maybeSingle();
    if (!target) return { error: 'User not found' };
    if (target.role === 'admin') return { error: 'Admin accounts cannot be deleted' };

    try {
        const { data: venues, error: venuesError } = await adminDb
            .from('venues')
            .select('id')
            .eq('owner_id', userId);
        if (venuesError) throw venuesError;

        for (const venue of venues || []) {
            await deleteVenueCascade(adminDb, venue.id);
        }

        // Remaining rows that point at the user
        const cleanups = [
            adminDb.from('contact_inquiries').delete().eq('owner_id', userId),
            adminDb.from('user_subscriptions').delete().eq('user_id', userId),
            adminDb.from('payment_receipts').delete().eq('user_id', userId),
            adminDb.from('notifications').delete().eq('recipient_id', userId),
            adminDb.from('notifications').delete().eq('sender_id', userId),
        ];
        for (const result of await Promise.all(cleanups)) {
            if (result.error) throw result.error;
        }

        const { error: authError } = await adminDb.auth.admin.deleteUser(userId);
        if (authError && !/not found/i.test(authError.message)) throw authError;

        // The profile normally goes with the auth user (ON DELETE CASCADE); make sure.
        await adminDb.from('profiles').delete().eq('id', userId);

        await adminDb.from('admin_logs').insert({
            admin_id: user.id,
            action: 'deleted_user',
            entity_type: 'user',
            entity_id: userId,
            details: { email: target.email, venues_deleted: venues?.length || 0 },
        });

        revalidatePath('/admin/users');
        revalidatePath('/admin/venues');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error deleting user:', error);
        const message = error instanceof Error
            ? error.message
            : (error as { message?: string })?.message || 'Failed to delete user';
        return { error: message };
    }
}

export async function toggleVenueFeatured(formData: FormData) {
    const venueId = formData.get('venueId') as string;
    const isFeatured = formData.get('isFeatured') === 'true';

    if (!venueId) return { error: 'Venue ID is required' };

    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    const { adminDb } = admin;

    try {
        const { error } = await adminDb
            .from('venues')
            .update({ is_featured: isFeatured })
            .eq('id', venueId);

        if (error) throw error;

        revalidatePath('/admin/settings');
        revalidatePath('/admin/venues');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error toggling venue featured status:', error);
        return { error: error instanceof Error ? error.message : 'Failed to update venue' };
    }
}

export interface CreatedVenueAccount {
    id: string;
    full_name: string;
    email: string;
    role: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Admin creates a venue-owner account with email + password.
 * The account is created already verified (email_confirm: true), so the venue
 * can sign in right away with no OTP / confirmation email, and its profile is
 * set to an active venue owner. Optionally activates a pack for the account.
 */
export async function createVenueAccount(
    formData: FormData
): Promise<{ success?: boolean; error?: string; user?: CreatedVenueAccount }> {
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const fullName = String(formData.get('fullName') || '').trim();
    const businessName = String(formData.get('businessName') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const planId = String(formData.get('planId') || '').trim();

    // Error codes are translated client-side (Admin.users.create.errors.*)
    if (!EMAIL_PATTERN.test(email)) return { error: 'invalid_email' };
    if (password.length < MIN_PASSWORD_LENGTH) return { error: 'password_too_short' };

    const admin = await getAdminClient();
    if (!admin) return { error: 'Unauthorized' };
    const { adminDb, user } = admin;

    const { data: created, error: createError } = await adminDb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || null, name: fullName || null, created_by_admin: true },
    });

    if (createError || !created?.user) {
        if (createError?.code === 'email_exists' || /already (been )?registered|already exists/i.test(createError?.message || '')) {
            return { error: 'email_exists' };
        }
        console.error('Error creating venue account:', createError);
        return { error: createError?.message || 'Failed to create account' };
    }

    const newUserId = created.user.id;

    try {
        // The on_auth_user_created trigger inserts the profile; the upsert makes it an active venue owner either way.
        const { data: profile, error: profileError } = await adminDb
            .from('profiles')
            .upsert({
                id: newUserId,
                email,
                full_name: fullName || null,
                business_name: businessName || null,
                phone: phone || null,
                role: 'venue_owner',
                status: 'active',
            }, { onConflict: 'id' })
            .select('id, full_name, email, role, status, created_at')
            .single();

        if (profileError) throw profileError;

        if (planId) {
            const { data: plan, error: planError } = await adminDb
                .from('subscription_plans')
                .select('id, duration_months')
                .eq('id', planId)
                .single();
            if (planError) throw planError;

            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + (plan.duration_months || 1));

            const { error: subscriptionError } = await adminDb
                .from('user_subscriptions')
                .insert({
                    user_id: newUserId,
                    plan_id: plan.id,
                    status: 'active',
                    started_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                });
            if (subscriptionError) throw subscriptionError;
        }

        await adminDb.from('admin_logs').insert({
            admin_id: user.id,
            action: 'created_venue_account',
            entity_type: 'user',
            entity_id: newUserId,
            details: { email, plan_id: planId || null },
        });

        revalidatePath('/admin/users');
        return { success: true, user: profile as CreatedVenueAccount };
    } catch (error: unknown) {
        // Roll back the half-created account so the admin can simply retry with the same email
        console.error('Error setting up venue account:', error);
        await adminDb.auth.admin.deleteUser(newUserId);
        const message = error instanceof Error
            ? error.message
            : (error as { message?: string })?.message || 'Failed to create account';
        return { error: message };
    }
}
