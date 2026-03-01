'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { Emoji } from 'react-apple-emojis';

export default function Header() {
    const { t, language, setLanguage, dir } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigation = [
        { name: t('nav.browse'), href: '/venues' },
        { name: t('nav.how'), href: '/#how-it-works' },
        { name: t('nav.owners'), href: '/#pricing' },
    ];

    return (
        <header
            dir={dir}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen || isLangMenuOpen
                ? 'bg-white/95 backdrop-blur-md shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Emoji name="classical-building" width={20} />
                        </div>
                        <span className="text-lg font-bold text-slate-900">Ahjazli Qaati</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTA & Language */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Language Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 flex items-center gap-1"
                            >
                                <Emoji name="globe-showing-europe-africa" width={18} />
                                <span className="uppercase text-sm font-medium">{language}</span>
                            </button>

                            <AnimatePresence>
                                {isLangMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                                    >
                                        {(['en', 'fr', 'ar'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => {
                                                    setLanguage(lang);
                                                    setIsLangMenuOpen(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${language === lang ? 'text-primary-600 font-medium bg-primary-50' : 'text-slate-600'
                                                    }`}
                                            >
                                                <span className="uppercase">{lang}</span>
                                                {language === lang && <span>✓</span>}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/dashboard"
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        setUser(null);
                                        window.location.reload();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                >
                                    Sign Out
                                </button>
                                <Link
                                    href="/dashboard/venues/new"
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                                >
                                    {t('nav.list_venue')}
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    {t('nav.signin')}
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                                >
                                    {t('nav.list_venue')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-slate-100"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-4 py-3 text-base font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ))}

                            {/* Mobile Language Switcher */}
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 mt-2 pt-4">
                                <span className="text-slate-600 text-sm font-medium">Language:</span>
                                {(['en', 'fr', 'ar'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${language === lang
                                            ? 'bg-primary-100 text-primary-700 border-primary-200'
                                            : 'bg-white text-slate-600 border-slate-200'
                                            }`}
                                    >
                                        {lang.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 space-y-2 border-t border-slate-100 mt-4">
                                {user ? (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full px-4 py-3 text-center text-base font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                const supabase = createClient();
                                                await supabase.auth.signOut();
                                                setUser(null);
                                                setIsMobileMenuOpen(false);
                                                window.location.reload();
                                            }}
                                            className="block w-full px-4 py-3 text-center text-base font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg transition-colors"
                                        >
                                            Sign Out
                                        </button>
                                        <Link
                                            href="/dashboard/venues/new"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full px-4 py-3 text-center text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                        >
                                            {t('nav.list_venue')}
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full px-4 py-3 text-center text-base font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
                                        >
                                            {t('nav.signin')}
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full px-4 py-3 text-center text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                        >
                                            {t('nav.list_venue')}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
