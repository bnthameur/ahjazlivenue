'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';
import { updatePlatformSetting, toggleVenueFeatured } from '../actions';

interface PlatformSetting {
    key: string;
    value: string;
}

interface FeaturedVenue {
    id: string;
    title: string;
    name: string;
    location: string;
    images: string[];
    is_featured: boolean;
    status: string;
}

interface PlatformStats {
    totalVenues: number;
    publishedVenues: number;
    pendingVenues: number;
    totalUsers: number;
    activeUsers: number;
    totalInquiries: number;
}

interface AdminSettingsClientProps {
    settings: PlatformSetting[];
    venues: FeaturedVenue[];
    stats: PlatformStats;
}

function useSettings(initial: PlatformSetting[]) {
    const map: Record<string, string> = {};
    for (const s of initial) map[s.key] = s.value;
    return map;
}

export default function AdminSettingsClient({ settings, venues, stats }: AdminSettingsClientProps) {
    const t = useTranslations('Admin');
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [settingsMap, setSettingsMap] = useState<Record<string, string>>(useSettings(settings));
    const [venuesList, setVenuesList] = useState<FeaturedVenue[]>(venues);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [togglingVenueId, setTogglingVenueId] = useState<string | null>(null);
    const [slickpayKeyVisible, setSlickpayKeyVisible] = useState(false);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const saveSetting = async (key: string, value: string) => {
        setSavingKey(key);
        const formData = new FormData();
        formData.append('key', key);
        formData.append('value', value);
        const result = await updatePlatformSetting(formData);
        setSavingKey(null);
        if (result?.error) {
            showToast('error', result.error);
        } else {
            showToast('success', 'Setting saved successfully');
            startTransition(() => { router.refresh(); });
        }
    };

    const handleToggle = async (key: string, current: string) => {
        const newValue = current === 'true' ? 'false' : 'true';
        setSettingsMap(prev => ({ ...prev, [key]: newValue }));
        await saveSetting(key, newValue);
    };

    const handleVenueFeatureToggle = async (venue: FeaturedVenue) => {
        const newFeatured = !venue.is_featured;
        setTogglingVenueId(venue.id);

        // Optimistic update
        setVenuesList(prev => prev.map(v =>
            v.id === venue.id ? { ...v, is_featured: newFeatured } : v
        ));

        const formData = new FormData();
        formData.append('venueId', venue.id);
        formData.append('isFeatured', String(newFeatured));
        const result = await toggleVenueFeatured(formData);
        setTogglingVenueId(null);

        if (result?.error) {
            // Revert on error
            setVenuesList(prev => prev.map(v =>
                v.id === venue.id ? { ...v, is_featured: venue.is_featured } : v
            ));
            showToast('error', result.error);
        } else {
            showToast('success', newFeatured ? 'Venue featured' : 'Venue unfeatured');
            startTransition(() => { router.refresh(); });
        }
    };

    const getBool = (key: string) => settingsMap[key] === 'true';
    const getString = (key: string, fallback = '') => settingsMap[key] ?? fallback;

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2 ${
                    toast.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="p-4 sm:p-6 space-y-8 max-w-4xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Emoji name="gear" width={26} />
                        Settings
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Configure platform settings and manage features</p>
                </div>

                {/* Platform Stats Summary */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Emoji name="bar-chart" width={18} />
                        <h2 className="font-semibold text-slate-800">Platform Overview</h2>
                    </div>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Total Venues', value: stats.totalVenues, color: 'text-slate-700' },
                            { label: 'Published', value: stats.publishedVenues, color: 'text-green-600' },
                            { label: 'Pending Review', value: stats.pendingVenues, color: 'text-orange-600' },
                            { label: 'Total Owners', value: stats.totalUsers, color: 'text-slate-700' },
                            { label: 'Active Owners', value: stats.activeUsers, color: 'text-blue-600' },
                            { label: 'Total Inquiries', value: stats.totalInquiries, color: 'text-purple-600' },
                        ].map(item => (
                            <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Payment Settings */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Emoji name="credit-card" width={18} />
                        <h2 className="font-semibold text-slate-800">Payment Settings</h2>
                    </div>
                    <div className="p-5 space-y-6">
                        {/* SlickPay Toggle */}
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-medium text-slate-800">SlickPay (Online Payment)</p>
                                <p className="text-sm text-slate-500 mt-0.5">Enable online card payments via SlickPay gateway</p>
                            </div>
                            <button
                                onClick={() => handleToggle('slickpay_enabled', getBool('slickpay_enabled') ? 'true' : 'false')}
                                disabled={savingKey === 'slickpay_enabled'}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                                    getBool('slickpay_enabled') ? 'bg-green-500' : 'bg-slate-200'
                                } ${savingKey === 'slickpay_enabled' ? 'opacity-50' : ''}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${
                                    getBool('slickpay_enabled') ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* SlickPay API Key */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                SlickPay API Key
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={slickpayKeyVisible ? 'text' : 'password'}
                                        value={getString('slickpay_api_key')}
                                        onChange={e => setSettingsMap(prev => ({ ...prev, slickpay_api_key: e.target.value }))}
                                        placeholder="sk_live_..."
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSlickpayKeyVisible(v => !v)}
                                        className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        <Emoji name={slickpayKeyVisible ? 'eye-with-line' : 'eyes'} width={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => saveSetting('slickpay_api_key', getString('slickpay_api_key'))}
                                    disabled={savingKey === 'slickpay_api_key'}
                                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                >
                                    {savingKey === 'slickpay_api_key' ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* CCP / BaridiMob Toggle */}
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-medium text-slate-800">CCP / BaridiMob (Manual Payment)</p>
                                <p className="text-sm text-slate-500 mt-0.5">Allow users to pay by uploading a payment receipt screenshot</p>
                            </div>
                            <button
                                onClick={() => handleToggle('ccp_enabled', getBool('ccp_enabled') ? 'true' : 'false')}
                                disabled={savingKey === 'ccp_enabled'}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                                    getBool('ccp_enabled') ? 'bg-green-500' : 'bg-slate-200'
                                } ${savingKey === 'ccp_enabled' ? 'opacity-50' : ''}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${
                                    getBool('ccp_enabled') ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        {/* CCP Account Number */}
                        {getBool('ccp_enabled') && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">CCP Account Number</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={getString('ccp_account_number')}
                                        onChange={e => setSettingsMap(prev => ({ ...prev, ccp_account_number: e.target.value }))}
                                        placeholder="00000000XX"
                                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <button
                                        onClick={() => saveSetting('ccp_account_number', getString('ccp_account_number'))}
                                        disabled={savingKey === 'ccp_account_number'}
                                        className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                    >
                                        {savingKey === 'ccp_account_number' ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Social Media Links */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Emoji name="globe-showing-americas" width={18} />
                        <h2 className="font-semibold text-slate-800">Social Media Links</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
                            { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
                            { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourpage' },
                        ].map(item => (
                            <div key={item.key}>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{item.label}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={getString(item.key)}
                                        onChange={e => setSettingsMap(prev => ({ ...prev, [item.key]: e.target.value }))}
                                        placeholder={item.placeholder}
                                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <button
                                        onClick={() => saveSetting(item.key, getString(item.key))}
                                        disabled={savingKey === item.key}
                                        className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                    >
                                        {savingKey === item.key ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Baridimob Payment Info */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Emoji name="money-bag" width={18} />
                        <h2 className="font-semibold text-slate-800">Baridimob Payment Info</h2>
                    </div>
                    <div className="p-5">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Baridimob Account / RIP</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={getString('payment_baridimob')}
                                onChange={e => setSettingsMap(prev => ({ ...prev, payment_baridimob: e.target.value }))}
                                placeholder="00799999XXXXXXXXXXX"
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <button
                                onClick={() => saveSetting('payment_baridimob', getString('payment_baridimob'))}
                                disabled={savingKey === 'payment_baridimob'}
                                className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                            >
                                {savingKey === 'payment_baridimob' ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">This info will be displayed to venue owners when they pay for their subscription.</p>
                    </div>
                </section>

                {/* Featured Venues */}
                <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Emoji name="star" width={18} />
                            <h2 className="font-semibold text-slate-800">Featured Venues</h2>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {venuesList.filter(v => v.is_featured).length} featured
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {venuesList.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No published venues yet.
                            </div>
                        ) : (
                            venuesList.map(venue => (
                                <div key={venue.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    {/* Thumbnail */}
                                    <div className="shrink-0">
                                        {venue.images?.[0] ? (
                                            <img
                                                src={venue.images[0]}
                                                alt={venue.title || venue.name}
                                                className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <Emoji name="classical-building" width={22} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 truncate">{venue.title || venue.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{venue.location}</p>
                                    </div>

                                    {/* Featured badge + toggle */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {venue.is_featured && (
                                            <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                                                Featured
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleVenueFeatureToggle(venue)}
                                            disabled={togglingVenueId === venue.id}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                                                venue.is_featured ? 'bg-yellow-400' : 'bg-slate-200'
                                            } ${togglingVenueId === venue.id ? 'opacity-50' : ''}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${
                                                venue.is_featured ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}
