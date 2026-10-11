'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AUTH_CALLBACK_URL, authErrorKey } from './auth-errors';

const RESEND_COOLDOWN_SECONDS = 60;

interface EmailCodeStepProps {
    email: string;
    /** 'email' = sign-in code, 'signup' = confirm a new self-registered account */
    type: Extract<EmailOtpType, 'email' | 'signup'>;
    onVerified: () => void | Promise<void>;
    onBack: () => void;
}

/**
 * Second step of email OTP: the user types the code Supabase emailed them.
 * The session cookie is set by the browser client once verifyOtp succeeds.
 */
export default function EmailCodeStep({ email, type, onVerified, onBack }: EmailCodeStepProps) {
    const t = useTranslations('Auth');
    const supabase = createClient();
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setIsVerifying(true);
        setError('');
        setNotice('');

        const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type });
        if (verifyError) {
            setError(t(`errors.${authErrorKey(verifyError, 'invalid_code')}`));
            setIsVerifying(false);
            return;
        }
        await onVerified();
    };

    const handleResend = async () => {
        setError('');
        setNotice('');
        const { error: resendError } = type === 'signup'
            ? await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: AUTH_CALLBACK_URL } })
            : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: AUTH_CALLBACK_URL } });

        if (resendError) {
            setError(t(`errors.${authErrorKey(resendError)}`));
            return;
        }
        setNotice(t('code_resent'));
        setCooldown(RESEND_COOLDOWN_SECONDS);
    };

    return (
        <form onSubmit={handleVerify} className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('code_title')}</h2>
                <p className="mt-1 text-sm text-slate-600">
                    {t('code_sent')} <span className="font-medium text-slate-900" dir="ltr">{email}</span>
                </p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}
            {notice && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{notice}</div>
            )}

            <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-slate-700 mb-1.5">{t('code_label')}</label>
                <input
                    ref={inputRef}
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    dir="ltr"
                    placeholder="••••••"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            <button
                type="submit"
                disabled={isVerifying || code.length < 6}
                className="w-full px-4 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isVerifying ? t('verifying') : t('verify_btn')}
            </button>

            <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-700">
                    {t('change_email')}
                </button>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="font-medium text-primary-600 hover:text-primary-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    {cooldown > 0 ? t('resend_in', { seconds: cooldown }) : t('resend_btn')}
                </button>
            </div>
        </form>
    );
}
