/**
 * Platform-wide "free mode" switch, toggled by the admin in /admin/settings.
 * When ON, every owner gets unlimited venues/media and no payment is required.
 * Stored as a row in `platform_settings` (key = FREE_MODE_SETTING_KEY, value = 'true' | 'false').
 *
 * Safe to import from client components. The server-side reader lives in
 * `lib/platform-mode-server.ts` because it needs the service-role client.
 */

export const FREE_MODE_SETTING_KEY = 'free_mode';

export function isFreeModeValue(value: string | null | undefined): boolean {
    return value === 'true';
}

/** Renders a plan limit for display — `Infinity` (free mode) becomes "∞". */
export function formatLimit(limit: number): string {
    return Number.isFinite(limit) ? String(limit) : '∞';
}
