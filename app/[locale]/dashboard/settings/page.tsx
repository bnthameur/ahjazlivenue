import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user?.id)
        .single();

    const { data: usage } = await supabase
        .from('usage')
        .select('*')
        .eq('user_id', user?.id)
        .single();

    return (
        <SettingsClient
            profile={profile}
            subscription={subscription}
            usage={usage}
        />
    );
}
