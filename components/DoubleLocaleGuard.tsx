'use client';

import { useEffect } from 'react';
import { VALID_LOCALES } from '@/i18n/routing';

/**
 * This component guards against double locale URLs like /ar/en/dashboard
 * It checks on mount and redirects to the correct URL if needed
 */
export default function DoubleLocaleGuard({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Check for double locale pattern: /xx/yy/... where both xx and yy are valid locales
        const pathname = window.location.pathname;
        const localePattern = new RegExp(`^/(${VALID_LOCALES.join('|')})/(${VALID_LOCALES.join('|')})/?(.*)`);
        const match = pathname.match(localePattern);

        if (match) {
            // Double locale detected: /ar/en/dashboard/venues
            // match[1] = first locale (ar), match[2] = second locale (en), match[3] = rest (dashboard/venues)
            const firstLocale = match[1];
            const secondLocale = match[2];
            const rest = match[3];
            
            // The second locale is the actual intended locale
            // Redirect from /ar/en/dashboard to /en/dashboard
            const correctPath = `/${secondLocale}/${rest}`;
            
            console.warn(`[DoubleLocaleGuard] Detected double locale URL. Redirecting from ${pathname} to ${correctPath}`);
            window.location.replace(correctPath);
        }
    }, []);

    return <>{children}</>;
}
