'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
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
        duration_months?: number | null;
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

type Tab = 'profile' | 'billing';

export default function SettingsClient({ profile, subscription, plans, receipts, settings, usage }: SettingsClientProps) {
    const supabase = createClient();
    const { t, language } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('profile');
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
    const isPendingAccount = profile?.status === 'pending';

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError('');
            if (!profile?.id) throw new Error('Profile ID missing.');
            if (!event.target.files || event.target.files.length === 0) return;

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${profile.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('venue-images')
                .upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

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

    const step1Done = completedItems === profileCompletionItems.length;
    const step2Done = Boolean(currentPlan);
    const step3Done = receipts.length > 0;
    const stepsCompleted = [step1Done, step2Done, step3Done].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t('settings.title')}</h1>
                        <p className="mt-1 text-slate-500">{t('settings.desc')}</p>
                    </div>

                    {/* Onboarding Banner (pending accounts) */}
                    {isPendingAccount && (
                        <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/60 p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 text-sm font-bold">{stepsCompleted}/3</div>
                                <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500" style={{ width: `${(stepsCompleted / 3) * 100}%` }} />
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900 mb-1">{t('settings.pending.title')}</h2>
                            <p className="text-sm text-slate-600 mb-5">{t('settings.pending.desc')}</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                    { done: step1Done, label: t('settings.pending.step1'), detail: `${completedItems}/${profileCompletionItems.length} ${t('settings.pending.fields_done')}` },
                                    { done: step2Done, label: t('settings.pending.step2'), detail: currentPlan?.name || t('settings.pending.no_pack') },
                                    { done: step3Done, label: t('settings.pending.step3'), detail: receipts.length > 0 ? `${receipts.length} ${t('settings.pending.receipt_submitted')}` : t('settings.pending.no_receipt') },
                                ].map((step, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(i === 0 ? 'profile' : 'billing')}
                                        className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${step.done ? 'border-green-200 bg-green-50/80' : 'border-white/80 bg-white/90 hover:border-amber-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('settings.pending.step')} {i + 1}</span>
                                            {step.done && <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab Switcher */}
                    <div className="flex gap-1 p-1 mb-6 rounded-xl bg-slate-100 w-fit">
                        {(['profile', 'billing'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSuccess(''); setError(''); }}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab === 'profile' ? t('settings.profile') : t('settings.billing.title_short')}
                            </button>
                        ))}
                    </div>

                    {/* Alerts */}
                    {success && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
                            {/* Avatar Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <div className="flex items-center gap-5">
                                    <div className="relative group">
                                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50">
                                            {avatarUrl ? (
                                                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{formData.full_name || profile?.email}</p>
                                        <p className="text-sm text-slate-500">{profile?.email}</p>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                profile?.status === 'active' ? 'bg-green-100 text-green-700' :
                                                profile?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    profile?.status === 'active' ? 'bg-green-500' :
                                                    profile?.status === 'rejected' ? 'bg-red-500' :
                                                    'bg-amber-500'
                                                }`} />
                                                {profile?.status === 'active' ? t('dashboard.status.active') :
                                                 profile?.status === 'rejected' ? t('dashboard.status.rejected') :
                                                 t('dashboard.status.pending')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Completion */}
                            {completedItems < profileCompletionItems.length && (
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-slate-900">{t('settings.setup_title')}</h3>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{completedItems}/{profileCompletionItems.length}</span>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {profileCompletionItems.map((item) => (
                                            <div key={item.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${item.done ? 'text-green-700' : 'text-slate-500'}`}>
                                                {item.done ? (
                                                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>
                                                )}
                                                {item.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Personal Info */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-5">{t('settings.personal_section')}</h3>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('settings.email')}</label>
                                        <input type="email" value={profile?.email || ''} disabled className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('settings.fullname')}</label>
                                        <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('settings.phone')}</label>
                                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+213 xxx xxx xxx" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                </div>
                            </div>

                            {/* Business Info */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h3 className="text-base font-semibold text-slate-900 mb-5">{t('settings.business_section')}</h3>
                                <div className="grid gap-5">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('settings.businessname')}</label>
                                        <input type="text" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} placeholder={t('settings.businessplaceholder')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('settings.businessdesc')}</label>
                                        <textarea value={formData.business_description} onChange={(e) => setFormData({ ...formData, business_description: e.target.value })} placeholder={t('settings.desc_placeholder')} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button onClick={handleSave} disabled={isLoading} className="rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm hover:shadow">
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            {t('settings.saving')}
                                        </span>
                                    ) : t('settings.save')}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Billing Tab */}
                    {activeTab === 'billing' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                            <BillingSettingsSection
                                userId={profile?.id || ''}
                                plans={plans}
                                subscription={subscription}
                                receipts={receipts}
                                settings={settings}
                            />
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
