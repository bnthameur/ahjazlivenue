import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PageDetailClient from './PageDetailClient';

export default async function PageDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: page, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

    if (error || !page) {
        notFound();
    }

    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('landing_page_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

    return <PageDetailClient page={page} orders={orders || []} />;
}
