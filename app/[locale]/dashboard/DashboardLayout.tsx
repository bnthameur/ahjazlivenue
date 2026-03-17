'use client';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Emoji } from 'react-apple-emojis';
import { getSubscriptionBanner, hasActiveOwnerSubscription, type UserSubscriptionSummary } from '@/lib/owner-billing';

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'venue_owner' | 'admin';
    status: 'pending' | 'active' | 'rejected';
    business_name: string | null;
}

interface DashboardLayoutProps {
    user: User;
    profile: Profile | null;
    subscription?: UserSubscriptionSummary | null;
    children: React.ReactNode;
}

// SVG Icons
const HomeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const VenuesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const InquiriesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const NotificationsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Notifications', href: '/dashboard/notifications', icon: NotificationsIcon },
    { name: 'My Venues', href: '/dashboard/venues', icon: VenuesIcon },
    { name: 'Inquiries', href: '/dashboard/inquiries', icon: InquiriesIcon },
    { name: 'Payments', href: '/dashboard/payments', icon: HomeIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

function DashboardLanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const languageSwitcherTitle = language === 'ar'
        ? 'تغيير اللغة'
        : language === 'fr'
            ? 'Changer de langue'
            : 'Change language';

    const handleSwitch = (lang: 'en' | 'fr' | 'ar') => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
                title={languageSwitcherTitle}
            >
                <Emoji name="globe-showing-europe-africa" width={18} />
                <span className="uppercase text-xs font-medium">{language}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute top-full right-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-20"
                        >
                            {(['en', 'fr', 'ar'] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleSwitch(lang)}
                                    className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between ${language === lang ? 'text-primary-600 font-medium bg-primary-50' : 'text-slate-600'
                                        }`}
                                >
                                    <span className="uppercase">{lang}</span>
                                    {language === lang && <span>OK</span>}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DashboardLayout({ user, profile, subscription, children }: DashboardLayoutProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { t, dir } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notifications count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);
        };
        fetchUnreadCount();

        // Realtime subscription for notifications
        const channel = supabase
            .channel('notifications-count')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `recipient_id=eq.${user.id}`
            }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, user.id]);

    // Passing dir to the root div is handled by LanguageProvider, but we might need to enforce it on body or root.
    // Since LanguageProvider wraps the whole app in layout.tsx, the dir should be correct globally.

    // ... existing handleSignOut logic ...

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
        router.refresh();
    };

    const displayName = profile?.full_name || profile?.business_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const isApproved = profile?.status === 'active';
    const isPending = profile?.status === 'pending';
    const isRejected = profile?.status === 'rejected';
    const hasActiveSubscription = hasActiveOwnerSubscription(subscription);
    const subscriptionBanner = getSubscriptionBanner(subscription);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir={dir}>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: dir === 'rtl' ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: dir === 'rtl' ? '100%' : '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`w-72 bg-white flex flex-col fixed inset-y-0 z-40 md:hidden shadow-xl ${dir === 'rtl' ? 'right-0' : 'left-0'}`}
                        >
                            {/* Logo */}
                            <div className="h-16 flex items-center px-4 border-b border-slate-100 justify-between">
                                <Link href="/" className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                        <Emoji name="classical-building" width={20} />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800">Ahjazli Qaati</span>
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Mobile Sidebar Content Duplication (Ideally refactor to Component but inline for now) */}
                            {/* Same content as desktop sidebar logic below */}
                            <div className="flex-1 overflow-y-auto">
                                {isPending && (
                                    <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-amber-700 text-sm">
                                            <Emoji name="hourglass-not-done" width={20} />
                                            <span className="font-medium">{t('dashboard.status.pending')}</span>
                                        </div>
                                        <p className="text-amber-600 text-xs mt-1">{t('dashboard.status.pending_desc')}</p>
                                    </div>
                                )}
                                {isRejected && (
                                    <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-700 text-sm">
                                            <Emoji name="cross-mark" width={20} />
                                            <span className="font-medium">{t('dashboard.status.rejected')}</span>
                                        </div>
                                        <p className="text-red-600 text-xs mt-1">{t('dashboard.status.rejected_desc')}</p>
                                    </div>
                                )}

                                <nav className="px-2 py-4 space-y-1">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                        const Icon = item.icon;
                                        const isDisabled = !isApproved && !['/dashboard', '/dashboard/settings', '/dashboard/payments', '/dashboard/notifications'].includes(item.href);
                                        let labelKey = '';
                                        if (item.href === '/dashboard') labelKey = 'dashboard.nav.home';
                                        else if (item.href === '/dashboard/venues') labelKey = 'dashboard.nav.venues';
                                        else if (item.href === '/dashboard/inquiries') labelKey = 'dashboard.nav.inquiries';
                                        else if (item.href === '/dashboard/settings') labelKey = 'dashboard.nav.settings';

                                        if (isDisabled) return null; // Simplified for mobile view to just hide disabled or show lock? Let's show lock

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                <div className="relative">
                                                    <Icon />
                                                    {item.name === 'Notifications' && unreadCount > 0 && (
                                                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border border-white" />
                                                    )}
                                                </div>
                                                {labelKey ? t(labelKey) : item.name}
                                                {item.name === 'Notifications' && unreadCount > 0 && (
                                                    <span className="ml-auto bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Mobile User Menu (Moved from Header) */}
                                <div className="mt-auto border-t border-slate-100 p-4 space-y-4">
                                    {/* User Profile */}
                                    <div className="flex items-center gap-3">
                                        {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                                            <Image
                                                src={profile?.avatar_url || user.user_metadata?.avatar_url}
                                                alt={displayName}
                                                width={40}
                                                height={40}
                                                className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-sm font-medium">
                                                {displayName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                                            <p className="text-xs text-slate-500 truncate capitalize">{profile?.role || 'User'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <DashboardLanguageSwitcher />
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${isApproved
                                                ? 'bg-green-100 text-green-700'
                                                : isPending
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {profile?.status ? t(`dashboard.status.${profile.status}`) : t('dashboard.status.pending')}
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleSignOut}
                                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            {t('dashboard.header.signout')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Hidden on Mobile */}
            <aside className={`w-56 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-screen ${dir === 'rtl' ? 'border-l border-r-0 right-0' : 'left-0'}`}>
                {/* Logo */}
                <div className="h-12 flex items-center px-3 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Emoji name="classical-building" width={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">Ahjazli Qaati</span>
                    </Link>
                </div>

                {/* ... existing sidebar content ... */}

                {/* Approval Status Banner */}
                {isPending && (
                    <div className="mx-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700 text-xs">
                            <Emoji name="hourglass-not-done" width={16} />
                            <span className="font-medium">{t('dashboard.status.pending')}</span>
                        </div>
                        <p className="text-amber-600 text-xs mt-1">{t('dashboard.status.pending_desc')}</p>
                    </div>
                )}
                {isRejected && (
                    <div className="mx-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 text-xs">
                            <Emoji name="cross-mark" width={16} />
                            <span className="font-medium">{t('dashboard.status.rejected')}</span>
                        </div>
                        <p className="text-red-600 text-xs mt-1">{t('dashboard.status.rejected_desc')}</p>
                    </div>
                )}
                {isApproved && subscriptionBanner && (
                    <div className={`mx-2 mt-2 rounded-lg border p-2 text-xs ${
                        subscriptionBanner.tone === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}>
                        <p className="font-medium">{subscriptionBanner.title}</p>
                        <p className="mt-1">{subscriptionBanner.description}</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        const isDisabled = !isApproved && !['/dashboard', '/dashboard/settings', '/dashboard/payments', '/dashboard/notifications'].includes(item.href);

                        // Map href to translation key
                        let labelKey = '';
                        if (item.href === '/dashboard') labelKey = 'dashboard.nav.home';
                        else if (item.href === '/dashboard/venues') labelKey = 'dashboard.nav.venues';
                        else if (item.href === '/dashboard/inquiries') labelKey = 'dashboard.nav.inquiries';
                        else if (item.href === '/dashboard/settings') labelKey = 'dashboard.nav.settings';

                        if (isDisabled) {
                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-slate-400 cursor-not-allowed"
                                    title="Account approval required"
                                >
                                    <Icon />
                                    {labelKey ? t(labelKey) : item.name}
                                    <span className="ml-auto text-xs"><Emoji name="locked" width={12} /></span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className="relative">
                                    <Icon />
                                    {item.name === 'Notifications' && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                    )}
                                </div>
                                {labelKey ? t(labelKey) : item.name}
                                {item.name === 'Notifications' && unreadCount > 0 && (
                                    <span className="ml-auto bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Add Venue Button */}
                {isApproved && hasActiveSubscription && (
                    <div className="p-3 border-t border-slate-100">
                        <Link
                            href="/dashboard/venues/new"
                            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('dashboard.btn.add_venue')}
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${dir === 'rtl' ? 'md:mr-56' : 'md:ml-56'}`}>
                {/* Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Mobile Logo (only visible when menu closed) */}
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <Emoji name="classical-building" width={20} />
                            </div>
                            <span className="text-lg font-bold text-slate-800">Ahjazli</span>
                        </div>
                    </div>

                    {/* User Menu - Desktop Only */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Language Switcher */}
                        <div className="mx-2">
                            {/* We need to use internal state for the dashboard switcher since it's a separate layout */}
                            <DashboardLanguageSwitcher />
                        </div>

                        <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${isApproved
                            ? 'bg-green-100 text-green-700'
                            : isPending
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {profile?.status ? t(`dashboard.status.${profile.status}`) : t('dashboard.status.pending')}
                        </span>
                        <div className="flex items-center gap-2">
                            {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                                <Image
                                    src={profile?.avatar_url || user.user_metadata?.avatar_url}
                                    alt={displayName}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 rounded-full border border-slate-200 object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xs font-medium">
                                    {displayName[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">
                                { /* Display Business Name primarily, then Full Name */}
                                {profile?.business_name || profile?.full_name || user.user_metadata?.full_name || 'User'}
                            </span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            {t('dashboard.header.signout')}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {isApproved && subscriptionBanner && (
                        <div className="border-b border-slate-200 bg-white/80 px-4 py-3">
                            <div className={`mx-auto max-w-6xl rounded-xl border px-4 py-3 text-sm ${
                                subscriptionBanner.tone === 'error'
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold">{subscriptionBanner.title}</p>
                                        <p>{subscriptionBanner.description}</p>
                                    </div>
                                    <Link
                                        href="/dashboard/payments"
                                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700"
                                    >
                                        Open Payments
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
