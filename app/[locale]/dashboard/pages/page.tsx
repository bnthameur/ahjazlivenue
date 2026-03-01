import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import PagesClient from './PagesClient';

export default async function PagesPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: landingPages } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

    return <PagesClient landingPages={landingPages || []} />;
}
