import { routing, type Locale, getLocaleFromPath } from './routing';

type LocaleDetectionInput = {
    pathname?: string | null;
    cookieLocale?: string | null;
    referer?: string | null;
    acceptLanguage?: string | null;
};

export function resolveLocale(candidate?: string | null): Locale | null {
    if (!candidate) {
        return null;
    }

    const normalized = candidate.toLowerCase().split(/[-_]/)[0];
    return routing.locales.includes(normalized as Locale) ? (normalized as Locale) : null;
}

function extractLocaleFromReferer(referer?: string | null): Locale | null {
    if (!referer) {
        return null;
    }

    try {
        return getLocaleFromPath(new URL(referer).pathname);
    } catch {
        return null;
    }
}

function extractLocaleFromAcceptLanguage(header?: string | null): Locale | null {
    if (!header) {
        return null;
    }

    for (const part of header.split(',')) {
        const locale = resolveLocale(part.trim().split(';')[0]);
        if (locale) {
            return locale;
        }
    }

    return null;
}

export function detectPreferredLocale(input: LocaleDetectionInput = {}): Locale {
    return (
        getLocaleFromPath(input.pathname || '') ||
        resolveLocale(input.cookieLocale) ||
        extractLocaleFromReferer(input.referer) ||
        extractLocaleFromAcceptLanguage(input.acceptLanguage) ||
        routing.defaultLocale
    );
}