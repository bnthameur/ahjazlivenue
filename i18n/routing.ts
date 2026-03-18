import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['ar', 'fr', 'en'],
    defaultLocale: 'ar'
});

export type Locale = typeof routing.locales[number];

/**
 * List of valid locale codes
 */
export const VALID_LOCALES: readonly string[] = routing.locales;

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
    return VALID_LOCALES.includes(locale);
}

/**
 * Extracts the locale from a pathname
 * Returns null if no locale is found
 */
export function getLocaleFromPath(pathname: string): Locale | null {
    const match = pathname.match(/^\/(en|fr|ar)(?:\/|$)/);
    const locale = match?.[1];
    return locale && isValidLocale(locale) ? locale : null;
}

/**
 * Removes the locale prefix from a pathname
 * Returns the pathname without the locale prefix
 */
export function removeLocaleFromPath(pathname: string): string {
    const locale = getLocaleFromPath(pathname);
    if (!locale) {
        return pathname;
    }
    // Remove the locale prefix (e.g., /en/dashboard -> /dashboard)
    return pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
}

/**
 * Creates a new pathname with the specified locale
 * Properly replaces any existing locale prefix
 */
export function createLocalizedPath(pathname: string, newLocale: Locale): string {
    const pathWithoutLocale = removeLocaleFromPath(pathname);
    // Ensure path starts with /
    const normalizedPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`;
    return `/${newLocale}${normalizedPath === '/' ? '' : normalizedPath}`;
}

/**
 * Gets the current locale from pathname, or returns default locale
 */
export function getCurrentLocale(pathname: string): Locale {
    return getLocaleFromPath(pathname) || routing.defaultLocale;
}

/**
 * Check if a pathname is within a localized route (starts with /en, /fr, or /ar)
 */
export function isLocalizedPath(pathname: string): boolean {
    return getLocaleFromPath(pathname) !== null;
}
