'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { daysUntil, type UserSubscriptionSummary } from '@/lib/owner-billing';

interface Plan {
    id: string;
    name: string | null;
    name_ar?: string | null;
    name_fr?: string | null;
    price_monthly?: number | null;
    price_yearly?: number | null;
    duration_months?: number | null;
    max_venues?: number | null;
    max_images_per_venue?: number | null;
    max_videos_per_venue?: number | null;
}

interface Receipt {
    id: string;
    receipt_url: string | null;
    payment_method: string | null;
    amount: number | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    created_at: string;
    reviewed_at: string | null;
}

interface PlatformSetting {
    key: string;
    value: string | null;
}

interface BillingSettingsSectionProps {
    userId: string;
    plans: Plan[];
    subscription: UserSubscriptionSummary | null;
    receipts: Receipt[];
    settings: PlatformSetting[];
}

// Lightbox modal for displaying receipt images inline
function ReceiptLightbox({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute -top-10 end-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        aria-label="إغلاق"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={url}
                        alt="وصل الدفع"
                        className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function BillingSettingsSection({
    userId,
    plans,
    subscription,
    receipts: initialReceipts,
    settings,
}: BillingSettingsSectionProps) {
    const supabase = createClient();
    const { t, language } = useLanguage();
    const [selectedPlanId, setSelectedPlanId] = useState<string>(subscription?.subscription_plans?.id || plans[0]?.id || '');
    const [paymentMethod, setPaymentMethod] = useState<'ccp' | 'baridimob'>('ccp');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [receipts, setReceipts] = useState(initialReceipts);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
    const currentPlan = subscription?.subscription_plans;

    // Stable helper: find the first matching key from platform_settings
    const getSetting = useCallback(
        (keys: string[]): string | null => {
            for (const key of keys) {
                const found = settings.find((s) => s.key === key);
                if (found?.value && found.value.trim() !== '') return found.value;
            }
            return null;
        },
        [settings],
    );

    const onlinePaymentUrl = useMemo(() => getSetting(['online_payment_url', 'payment_link', 'owner_payment_link']), [getSetting]);

    // CCP fields — keys exactly as admin saves them
    const ccpName    = useMemo(() => getSetting(['ccp_name']), [getSetting]);
    const ccpNumber  = useMemo(() => getSetting(['ccp_number']), [getSetting]);
    const ccpKey     = useMemo(() => getSetting(['ccp_key']), [getSetting]);
    const ccpAddress = useMemo(() => getSetting(['ccp_address']), [getSetting]);

    // Baridimob fields — keys exactly as admin saves them
    const baridimobName   = useMemo(() => getSetting(['baridimob_name']), [getSetting]);
    const baridimobRip    = useMemo(() => getSetting(['baridimob_rip']), [getSetting]);

    const hasCcpInfo      = Boolean(ccpName || ccpNumber || ccpKey || ccpAddress);
    const hasBaridimobInfo = Boolean(baridimobName || baridimobRip);

    const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedPlan) return;

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `payment-receipts/${userId}/${selectedPlan.id}-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('venue-images')
                .upload(filePath, file, { upsert: true });
            if (uploadError) throw new Error(uploadError.message);

            const { data: publicData } = supabase.storage
                .from('venue-images')
                .getPublicUrl(filePath);

            const { data: receiptRow, error: receiptError } = await supabase
                .from('payment_receipts')
                .insert({
                    user_id: userId,
                    receipt_url: publicData.publicUrl,
                    payment_method: paymentMethod,
                    amount: selectedPlan.price_monthly || 0,
                    status: 'pending',
                })
                .select('id, receipt_url, payment_method, amount, status, admin_note, created_at, reviewed_at')
                .single();

            if (receiptError) throw new Error(receiptError.message);
            setReceipts((prev) => [receiptRow as Receipt, ...prev]);
            setSuccess(t('settings.billing.receipt_success'));
        } catch (uploadErr) {
            const message = uploadErr instanceof Error ? uploadErr.message : t('settings.billing.receipt_error');
            setError(message);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '-');

    const isValidName = (n?: string | null) => {
        if (!n) return false;
        const s = n.trim();
        if (s.length === 0) return false;
        if (/^[?\uFF1F？\s]+$/.test(s)) return false;
        if (/^(plan|pack|test|placeholder)/i.test(s)) return false;
        return true;
    };

    const getPlanName = (plan?: Plan | { id?: string; name?: string | null; name_ar?: string | null; name_fr?: string | null; duration_months?: number | null } | null) => {
        if (!plan) return t('settings.billing.owner_pack');
        if (language === 'ar' && isValidName(plan.name_ar)) return plan.name_ar!;
        if (language === 'fr' && isValidName((plan as Plan).name_fr)) return (plan as Plan).name_fr!;
        if (isValidName(plan.name)) return plan.name!;
        const months = plan.duration_months || 0;
        if (months >= 6) return language === 'ar' ? 'الباقة المميزة' : language === 'fr' ? 'Pack Premium' : 'Premium';
        return language === 'ar' ? 'الباقة الأساسية' : language === 'fr' ? 'Pack Starter' : 'Starter';
    };

    const getDurationLabel = (months?: number | null) => {
        if (!months) return '';
        return t('settings.billing.for_duration').replace('{months}', String(months));
    };

    const getSubscriptionStatusLabel = (status?: string | null) => {
        switch (status) {
            case 'active':    return t('settings.billing.status_active');
            case 'expired':   return t('settings.billing.status_expired');
            case 'cancelled': return t('settings.billing.status_cancelled');
            default:          return t('settings.billing.status_pending');
        }
    };

    const getReceiptStatusLabel = (status: Receipt['status']) => {
        switch (status) {
            case 'approved': return t('status.approved');
            case 'rejected': return t('status.rejected');
            default:         return t('status.pending');
        }
    };

    // Determine whether a receipt URL points to an image (not a PDF)
    const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|$)/i.test(url);

    const remainingDays   = daysUntil(subscription?.expires_at);
    const isExpired       = remainingDays !== null && remainingDays < 0;
    const isExpiringSoon  = remainingDays !== null && remainingDays >= 0 && remainingDays <= 10;

    return (
        <div className="space-y-6">
            {/* Lightbox */}
            {lightboxUrl && <ReceiptLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {success && (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Current Subscription Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">{t('settings.billing.current_title')}</h3>
                {subscription ? (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{t('settings.billing.current_pack')}</p>
                                <p className="font-semibold text-slate-900">{getPlanName(currentPlan)}</p>
                                {currentPlan?.duration_months && <p className="text-xs text-slate-500 mt-0.5">{getDurationLabel(currentPlan.duration_months)}</p>}
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{t('settings.billing.current_status')}</p>
                                <p className={`font-semibold ${isExpired ? 'text-red-600' : subscription.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {isExpired ? t('settings.billing.status_expired') : getSubscriptionStatusLabel(subscription.status)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{t('settings.billing.current_starts')}</p>
                                <p className="font-semibold text-slate-900">{formatDate(subscription.started_at)}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">{t('settings.billing.current_ends')}</p>
                                <p className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-900'}`}>
                                    {formatDate(subscription.expires_at)}
                                    {remainingDays !== null && remainingDays >= 0 && <span className="text-xs font-normal text-slate-500 ms-1">({remainingDays}j)</span>}
                                </p>
                            </div>
                        </div>
                        {isExpired && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                <p className="font-semibold">{t('settings.billing.subscription_expired')}</p>
                                <p className="mt-1">{t('settings.billing.subscription_expired_desc')}</p>
                            </div>
                        )}
                        {isExpiringSoon && !isExpired && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                <p className="font-semibold">{t('settings.billing.subscription_expiring').replace('{days}', String(remainingDays))}</p>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-slate-500">{t('settings.billing.no_subscription')}</p>
                )}
            </div>

            {/* Choose Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-1">{t('settings.billing.choose_plan')}</h3>
                <p className="text-sm text-slate-500 mb-5">{t('settings.billing.choose_plan_desc')}</p>

                {plans.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500 text-center">{t('settings.billing.no_plans')}</div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {plans.map((plan) => {
                            const selected = selectedPlanId === plan.id;
                            const duration = plan.duration_months || 1;
                            const isLimitedOffer = duration >= 6;
                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`group relative rounded-2xl border-2 p-5 text-left transition-all ${
                                        isLimitedOffer && !selected
                                            ? 'border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/60 hover:border-amber-400 hover:shadow-md'
                                            : selected
                                                ? 'border-primary-500 bg-primary-50/50 shadow-sm ring-1 ring-primary-200'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                    }`}
                                >
                                    {isLimitedOffer && (
                                        <div className="absolute -top-3 start-4">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                {t('settings.billing.limited_offer')}
                                            </span>
                                        </div>
                                    )}
                                    {selected && (
                                        <div className="absolute top-3 end-3">
                                            <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                        </div>
                                    )}
                                    <p className={`text-sm font-medium mb-1 ${isLimitedOffer ? 'text-amber-700' : 'text-slate-500'}`}>{getPlanName(plan)}</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-bold text-slate-900">
                                            {plan.price_monthly ? plan.price_monthly.toLocaleString() : '0'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-500">DA</span>
                                    </div>
                                    <p className={`text-sm mt-1 ${isLimitedOffer ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>{getDurationLabel(duration)}</p>

                                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>1 {t('settings.billing.venue_count')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>{plan.max_images_per_venue ?? 5} {t('settings.billing.max_images')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span>{plan.max_videos_per_venue ?? 0} {t('settings.billing.max_videos')}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Payment Methods */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-5">
                    {t('settings.billing.payment_method')}
                </h3>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Manual Payment */}
                    <div className="space-y-5">
                        <div className="rounded-xl bg-slate-50 p-5">
                            <h4 className="font-semibold text-slate-900 mb-3">{t('settings.billing.manual_payment')}</h4>
                            <p className="text-sm text-slate-600 mb-4">{t('settings.billing.manual_payment_desc')}</p>

                            {/* Payment method selector — CCP and Baridimob only */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.billing.payment_method')}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            { value: 'ccp' as const, label: 'CCP' },
                                            { value: 'baridimob' as const, label: 'Baridimob' },
                                        ] as const
                                    ).map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setPaymentMethod(opt.value)}
                                            className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                                                paymentMethod === opt.value
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CCP credentials */}
                            {paymentMethod === 'ccp' && (
                                <div className="space-y-2">
                                    {hasCcpInfo ? (
                                        <div className="space-y-2">
                                            {ccpName && (
                                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold shrink-0">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">{t('settings.billing.ccp_name')}</p>
                                                        <p className="text-sm font-semibold text-slate-900 select-all">{ccpName}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {ccpNumber && (
                                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold shrink-0">CCP</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">{t('settings.billing.ccp_number')}</p>
                                                        <p className="text-sm font-mono font-semibold text-slate-900 select-all">{ccpNumber}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {ccpKey && (
                                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold shrink-0">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">{t('settings.billing.ccp_key')}</p>
                                                        <p className="text-sm font-mono font-semibold text-slate-900 select-all">{ccpKey}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {ccpAddress && (
                                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold shrink-0">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">{t('settings.billing.ccp_address')}</p>
                                                        <p className="text-sm font-semibold text-slate-900">{ccpAddress}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                            {t('settings.billing.ask_admin_ccp')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Baridimob credentials */}
                            {paymentMethod === 'baridimob' && (
                                <div className="space-y-2">
                                    {hasBaridimobInfo ? (
                                        <div className="space-y-2">
                                            {baridimobName && (
                                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 text-xs font-bold shrink-0">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">{t('settings.billing.baridimob_name')}</p>
                                                        <p className="text-sm font-semibold text-slate-900 select-all">{baridimobName}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {baridimobRip && (
                                                <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 text-xs font-bold shrink-0">RIP</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">{t('settings.billing.baridimob_number')}</p>
                                                        <p className="text-sm font-mono font-semibold text-slate-900 select-all">{baridimobRip}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                            {t('settings.billing.ask_admin_baridimob')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Upload receipt */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.billing.upload_receipt')}</label>
                            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-sm font-medium transition-colors ${
                                uploading ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-primary-300 bg-primary-50/50 text-primary-700 hover:bg-primary-50'
                            }`}>
                                {uploading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        {t('settings.billing.uploading_receipt')}
                                    </span>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 mb-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        {t('settings.billing.choose_receipt')}
                                    </>
                                )}
                                <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploading || !selectedPlan} onChange={handleReceiptUpload} />
                            </label>
                            {selectedPlan && (
                                <p className="mt-2 text-xs text-slate-500 text-center">
                                    {getPlanName(selectedPlan)} — {selectedPlan.price_monthly?.toLocaleString()} DA {getDurationLabel(selectedPlan.duration_months)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Online Payment + Receipt History */}
                    <div className="space-y-5">
                        {/* Online payment */}
                        <div className="rounded-xl bg-slate-50 p-5">
                            <h4 className="font-semibold text-slate-900 mb-2">{t('settings.billing.online_payment')}</h4>
                            <p className="text-sm text-slate-600 mb-4">{t('settings.billing.online_payment_desc')}</p>
                            {onlinePaymentUrl ? (
                                <a href={onlinePaymentUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    {t('settings.billing.continue_online_payment')}
                                </a>
                            ) : (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                    {t('settings.billing.online_payment_missing')}
                                </div>
                            )}
                        </div>

                        {/* Receipt History */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <h4 className="font-semibold text-slate-900 mb-4">{t('settings.billing.receipt_history')}</h4>
                            {receipts.length === 0 ? (
                                <div className="text-center py-6">
                                    <svg className="w-10 h-10 text-slate-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p className="text-sm text-slate-400">{t('settings.billing.no_receipts')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[32rem] overflow-y-auto">
                                    {receipts.map((receipt) => (
                                        <div key={receipt.id} className="rounded-lg border border-slate-100 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-slate-900 truncate">
                                                        {receipt.amount ? `${Number(receipt.amount).toLocaleString()} DA` : t('settings.billing.receipt_label')}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{new Date(receipt.created_at).toLocaleDateString()} — {receipt.payment_method || 'CCP'}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    receipt.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    receipt.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {getReceiptStatusLabel(receipt.status)}
                                                </span>
                                            </div>

                                            {/* Inline receipt image with lightbox */}
                                            {receipt.receipt_url && isImageUrl(receipt.receipt_url) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxUrl(receipt.receipt_url!)}
                                                    className="mt-2 block w-full overflow-hidden rounded-lg border border-slate-200 hover:border-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
                                                    aria-label={t('settings.billing.view_receipt')}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={receipt.receipt_url}
                                                        alt={t('settings.billing.receipt_label')}
                                                        className="w-full max-h-40 object-cover"
                                                        loading="lazy"
                                                    />
                                                    <span className="flex items-center justify-center gap-1.5 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                        {t('settings.billing.view_receipt')}
                                                    </span>
                                                </button>
                                            )}

                                            {/* For non-image files (PDF), keep a text link but avoid raw URL exposure */}
                                            {receipt.receipt_url && !isImageUrl(receipt.receipt_url) && (
                                                <a
                                                    href={receipt.receipt_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    {t('settings.billing.view_receipt')}
                                                </a>
                                            )}

                                            {receipt.admin_note && (
                                                <p className="mt-1.5 text-xs text-slate-500">{t('settings.billing.admin_note')}: {receipt.admin_note}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
