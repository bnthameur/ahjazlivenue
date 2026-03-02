import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import AdminDashboardLayout from './AdminDashboardLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Check if user is admin — show 404 for non-admins
    if (!profile || profile.role !== 'admin') {
        notFound();
    }

    return (
        <AdminDashboardLayout
            user={user}
            profile={profile}
        >
            {children}
        </AdminDashboardLayout>
    );
}
