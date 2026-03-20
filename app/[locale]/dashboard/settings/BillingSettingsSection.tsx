'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { daysUntil, type UserSubscriptionSummary } from '@/lib/owner-billing';

interface Plan {
    id: string;
    name: string | null;
    name_ar?: string | null;
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
    const [paymentMethod, setPaymentMethod] = useState<'ccp' | 'baridimob' | 'bank_transfer'>('ccp');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [receipts, setReceipts] = useState(initialReceipts);

    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
    const currentPlan = subscription?.subscription_plans;

    const getSetting = (keys: string[]) => settings.find((s) => keys.includes(s.key))?.value || null;

    const onlinePaymentUrl = useMemo(() => getSetting(['online_payment_url', 'payment_link', 'owner_payment_link']), [settings]);
    const ccpNumber = useMemo(() => getSetting(['ccp_number', 'payment_ccp_number']), [settings]);
    const bankAccount = useMemo(() => getSetting(['bank_account', 'bank_account_number']), [settings]);
    const baridimobInfo = useMemo(() => getSetting(['payment_baridimob']), [settings]);

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
    const getPlanName = (plan?: Plan | { id?: string; name?: string | null; name_ar?: string | null; duration_months?: number | null } | null) => {
        if (!plan) return t('settings.billing.owner_pack');
        return language === 'ar' ? plan.name_ar || plan.name || t('settings.billing.owner_pack') : plan.name || t('settings.billing.owner_pack');
    };

    const getDurationLabel = (months?: number | null) => {
        if (!months) return '';
        return t('settings.billing.for_duration').replace('{months}', String(months));
    };

    const getSubscriptionStatusLabel = (status?: string | null) => {
        switch (status) {
            case 'active': return t('settings.billing.status_active');
            case 'expired': return t('settings.billing.status_expired');
            case 'cancelled': return t('settings.billing.status_cancelled');
            default: return t('settings.billing.status_pending');
        }
    };

    const getReceiptStatusLabel = (status: Receipt['status']) => {
        switch (status) {
            case 'approved': return t('status.approved');
            case 'rejected': return t('status.rejected');
            default: return t('status.pending');
        }
    };

    const remainingDays = daysUntil(subscription?.expires_at);
    const isExpired = remainingDays !== null && remainingDays < 0;
    const isExpiringSoon = remainingDays !== null && remainingDays >= 0 && remainingDays <= 10;

    return (
        <div className="space-y-6">
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

                            <div className="space-y-3">
                                {ccpNumber && (
                                    <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold">CCP</div>
                                        <div>
                                            <p className="text-xs text-slate-500">{t('settings.billing.ccp')}</p>
                                            <p className="text-sm font-mono font-semibold text-slate-900">{ccpNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {baridimobInfo && (
                                    <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 text-xs font-bold">BM</div>
                                        <div>
                                            <p className="text-xs text-slate-500">{t('settings.billing.baridimob')}</p>
                                            <p className="text-sm font-mono font-semibold text-slate-900">{baridimobInfo}</p>
                                        </div>
                                    </div>
                                )}
                                {bankAccount && (
                                    <div className="flex items-center gap-3 rounded-lg bg-white p-3 border border-slate-200">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l9-4 9 4M3 6v14l9 4 9-4V6M3 6l9 4m0 0l9-4m-9 4v14" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">{t('settings.billing.bank')}</p>
                                            <p className="text-sm font-mono font-semibold text-slate-900">{bankAccount}</p>
                                        </div>
                                    </div>
                                )}
                                {!ccpNumber && !baridimobInfo && !bankAccount && (
                                    <p className="text-sm text-amber-600">{t('settings.billing.ask_admin_ccp')}</p>
                                )}
                            </div>
                        </div>

                        {/* Payment method selector */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.billing.payment_method')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'ccp' as const, label: 'CCP' },
                                    { value: 'baridimob' as const, label: 'Baridimob' },
                                    { value: 'bank_transfer' as const, label: t('settings.billing.bank') },
                                ].map((opt) => (
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
                                <div className="space-y-3 max-h-80 overflow-y-auto">
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
                                            {receipt.receipt_url && (
                                                <a href={receipt.receipt_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
