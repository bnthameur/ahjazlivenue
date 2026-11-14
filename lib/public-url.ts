/** Public marketing site (ahjazlilanding). Arabic is unprefixed there. */
export const PUBLIC_SITE_URL = 'https://ahjazliqaati.com';

export const publicListingUrl = (slugOrId: string, locale: string) =>
    `${PUBLIC_SITE_URL}${locale === 'ar' ? '' : `/${locale}`}/salles/${slugOrId}`;
