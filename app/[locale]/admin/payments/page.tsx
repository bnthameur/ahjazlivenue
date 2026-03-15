import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminPaymentsClient from './AdminPaymentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfile?.role !== 'admin') redirect('/dashboard');

    // Fetch all payment receipts with user profile info
    const { data: receipts } = await supabase
        .from('payment_receipts')
        .select(`
            id,
            user_id,
            receipt_url,
            payment_method,
            amount,
            status,
            admin_note,
            created_at,
            reviewed_at
        `)
        .order('created_at', { ascending: false });

    // Fetch profiles for all unique user_ids
    const userIds = [...new Set((receipts || []).map(r => r.user_id).filter(Boolean))];
    let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

        (profiles || []).forEach(p => {
            profileMap[p.id] = { full_name: p.full_name, email: p.email };
        });
    }

    const receiptsWithProfiles = (receipts || []).map(r => ({
        ...r,
        profile: profileMap[r.user_id] || null,
    }));

    // Stats
    const pendingCount = receiptsWithProfiles.filter(r => r.status === 'pending').length;
    const approvedCount = receiptsWithProfiles.filter(r => r.status === 'approved').length;
    const rejectedCount = receiptsWithProfiles.filter(r => r.status === 'rejected').length;
    const totalAmount = receiptsWithProfiles
        .filter(r => r.status === 'approved' && r.amount != null)
        .reduce((sum, r) => sum + Number(r.amount), 0);

    return (
        <div className="p-4 sm:p-6 max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    💳
                    Payment Receipts
                </h1>
                <p className="text-slate-500 text-sm mt-1">Review and manage all submitted payment receipts</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 mb-1">Total Receipts</p>
                    <p className="text-2xl font-bold text-slate-900">{receiptsWithProfiles.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-orange-200 p-4">
                    <p className="text-xs text-orange-600 mb-1">Pending Review</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-green-200 p-4">
                    <p className="text-xs text-green-600 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 mb-1">Total Approved</p>
                    <p className="text-lg font-bold text-slate-900">{totalAmount.toLocaleString()} DZD</p>
                </div>
            </div>

            <AdminPaymentsClient receipts={receiptsWithProfiles as any} />
        </div>
    );
}
