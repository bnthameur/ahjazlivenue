import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectPreferredLocale } from '@/i18n/locale-utils';

export default async function LoginRedirectPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = detectPreferredLocale({
    cookieLocale: cookieStore.get('NEXT_LOCALE')?.value,
    referer: headerStore.get('referer'),
    acceptLanguage: headerStore.get('accept-language')
  });

  redirect(`/${locale}/login`);
}
