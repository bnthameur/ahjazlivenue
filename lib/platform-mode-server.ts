import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_MODE_SETTING_KEY, isFreeModeValue } from '@/lib/platform-mode';

/**
 * Reads the admin "free mode" switch. ONLY call from server code.
 * Uses the service-role client so RLS on platform_settings never hides it.
 * Fails closed (paid mode) if the setting can't be read.
 */
export async function getPlatformFreeMode(): Promise<boolean> {
    try {
        const { data, error } = await createAdminClient()
            .from('platform_settings')
            .select('value')
            .eq('key', FREE_MODE_SETTING_KEY)
            .maybeSingle();

        if (error) throw error;
        return isFreeModeValue(data?.value);
    } catch (error) {
        console.error('Error reading free mode setting:', error);
        return false;
    }
}
