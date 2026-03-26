/**
 * Supabase admin client — uses the service role key which bypasses RLS.
 * ONLY import this in server-side code (Server Actions, Route Handlers).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}
if (!serviceRoleKey) {
    throw new Error(
        'Missing env: SUPABASE_SERVICE_ROLE_KEY — add it to your .env file. ' +
        'Find it in the Supabase dashboard under Project Settings → API → service_role.'
    );
}

/**
 * Returns a Supabase client authenticated as the service role.
 * All operations bypass RLS — use with care.
 */
export function createAdminClient() {
    return createClient(supabaseUrl!, serviceRoleKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
