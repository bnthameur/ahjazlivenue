import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }: { searchParams: { status?: string } }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const statusFilter = searchParams.status || 'pending';

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', statusFilter)
        .eq('role', 'venue_owner')
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error loading users: {error.message}
            </div>
        );
    }

    return <AdminUsersClient initialUsers={users || []} statusFilter={statusFilter} />;
}
