import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const resolvedParams = await searchParams;
    const statusFilter = (resolvedParams?.status as string) || 'pending';

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
