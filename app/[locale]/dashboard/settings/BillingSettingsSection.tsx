'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import type { UserSubscriptionSummary } from '@/lib/owner-billing';

interface Plan {
    id: string;
    name: string | null;
    name_ar?: string | null;
    price_monthly?: number | null;
    price_yearly?: number | null;
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
    const [paymentMethod, setPaymentMethod] = useState<'ccp' | 'bank_transfer'>('ccp');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [receipts, setReceipts] = useState(initialReceipts);

    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
    const currentPlan = subscription?.subscription_plans;

    const onlinePaymentUrl = useMemo(
        () => settings.find((item) => ['online_payment_url', 'payment_link', 'owner_payment_link'].includes(item.key))?.value || null,
        [settings]
    );
    const ccpNumber = useMemo(
        () => settings.find((item) => ['ccp_number', 'payment_ccp_number'].includes(item.key))?.value || null,
        [settings]
    );
    const bankAccount = useMemo(
        () => settings.find((item) => ['bank_account', 'bank_account_number'].includes(item.key))?.value || null,
        [settings]
    );

    const upsertPendingSubscription = async (planId: string) => {
        const payload = {
            user_id: userId,
            plan_id: planId,
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('user_subscriptions').insert(payload as never);
        if (insertError) {
            throw new Error(insertError.message);
        }
    };

    const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedPlan) return;

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const ext = file.name.split('.').pop() || 'jpg';
            const filePath = `payment-receipts/${userId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('venue-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw new Error(uploadError.message);

            const { data: publicData } = supabase.storage
                .from('venue-images')
                .getPublicUrl(filePath);

            await upsertPendingSubscription(selectedPlan.id);

            const { data: receiptRow, error: receiptError } = await supabase
                .from('payment_receipts')
                .insert({
                    user_id: userId,
                    receipt_url: publicData.publicUrl,
                    payment_method: paymentMethod,
                    amount: selectedPlan.price_monthly || selectedPlan.price_yearly || 0,
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
    const getPlanName = (plan?: Plan | null) => {
        if (!plan) return t('settings.billing.owner_pack');
        return language === 'ar' ? plan.name_ar || plan.name || t('settings.billing.owner_pack') : plan.name || t('settings.billing.owner_pack');
    };
    const displayPlanName = getPlanName(currentPlan);
    const getSubscriptionStatusLabel = (status?: string | null) => {
        switch (status) {
            case 'active':
                return t('settings.billing.status_active');
            case 'expired':
                return t('settings.billing.status_expired');
            case 'cancelled':
                return t('settings.billing.status_cancelled');
            case 'pending':
            default:
                return t('settings.billing.status_pending');
        }
    };
    const getReceiptStatusLabel = (status: Receipt['status']) => {
        switch (status) {
            case 'approved':
                return t('status.approved');
            case 'rejected':
                return t('status.rejected');
            default:
                return t('status.pending');
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">{t('settings.billing.title')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('settings.billing.desc')}</p>
            </div>

            {success && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
            {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h3 className="text-base font-semibold text-slate-900">{t('settings.billing.current_title')}</h3>
                        {subscription ? (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl bg-white p-4">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{t('settings.billing.current_pack')}</p>
                                    <p className="font-semibold text-slate-900">{displayPlanName}</p>
                                </div>
                                <div className="rounded-xl bg-white p-4">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{t('settings.billing.current_status')}</p>
                                    <p className="font-semibold text-slate-900">{getSubscriptionStatusLabel(subscription.status)}</p>
                                </div>
                                <div className="rounded-xl bg-white p-4">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{t('settings.billing.current_starts')}</p>
                                    <p className="font-semibold text-slate-900">{formatDate(subscription.started_at)}</p>
                                </div>
                                <div className="rounded-xl bg-white p-4">
                                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{t('settings.billing.current_ends')}</p>
                                    <p className="font-semibold text-slate-900">{formatDate(subscription.expires_at)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">{t('settings.billing.no_subscription')}</p>
                        )}
                    </div>

                    <div>
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-slate-900">{t('settings.billing.choose_plan')}</h3>
                            <p className="mt-1 text-sm text-slate-500">{t('settings.billing.choose_plan_desc')}</p>
                        </div>
                        {plans.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                                {t('settings.billing.no_plans')}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {plans.map((plan) => {
                                    const selected = selectedPlanId === plan.id;
                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => setSelectedPlanId(plan.id)}
                                            className={`rounded-2xl border p-5 text-left transition-all ${
                                                selected
                                                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <h4 className="text-lg font-semibold text-slate-900">{getPlanName(plan)}</h4>
                                                {selected && (
                                                    <span className="rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white">
                                                        {t('settings.billing.selected')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                                {plan.price_monthly ? `${plan.price_monthly.toLocaleString()} DZD` : t('settings.billing.contact_admin')}
                                            </p>
                                            <p className="text-sm text-slate-500">{t('settings.billing.per_month')}</p>
                                            <div className="mt-4 space-y-1 text-sm text-slate-600">
                                                <p>{t('settings.billing.max_venues')}: {plan.max_venues ?? '-'}</p>
                                                <p>{t('settings.billing.max_images')}: {plan.max_images_per_venue ?? '-'}</p>
                                                <p>{t('settings.billing.max_videos')}: {plan.max_videos_per_venue ?? '-'}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <h3 className="font-semibold text-slate-900">{t('settings.billing.manual_payment')}</h3>
                            <p className="mt-2 text-sm text-slate-600">{t('settings.billing.manual_payment_desc')}</p>
                            <div className="mt-4 space-y-2 text-sm text-slate-700">
                                <p><span className="font-medium">{t('settings.billing.ccp')}:</span> {ccpNumber || t('settings.billing.ask_admin_ccp')}</p>
                                <p><span className="font-medium">{t('settings.billing.bank')}:</span> {bankAccount || t('settings.billing.ask_admin_bank')}</p>
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.billing.payment_method')}</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(event) => setPaymentMethod(event.target.value as 'ccp' | 'bank_transfer')}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                                >
                                    <option value="ccp">{t('settings.billing.ccp_receipt')}</option>
                                    <option value="bank_transfer">{t('settings.billing.bank_receipt')}</option>
                                </select>
                            </div>

                            <div className="mt-5">
                                <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.billing.upload_receipt')}</label>
                                <label className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-5 text-sm font-medium ${
                                    uploading ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-primary-300 bg-primary-50 text-primary-700'
                                }`}>
                                    {uploading ? t('settings.billing.uploading_receipt') : t('settings.billing.choose_receipt')}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        disabled={uploading || !selectedPlan}
                                        onChange={handleReceiptUpload}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <h3 className="font-semibold text-slate-900">{t('settings.billing.online_payment')}</h3>
                            <p className="mt-2 text-sm text-slate-600">{t('settings.billing.online_payment_desc')}</p>

                            {onlinePaymentUrl ? (
                                <a
                                    href={onlinePaymentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                                >
                                    {t('settings.billing.continue_online_payment')}
                                </a>
                            ) : (
                                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                    {t('settings.billing.online_payment_missing')}
                                </div>
                            )}

                            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">{t('settings.billing.selected_plan')}</p>
                                        <p className="mt-1">{selectedPlan ? getPlanName(selectedPlan) : t('settings.billing.select_plan_first')}</p>
                                        <p className="mt-1">{selectedPlan?.price_monthly ? `${selectedPlan.price_monthly.toLocaleString()} DZD / ${t('settings.billing.month_short')}` : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                        <h3 className="text-base font-semibold text-slate-900">{t('settings.billing.receipt_history')}</h3>
                        <div className="mt-4 space-y-3">
                            {receipts.length === 0 ? (
                                <p className="text-sm text-slate-500">{t('settings.billing.no_receipts')}</p>
                            ) : (
                                receipts.map((receipt) => (
                                    <div key={receipt.id} className="rounded-xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {receipt.amount ? `${Number(receipt.amount).toLocaleString()} DZD` : t('settings.billing.receipt_label')}
                                                </p>
                                                <p className="text-xs text-slate-500">{new Date(receipt.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                receipt.status === 'approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : receipt.status === 'rejected'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {getReceiptStatusLabel(receipt.status)}
                                            </span>
                                        </div>
                                        {receipt.receipt_url && (
                                            <a
                                                href={receipt.receipt_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex text-sm font-medium text-primary-700 hover:text-primary-800"
                                            >
                                                {t('settings.billing.view_receipt')}
                                            </a>
                                        )}
                                        {receipt.admin_note && (
                                            <p className="mt-2 text-sm text-slate-500">
                                                {t('settings.billing.admin_note')}: {receipt.admin_note}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
