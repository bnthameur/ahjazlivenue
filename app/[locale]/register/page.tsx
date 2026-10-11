'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import EmailCodeStep from '@/components/auth/EmailCodeStep';
import { AUTH_CALLBACK_URL, authErrorKey } from '@/components/auth/auth-errors';

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
    const t = useTranslations('Register');
    const tAuth = useTranslations('Auth');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Self sign-up must confirm the email with a code (admin-created accounts skip this)
    const [awaitingCode, setAwaitingCode] = useState(false);

    const supabase = createClient();

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: AUTH_CALLBACK_URL,
            },
        });
        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    const goToDashboard = () => {
        router.replace('/dashboard');
        router.refresh();
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(tAuth('errors.weak_password'));
            return;
        }

        setIsSubmitting(true);
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: { full_name: fullName.trim() || null, name: fullName.trim() || null },
                emailRedirectTo: AUTH_CALLBACK_URL,
            },
        });
        setIsSubmitting(false);

        if (signUpError) {
            setError(tAuth(`errors.${authErrorKey(signUpError)}`));
            return;
        }

        // Supabase hides existing emails behind a fake user with no identities
        if (data.user && data.user.identities?.length === 0) {
            setError(tAuth('errors.email_exists'));
            return;
        }

        // Email confirmation turned off in Supabase → already signed in
        if (data.session) {
            goToDashboard();
            return;
        }

        setEmail(normalizedEmail);
        setAwaitingCode(true);
    };

    const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

    const features = ['easy_listing', 'calendar', 'payments', 'analytics'] as const;

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Register Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md space-y-8"
                >
                    {/* Logo */}
                    <div className="flex items-center">
                        <Image src="/logo.png" alt={t('brand')} width={160} height={52} className="h-12 w-auto object-contain" unoptimized />
                    </div>

                    {/* Welcome Text */}
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">{t('title')}</h1>
                        <p className="mt-2 text-slate-600">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && !awaitingCode && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {awaitingCode ? (
                        <EmailCodeStep
                            email={email}
                            type="signup"
                            onVerified={goToDashboard}
                            onBack={() => setAwaitingCode(false)}
                        />
                    ) : (
                        <form onSubmit={handleEmailSignUp} className="space-y-4">
                            <div>
                                <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-1.5">{tAuth('full_name')}</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    autoComplete="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    maxLength={120}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1.5">{tAuth('email')}</label>
                                <input
                                    id="register-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    dir="ltr"
                                    placeholder="name@example.com"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1.5">{tAuth('password')}</label>
                                <input
                                    id="register-password"
                                    type="password"
                                    required
                                    minLength={MIN_PASSWORD_LENGTH}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    dir="ltr"
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-slate-400">{t('password_hint')}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-4 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('creating') : t('create_btn')}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <div className="h-px flex-1 bg-slate-200" />
                                {tAuth('or')}
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>
                        </form>
                    )}

                    {/* Google Sign Up */}
                    {!awaitingCode && (
                        <button
                            onClick={handleGoogleSignUp}
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
                                {isLoading ? t('creating') : t('google_btn')}
                            </span>
                        </button>
                    )}

                    {/* Sign In Link */}
                    <p className="text-center text-slate-600">
                        {t('has_account')}{' '}
                        <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
                            {t('login_link')}
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
                            {features.map((feature, index) => (
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
