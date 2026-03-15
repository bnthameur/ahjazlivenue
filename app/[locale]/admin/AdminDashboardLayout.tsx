'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '@/components/LanguageProvider';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Emoji } from 'react-apple-emojis';

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'venue_owner' | 'admin';
    status: 'pending' | 'active' | 'rejected';
    business_name: string | null;
}

interface AdminDashboardLayoutProps {
    user: User;
    profile: Profile | null;
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

const UsersIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

const PaymentsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const NotificationsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

// Admin navigation - different from venue owner
const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, labelKey: 'admin.nav.dashboard' },
    { name: 'Venues', href: '/admin/venues', icon: VenuesIcon, labelKey: 'admin.nav.venues' },
    { name: 'Users', href: '/admin/users', icon: UsersIcon, labelKey: 'admin.nav.users' },
    { name: 'Payments', href: '/admin/payments', icon: PaymentsIcon, labelKey: 'admin.nav.payments' },
    { name: 'Inquiries', href: '/admin/inquiries', icon: InquiriesIcon, labelKey: 'admin.nav.inquiries' },
    { name: 'Settings', href: '/admin/settings', icon: SettingsIcon, labelKey: 'admin.nav.settings' },
];

function AdminLanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const languageSwitcherTitle = language === 'ar'
        ? 'تغيير اللغة'
        : language === 'fr'
            ? 'Changer de langue'
            : 'Change language';

    const handleSwitch = (lang: string) => {
        setLanguage(lang as 'en' | 'fr' | 'ar');
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
                                    {language === lang && <span>✓</span>}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminDashboardLayout({ user, profile, children }: AdminDashboardLayoutProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { t, dir } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notifications count
    useState(() => {
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
            .channel('admin-notifications-count')
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
    });

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
        router.refresh();
    };

    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || t('admin.title');

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
                                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                        <Emoji name="shield" width={20} />
                                    </div>
                                    <span className="text-lg font-bold text-slate-800">{t('admin.title')}</span>
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mobile Sidebar Content */}
                            <div className="flex-1 overflow-y-auto">
                                <nav className="px-2 py-4 space-y-1">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                                    ? 'bg-purple-50 text-purple-700'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                <Icon />
                                                {t(item.labelKey)}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Mobile User Menu */}
                                <div className="mt-auto border-t border-slate-100 p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                                            <img
                                                src={profile?.avatar_url || user.user_metadata?.avatar_url}
                                                alt={displayName}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                                                {displayName[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                                            <p className="text-xs text-slate-500 truncate">Administrator</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <AdminLanguageSwitcher />
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

            {/* Desktop Sidebar */}
            <aside className={`w-56 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-screen ${dir === 'rtl' ? 'border-l border-r-0 right-0' : 'left-0'}`}>
                {/* Logo */}
                <div className="h-12 flex items-center px-3 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Emoji name="shield" width={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{t('admin.title')}</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${isActive
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon />
                                {t(item.labelKey)}
                            </Link>
                        );
                    })}
                </nav>
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

                        {/* Mobile Logo */}
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Emoji name="shield" width={20} />
                            </div>
                            <span className="text-lg font-bold text-slate-800">{t('admin.title')}</span>
                        </div>
                    </div>

                    {/* User Menu - Desktop Only */}
                    <div className="hidden md:flex items-center gap-3">
                        <AdminLanguageSwitcher />
                        <div className="flex items-center gap-2">
                            {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                                <img
                                    src={profile?.avatar_url || user.user_metadata?.avatar_url}
                                    alt={displayName}
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                />
                            ) : (
                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-medium">
                                    {displayName[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">
                                {displayName}
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
                    {children}
                </main>
            </div>
        </div>
    );
}
