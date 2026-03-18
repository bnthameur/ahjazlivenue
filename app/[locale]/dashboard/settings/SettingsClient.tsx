'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { Emoji } from 'react-apple-emojis';
import { Link } from '@/i18n/navigation';
import type { UserSubscriptionSummary } from '@/lib/owner-billing';
import BillingSettingsSection from './BillingSettingsSection';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    business_name: string | null;
    business_description: string | null;
    country?: string;
    status?: 'pending' | 'active' | 'rejected';
}

interface SettingsClientProps {
    profile: Profile | null;
    subscription: UserSubscriptionSummary | null;
    plans: Array<{
        id: string;
        name: string | null;
        name_ar?: string | null;
        price_monthly?: number | null;
        price_yearly?: number | null;
        max_venues?: number | null;
        max_images_per_venue?: number | null;
        max_videos_per_venue?: number | null;
    }>;
    receipts: Array<{
        id: string;
        receipt_url: string | null;
        payment_method: string | null;
        amount: number | null;
        status: 'pending' | 'approved' | 'rejected';
        admin_note: string | null;
        created_at: string;
        reviewed_at: string | null;
    }>;
    settings: Array<{
        key: string;
        value: string | null;
    }>;
    usage: {
        venuesCount: number;
    } | null;
}

export default function SettingsClient({ profile, subscription, plans, receipts, settings, usage }: SettingsClientProps) {
    const supabase = createClient();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        business_name: profile?.business_name || '',
        business_description: profile?.business_description || '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                business_name: profile.business_name || '',
                business_description: profile.business_description || '',
            });
            setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);

    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

    const profileCompletionItems = [
        { label: t('settings.fullname'), done: Boolean(formData.full_name.trim()) },
        { label: t('settings.phone'), done: Boolean(formData.phone.trim()) },
        { label: t('settings.businessname'), done: Boolean(formData.business_name.trim()) },
        { label: t('settings.businessdesc'), done: Boolean(formData.business_description.trim()) },
    ];

    const completedItems = profileCompletionItems.filter((item) => item.done).length;
    const currentPlan = subscription?.subscription_plans || null;
    const maxVenues = currentPlan?.max_venues ?? null;
    const venuesCount = usage?.venuesCount || 0;
    const venuesRemaining = maxVenues == null ? null : Math.max(maxVenues - venuesCount, 0);
    const isPendingAccount = profile?.status === 'pending';

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError('');

            if (!profile?.id) {
                throw new Error('Profile ID missing. Please refresh the page.');
            }

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${profile.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('venue-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('venue-images')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;
            setSuccess(t('settings.success_avatar') || 'Avatar updated successfully');
        } catch (uploadError) {
            const message = uploadError instanceof Error ? uploadError.message : 'Error uploading avatar';
            setError(message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!profile?.id) throw new Error('Profile ID missing');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    business_name: formData.business_name,
                    business_description: formData.business_description,
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;
            setSuccess(t('settings.success_profile') || 'Profile updated successfully!');
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : 'Failed to update profile';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-4xl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('settings.title')}</h1>
                    <p className="mt-1 text-slate-600">{t('settings.desc')}</p>
                </div>

                {isPendingAccount && (() => {
                    const step1Done = completedItems === profileCompletionItems.length;
                    const step2Done = Boolean(currentPlan);
                    const step3Done = receipts.length > 0;
                    const stepsCompleted = [step1Done, step2Done, step3Done].filter(Boolean).length;

                    return (
                        <div className="mb-6 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
                            {/* Progress indicator */}
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                                        style={{ width: `${(stepsCompleted / 3) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-amber-700">{stepsCompleted}/3</span>
                            </div>

                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-2xl">
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-amber-700 shadow-sm">
                                        <span>&#9203;</span>
                                        {t('settings.pending.badge')}
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">{t('settings.pending.title')}</h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {t('settings.pending.desc')}
                                    </p>
                                </div>
                                <Link
                                    href="/dashboard/venues"
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 shrink-0"
                                >
                                    {t('settings.pending.venue_workspace')}
                                </Link>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                <div className={`rounded-2xl border p-4 transition-colors ${step1Done ? 'border-green-200 bg-green-50/80' : 'border-white bg-white/90'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('settings.pending.step')} 1</p>
                                        {step1Done && <span className="text-green-500">&#10003;</span>}
                                    </div>
                                    <p className="mt-1 font-semibold text-slate-900">{t('settings.pending.step1')}</p>
                                    <p className="mt-1 text-sm text-slate-600">{completedItems}/{profileCompletionItems.length} {t('settings.pending.fields_done')}</p>
                                </div>
                                <div className={`rounded-2xl border p-4 transition-colors ${step2Done ? 'border-green-200 bg-green-50/80' : 'border-white bg-white/90'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('settings.pending.step')} 2</p>
                                        {step2Done && <span className="text-green-500">&#10003;</span>}
                                    </div>
                                    <p className="mt-1 font-semibold text-slate-900">{t('settings.pending.step2')}</p>
                                    <p className="mt-1 text-sm text-slate-600">{currentPlan?.name || t('settings.pending.no_pack')}</p>
                                </div>
                                <div className={`rounded-2xl border p-4 transition-colors ${step3Done ? 'border-green-200 bg-green-50/80' : 'border-white bg-white/90'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('settings.pending.step')} 3</p>
                                        {step3Done && <span className="text-green-500">&#10003;</span>}
                                    </div>
                                    <p className="mt-1 font-semibold text-slate-900">{t('settings.pending.step3')}</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {receipts.length > 0
                                            ? `${receipts.length} ${t('settings.pending.receipt_submitted')}`
                                            : t('settings.pending.no_receipt')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {success && (
                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{t('settings.setup_title')}</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    {t('settings.setup_desc')}
                                </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                                {completedItems}/{profileCompletionItems.length}
                            </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {profileCompletionItems.map((item) => (
                                <div
                                    key={item.label}
                                    className={`rounded-xl px-3 py-2 text-sm font-medium ${
                                        item.done ? 'bg-green-100 text-green-700' : 'bg-white text-slate-600'
                                    }`}
                                >
                                    {item.done ? t('settings.complete') : t('settings.missing')}: {item.label}
                                </div>
                            ))}
                        </div>
                        <p className="rounded-2xl border border-blue-200 bg-white p-4 text-sm text-slate-600">
                            {t('settings.setup_hint')}
                        </p>
                        <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('settings.billing.current_pack')}</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{currentPlan?.name || t('settings.billing.choose_plan')}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {maxVenues == null ? t('settings.pending.venue_limit_hint') : `${venuesCount} / ${maxVenues}`}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('settings.pending.venue_workspace')}</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">
                                    {venuesRemaining == null ? t('settings.pending.first_venue') : `${venuesRemaining} ${t('settings.pending.slots_remaining')}`}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href="/dashboard/venues"
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        {t('dashboard.actions.venues_title')}
                                    </Link>
                                    <Link
                                        href="/dashboard/venues/new"
                                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                                    >
                                        {t('dashboard.btn.add_venue')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 mb-6">{t('settings.profile')}</h2>

                    <div className="mb-6 flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <Emoji name="bust-in-silhouette" width={32} />
                                </div>
                            )}
                        </div>
                        <div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                {uploading ? t('settings.uploading') : t('settings.upload')}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                            <p className="mt-1 text-xs text-slate-500">JPG, GIF or PNG. Max 1MB.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('settings.personal_section')}</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.email')}</label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.fullname')}</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.phone')}</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                                placeholder="+213 xxx xxx xxx"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('settings.business_section')}</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.businessname')}</label>
                            <input
                                type="text"
                                value={formData.business_name}
                                onChange={(event) => setFormData({ ...formData, business_name: event.target.value })}
                                placeholder={t('settings.businessplaceholder')}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">{t('settings.businessdesc')}</label>
                            <textarea
                                value={formData.business_description}
                                onChange={(event) => setFormData({ ...formData, business_description: event.target.value })}
                                placeholder={t('settings.desc_placeholder') || 'Tell us about your venue business...'}
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:bg-slate-300 sm:w-auto"
                            >
                                {isLoading ? t('settings.saving') : t('settings.save')}
                            </button>
                        </div>
                    </div>
                </div>

                <BillingSettingsSection
                    userId={profile?.id || ''}
                    plans={plans}
                    subscription={subscription}
                    receipts={receipts}
                    settings={settings}
                />
            </motion.div>
        </div>
    );
}
