import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const resolvedParams = await searchParams;
    const statusFilter = (resolvedParams?.status as string) || 'all';

    const [{ data: users, error }, { data: plans }] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .eq('role', 'venue_owner')
            .order('created_at', { ascending: false }),
        supabase
            .from('subscription_plans')
            .select('id, name, name_ar, name_fr, price_monthly, duration_months')
            .eq('is_active', true)
            .order('price_monthly', { ascending: true }),
    ]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error loading users: {error.message}
            </div>
        );
    }

    return <AdminUsersClient initialUsers={users || []} statusFilter={statusFilter} plans={plans || []} />;
}
