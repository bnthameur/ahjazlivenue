'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { Emoji } from 'react-apple-emojis';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    business_name: string | null;
    business_description: string | null;
    country?: string;
}

interface Plan {
    name: string;
    max_landing_pages: number;
    max_published_pages: number;
    max_orders_per_month: number;
    max_ai_generations: number;
    price_monthly: number;
}

interface Subscription {
    status: string;
    current_period_end: string;
    plans: Plan;
}

interface Usage {
    landing_pages_count: number;
    published_pages_count: number;
    orders_this_month: number;
    ai_generations_this_month: number;
}

interface SettingsClientProps {
    profile: Profile | null;
    subscription: Subscription | null;
    usage: Usage | null;
}

export default function SettingsClient({ profile, subscription, usage }: SettingsClientProps) {
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

    // Update local state if profile prop updates (e.g. after revalidation)
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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError('');

            // Strict ID check
            if (!profile?.id) {
                throw new Error('Profile ID missing. Please refresh the page.');
            }

            if (!event.target.files || event.target.files.length === 0) {
                return; // No file selected
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            // Use timestamp to prevent caching issues
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

        } catch (error: any) {
            console.error('Upload error:', error);
            setError(error.message || 'Error uploading avatar');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!profile?.id) throw new Error('Profile ID missing');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    business_name: formData.business_name,
                    business_description: formData.business_description,
                })
                .eq('id', profile.id);

            if (error) throw error;
            setSuccess(t('settings.success_profile') || 'Profile updated successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const plan = subscription?.plans;

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

                {/* Messages */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Profile Section */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">{t('settings.profile')}</h2>

                    {/* Avatar Upload */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="relative w-20 h-20 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl">
                                    <Emoji name="bust-in-silhouette" width={32} />
                                </div>
                            )}
                        </div>
                        <div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
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
                            <p className="text-xs text-slate-500 mt-1">JPG, GIF or PNG. Max 1MB.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 space-y-4 md:space-y-0">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.email')}</label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.fullname')}</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.phone')}</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+213 xxx xxx xxx"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.businessname')}</label>
                            <input
                                type="text"
                                value={formData.business_name}
                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                placeholder={t('settings.businessplaceholder')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('settings.businessdesc')}</label>
                            <textarea
                                value={formData.business_description}
                                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                                placeholder={t('settings.desc_placeholder') || "Tell us about your venue business..."}
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-colors w-full sm:w-auto"
                            >
                                {isLoading ? t('settings.saving') : t('settings.save')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subscription and Usage code remains checking props... */}
                {subscription && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Subscription</h2>

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-slate-900 capitalize">{plan?.name || 'Free'}</span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${subscription?.status === 'active' ? 'bg-green-100 text-green-700' :
                                        subscription?.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                        {subscription?.status || 'trial'}
                                    </span>
                                </div>
                                {plan?.price_monthly ? (
                                    <p className="text-slate-600">${plan.price_monthly}/month</p>
                                ) : (
                                    <p className="text-slate-600">Free forever</p>
                                )}
                            </div>
                            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">
                                Upgrade Plan
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-500 mb-1">Landing Pages</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {usage?.landing_pages_count || 0}/{plan?.max_landing_pages === -1 ? '∞' : plan?.max_landing_pages || 1}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-500 mb-1">Published</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {usage?.published_pages_count || 0}/{plan?.max_published_pages === -1 ? '∞' : plan?.max_published_pages || 1}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-500 mb-1">Orders/Month</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {usage?.orders_this_month || 0}/{plan?.max_orders_per_month === -1 ? '∞' : plan?.max_orders_per_month || 50}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-500 mb-1">AI Generations</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {usage?.ai_generations_this_month || 0}/{plan?.max_ai_generations === -1 ? '∞' : plan?.max_ai_generations || 5}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
