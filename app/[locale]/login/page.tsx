'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';

function LoginContent() {
    const t = useTranslations('Login');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const supabase = createClient();
    const errorParam = searchParams.get('error');

    const locale = useLocale();

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `https://app.ahjazliqaati.com/api/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Login Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Image src="/logo.png" alt={t('brand')} width={180} height={56} className="h-14 w-auto object-contain" unoptimized />
                    </div>

                    {/* Welcome Text */}
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('welcome_title')}</h1>
                        <p className="mt-2 text-slate-600">
                            {t('welcome_subtitle')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {(error || errorParam) && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error || t('auth_error')}
                        </div>
                    )}

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        <span className="text-base font-medium text-slate-700 group-hover:text-slate-900">
                            {isLoading ? t('signing_in') : t('google_btn')}
                        </span>
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-slate-600">
                        {t('no_account')}{' '}
                        <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                            {t('register_link')}
                        </Link>
                    </p>

                    <div className="mt-8 text-center text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} {t('brand')}
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Decorative */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative z-10 flex flex-col justify-end pb-20 px-12 xl:px-20 h-full"
                >
                    <div className="max-w-lg">
                        <h2 className="text-3xl xl:text-4xl font-bold text-white mb-6">
                            {t('hero_title')}
                        </h2>
                        <p className="text-slate-200 text-lg leading-relaxed mb-8">
                            {t('hero_desc')}
                        </p>

                        <div className="space-y-4">
                            {['verified', 'direct', 'secure', 'support'].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-white font-medium">{t(`features.${feature}`)}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
