import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Get locale from headers/cookies (next-intl handles this)
    const locale = await getLocale();

    // Validate locale
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Load messages for the locale
    const messages = await getMessages({ locale });

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                <Header />
                <main className="min-h-screen pt-16 sm:pt-20">
                    {children}
                </main>
                <Footer />
            </div>
        </NextIntlClientProvider>
    );
}
