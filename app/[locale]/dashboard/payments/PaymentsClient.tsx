'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getSubscriptionBanner, type UserSubscriptionSummary } from '@/lib/owner-billing';

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

interface PaymentsClientProps {
    userId: string;
    profile: { status?: string | null; full_name?: string | null } | null;
    plans: Plan[];
    subscription: UserSubscriptionSummary | null;
    receipts: Receipt[];
    settings: PlatformSetting[];
}

export default function PaymentsClient({
    userId,
    plans,
    subscription,
    receipts: initialReceipts,
    settings,
}: PaymentsClientProps) {
    const supabase = createClient();
    const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
    const [paymentMethod, setPaymentMethod] = useState<'ccp' | 'bank_transfer'>('ccp');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [receipts, setReceipts] = useState(initialReceipts);
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
    const subscriptionBanner = getSubscriptionBanner(subscription);

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
        const basePayload = {
            user_id: userId,
            status: 'pending_payment',
            created_at: new Date().toISOString(),
        };

        const attempts = [
            { ...basePayload, plan_id: planId },
            { ...basePayload, subscription_plan_id: planId },
        ];

        let lastError: Error | null = null;
        for (const payload of attempts) {
            const { error: insertError } = await supabase.from('user_subscriptions').insert(payload as never);
            if (!insertError) return;
            lastError = new Error(insertError.message);
        }

        if (lastError) throw lastError;
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
            setSuccess('Receipt uploaded successfully. Your pack is now awaiting admin review.');
        } catch (uploadErr) {
            const message = uploadErr instanceof Error ? uploadErr.message : 'Could not upload your receipt.';
            setError(message);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    return (
        <div className="max-w-6xl p-6 lg:p-8">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Payments & Packs</h1>
                    <p className="mt-1 text-slate-600">
                        Choose your venue-owner pack, submit your payment receipt, or continue with online payment.
                    </p>
                </div>

                {subscriptionBanner && (
                    <div className={`mb-6 rounded-2xl border p-4 ${
                        subscriptionBanner.tone === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                        <p className="font-semibold">{subscriptionBanner.title}</p>
                        <p className="mt-1 text-sm">{subscriptionBanner.description}</p>
                    </div>
                )}

                {success && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}
                {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Simple onboarding guide</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            This page is the final part of owner onboarding. Follow the steps below in order.
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">Step 1</p>
                            <p className="mt-2 text-sm text-slate-600">Make sure your personal info and venue-owner profile are completed in settings.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">Step 2</p>
                            <p className="mt-2 text-sm text-slate-600">Choose your pack here and review the amount and included limits.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">Step 3</p>
                            <p className="mt-2 text-sm text-slate-600">Pay online or upload your CCP or bank receipt, then wait for admin approval.</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-slate-900">1. Choose your pack</h2>
                                <p className="text-sm text-slate-500">Pending venue owners should complete this before expecting account activation.</p>
                            </div>

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
                                                <h3 className="text-lg font-semibold text-slate-900">{plan.name || 'Owner Pack'}</h3>
                                                {selected && <span className="rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white">Selected</span>}
                                            </div>
                                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                                {plan.price_monthly ? `${plan.price_monthly.toLocaleString()} DZD` : 'Contact us'}
                                            </p>
                                            <p className="text-sm text-slate-500">per month</p>
                                            <div className="mt-4 space-y-1 text-sm text-slate-600">
                                                <p>Max venues: {plan.max_venues ?? '-'}</p>
                                                <p>Images per venue: {plan.max_images_per_venue ?? '-'}</p>
                                                <p>Videos per venue: {plan.max_videos_per_venue ?? '-'}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-slate-900">2. Pay online or upload a receipt</h2>
                                <p className="text-sm text-slate-500">After payment, the admin team can activate your selected pack.</p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="font-semibold text-slate-900">Manual payment</h3>
                                    <p className="mt-2 text-sm text-slate-600">Use the payment details below, then upload your receipt.</p>
                                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                                        <p><span className="font-medium">CCP:</span> {ccpNumber || 'Ask admin to configure CCP number in platform settings.'}</p>
                                        <p><span className="font-medium">Bank:</span> {bankAccount || 'Ask admin to configure bank account details in platform settings.'}</p>
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(event) => setPaymentMethod(event.target.value as 'ccp' | 'bank_transfer')}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                                        >
                                            <option value="ccp">CCP receipt</option>
                                            <option value="bank_transfer">Bank transfer receipt</option>
                                        </select>
                                    </div>

                                    <div className="mt-5">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Upload receipt</label>
                                        <label className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-5 text-sm font-medium ${
                                            uploading ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-primary-300 bg-primary-50 text-primary-700'
                                        }`}>
                                            {uploading ? 'Uploading...' : 'Choose receipt image or PDF'}
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
                                    <h3 className="font-semibold text-slate-900">Online payment</h3>
                                    <p className="mt-2 text-sm text-slate-600">Use the direct payment link if your gateway is configured.</p>

                                    {onlinePaymentUrl ? (
                                        <a
                                            href={onlinePaymentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                                        >
                                            Continue to online payment
                                        </a>
                                    ) : (
                                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                            No online payment link is configured yet. You can still upload a manual receipt today.
                                        </div>
                                    )}

                                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">Selected pack</p>
                                        <p className="mt-1">{selectedPlan?.name || 'Choose a pack first'}</p>
                                        <p className="mt-1">{selectedPlan?.price_monthly ? `${selectedPlan.price_monthly.toLocaleString()} DZD / month` : '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-bold text-slate-900">Current subscription</h2>
                            {subscription ? (
                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Pack</p>
                                        <p className="font-semibold text-slate-900">{subscription.subscription_plans?.name || 'Owner pack'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                                        <p className="font-semibold capitalize text-slate-900">{subscription.status || 'pending'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Expires</p>
                                        <p className="font-semibold text-slate-900">
                                            {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'Not set yet'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-slate-500">No subscription has been activated yet.</p>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-bold text-slate-900">Receipt history</h2>
                            <div className="mt-4 space-y-3">
                                {receipts.length === 0 ? (
                                    <p className="text-sm text-slate-500">No receipts submitted yet.</p>
                                ) : (
                                    receipts.map((receipt) => (
                                        <div key={receipt.id} className="rounded-xl border border-slate-200 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{receipt.amount ? `${Number(receipt.amount).toLocaleString()} DZD` : 'Payment receipt'}</p>
                                                    <p className="text-xs text-slate-500">{new Date(receipt.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    receipt.status === 'approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : receipt.status === 'rejected'
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {receipt.status}
                                                </span>
                                            </div>
                                            {receipt.receipt_url && (
                                                <a
                                                    href={receipt.receipt_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex text-sm font-medium text-primary-700 hover:text-primary-800"
                                                >
                                                    View receipt
                                                </a>
                                            )}
                                            {receipt.admin_note && <p className="mt-2 text-sm text-slate-500">Admin note: {receipt.admin_note}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
