import type { AuthError } from '@supabase/supabase-js';

/** Where Supabase sends users back after Google sign-in or clicking an email link. */
export const AUTH_CALLBACK_URL = 'https://app.ahjazliqaati.com/api/auth/callback';

/** Keys under the `Auth.errors` translation namespace. */
export type AuthErrorKey =
    | 'invalid_credentials'
    | 'email_not_confirmed'
    | 'invalid_code'
    | 'no_account'
    | 'rate_limit'
    | 'weak_password'
    | 'email_exists'
    | 'login_disabled'
    | 'generic';

/** Maps a Supabase auth error to a translated message key. */
export function authErrorKey(error: Pick<AuthError, 'message'> & { code?: string }, fallback: AuthErrorKey = 'generic'): AuthErrorKey {
    const code = error.code || '';
    const message = (error.message || '').toLowerCase();

    if (code === 'invalid_credentials' || message.includes('invalid login credentials')) return 'invalid_credentials';
    // Supabase answers 422 when the Email provider is switched off in Authentication → Providers
    if (code === 'email_provider_disabled' || code === 'signup_disabled' || message.includes('logins are disabled')) return 'login_disabled';
    if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'email_not_confirmed';
    if (code === 'otp_expired' || message.includes('token has expired')) return 'invalid_code';
    if (code === 'otp_disabled' || code === 'user_not_found' || message.includes('signups not allowed')) return 'no_account';
    if (code.startsWith('over_') || message.includes('rate limit') || message.includes('security purposes')) return 'rate_limit';
    if (code === 'weak_password' || message.includes('password should')) return 'weak_password';
    if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered')) return 'email_exists';
    return fallback;
}
