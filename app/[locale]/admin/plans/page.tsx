'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionPlan {
    id: string;
    name: string;
    name_ar: string;
    description: string | null;
    price_monthly: number;
    price_yearly: number | null;
    max_venues: number;
    max_images_per_venue: number;
    max_videos_per_venue: number;
    is_featured_allowed: boolean;
    is_active: boolean;
    duration_months: number;
    created_at: string;
}

type PlanFormData = Omit<SubscriptionPlan, 'id' | 'created_at'>;

const DEFAULT_FORM: PlanFormData = {
    name: '',
    name_ar: '',
    description: '',
    price_monthly: 0,
    price_yearly: null,
    max_venues: 1,
    max_images_per_venue: 10,
    max_videos_per_venue: 2,
    is_featured_allowed: false,
    is_active: true,
    duration_months: 1,
};

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
    name?: string;
    name_ar?: string;
    price_monthly?: string;
    max_venues?: string;
    max_images_per_venue?: string;
    max_videos_per_venue?: string;
    duration_months?: string;
}

function validateForm(data: PlanFormData): FormErrors {
    const errors: FormErrors = {};
    if (!data.name.trim()) errors.name = 'Plan name (English) is required';
    if (!data.name_ar.trim()) errors.name_ar = 'Plan name (Arabic) is required';
    if (data.price_monthly < 0) errors.price_monthly = 'Price must be a positive number';
    if (data.max_venues < 1) errors.max_venues = 'Must allow at least 1 venue';
    if (data.max_images_per_venue < 0) errors.max_images_per_venue = 'Must be 0 or more';
    if (data.max_videos_per_venue < 0) errors.max_videos_per_venue = 'Must be 0 or more';
    if (data.duration_months < 1) errors.duration_months = 'Duration must be at least 1 month';
    return errors;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const TagIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

interface PlanFormModalProps {
    plan: SubscriptionPlan | null; // null = create mode
    onClose: () => void;
    onSaved: (plan: SubscriptionPlan) => void;
}

function PlanFormModal({ plan, onClose, onSaved }: PlanFormModalProps) {
    const isEdit = plan !== null;
    const supabase = createClient();

    const [form, setForm] = useState<PlanFormData>(
        isEdit
            ? {
                name: plan.name,
                name_ar: plan.name_ar,
                description: plan.description ?? '',
                price_monthly: plan.price_monthly,
                price_yearly: plan.price_yearly,
                max_venues: plan.max_venues,
                max_images_per_venue: plan.max_images_per_venue,
                max_videos_per_venue: plan.max_videos_per_venue,
                is_featured_allowed: plan.is_featured_allowed,
                is_active: plan.is_active,
                duration_months: plan.duration_months,
            }
            : DEFAULT_FORM
    );

    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const setField = <K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        setApiError(null);

        const payload = {
            name: form.name.trim(),
            name_ar: form.name_ar.trim(),
            description: form.description?.trim() || null,
            price_monthly: Number(form.price_monthly),
            price_yearly: form.price_yearly !== null && form.price_yearly !== undefined
                ? Number(form.price_yearly)
                : null,
            max_venues: Number(form.max_venues),
            max_images_per_venue: Number(form.max_images_per_venue),
            max_videos_per_venue: Number(form.max_videos_per_venue),
            is_featured_allowed: form.is_featured_allowed,
            is_active: form.is_active,
            duration_months: Number(form.duration_months),
        };

        try {
            if (isEdit) {
                const { data, error } = await supabase
                    .from('subscription_plans')
                    .update(payload)
                    .eq('id', plan.id)
                    .select()
                    .single();

                if (error) throw error;
                onSaved(data as SubscriptionPlan);
            } else {
                const { data, error } = await supabase
                    .from('subscription_plans')
                    .insert(payload)
                    .select()
                    .single();

                if (error) throw error;
                onSaved(data as SubscriptionPlan);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
            setApiError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                        <h2 className="text-lg font-bold text-slate-900">
                            {isEdit ? `Edit Plan: ${plan.name}` : 'Create New Plan'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <XIcon />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {apiError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {apiError}
                            </div>
                        )}

                        {/* Names */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Plan Name (English) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setField('name', e.target.value)}
                                    placeholder="e.g. Starter"
                                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    اسم الخطة (عربي) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={form.name_ar}
                                    onChange={(e) => setField('name_ar', e.target.value)}
                                    placeholder="مثال: المبتدئ"
                                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 ${errors.name_ar ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                />
                                {errors.name_ar && <p className="mt-1 text-xs text-red-600">{errors.name_ar}</p>}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                value={form.description ?? ''}
                                onChange={(e) => setField('description', e.target.value)}
                                rows={2}
                                placeholder="Brief description of this plan..."
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none transition-colors"
                            />
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Price (DA) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.price_monthly}
                                        onChange={(e) => setField('price_monthly', Number(e.target.value))}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 pr-10 ${errors.price_monthly ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">DA</span>
                                </div>
                                {errors.price_monthly && <p className="mt-1 text-xs text-red-600">{errors.price_monthly}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Duration (months) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.duration_months}
                                    onChange={(e) => setField('duration_months', Number(e.target.value))}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 ${errors.duration_months ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                />
                                {errors.duration_months && <p className="mt-1 text-xs text-red-600">{errors.duration_months}</p>}
                            </div>
                        </div>

                        {/* Limits */}
                        <div>
                            <p className="text-xs font-semibold text-slate-700 mb-3">Limits</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1.5">
                                        Max Venues <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.max_venues}
                                        onChange={(e) => setField('max_venues', Number(e.target.value))}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 ${errors.max_venues ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                    />
                                    {errors.max_venues && <p className="mt-1 text-xs text-red-600">{errors.max_venues}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1.5">
                                        Max Images / Venue <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.max_images_per_venue}
                                        onChange={(e) => setField('max_images_per_venue', Number(e.target.value))}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 ${errors.max_images_per_venue ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                    />
                                    {errors.max_images_per_venue && <p className="mt-1 text-xs text-red-600">{errors.max_images_per_venue}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1.5">
                                        Max Videos / Venue <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.max_videos_per_venue}
                                        onChange={(e) => setField('max_videos_per_venue', Number(e.target.value))}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors focus:ring-2 focus:ring-purple-300 ${errors.max_videos_per_venue ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-400'}`}
                                    />
                                    {errors.max_videos_per_venue && <p className="mt-1 text-xs text-red-600">{errors.max_videos_per_venue}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <div
                                    onClick={() => setField('is_featured_allowed', !form.is_featured_allowed)}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${form.is_featured_allowed ? 'bg-purple-600' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured_allowed ? 'translate-x-4' : ''}`} />
                                </div>
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                                    Featured listings allowed
                                </span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <div
                                    onClick={() => setField('is_active', !form.is_active)}
                                    className={`relative w-9 h-5 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
                                </div>
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                                    Active (visible to users)
                                </span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {saving && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
    plan: SubscriptionPlan;
    onClose: () => void;
    onConfirm: () => void;
    deleting: boolean;
}

function DeleteModal({ plan, onClose, onConfirm, deleting }: DeleteModalProps) {
    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <TrashIcon />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Plan</h3>
                            <p className="text-sm text-slate-500">
                                Are you sure you want to delete the{' '}
                                <strong className="text-slate-700">{plan.name}</strong> plan?
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={deleting}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={deleting}
                            className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {deleting && (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {deleting ? 'Deleting...' : 'Delete Plan'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
    plan: SubscriptionPlan;
    onEdit: (plan: SubscriptionPlan) => void;
    onDelete: (plan: SubscriptionPlan) => void;
    onToggleActive: (plan: SubscriptionPlan) => void;
    toggling: boolean;
}

function PlanCard({ plan, onEdit, onDelete, onToggleActive, toggling }: PlanCardProps) {
    const formattedPrice = plan.price_monthly.toLocaleString('fr-DZ');
    const pricePerMonth = plan.duration_months > 1
        ? Math.round(plan.price_monthly / plan.duration_months).toLocaleString('fr-DZ')
        : null;

    return (
        <div className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${plan.is_active ? 'border-slate-200' : 'border-slate-100 opacity-70'}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                        <span className="text-sm text-slate-500 font-medium" dir="rtl">{plan.name_ar}</span>
                    </div>
                    {plan.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{plan.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Price */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900">{formattedPrice}</span>
                    <span className="text-sm font-medium text-slate-500">DA</span>
                    <span className="text-xs text-slate-400">/ {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}</span>
                </div>
                {pricePerMonth && (
                    <p className="text-xs text-slate-400 mt-0.5">{pricePerMonth} DA / month</p>
                )}
            </div>

            {/* Limits grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-700">{plan.max_venues}</p>
                    <p className="text-xs text-purple-500 mt-0.5">Venue{plan.max_venues !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-700">{plan.max_images_per_venue}</p>
                    <p className="text-xs text-blue-500 mt-0.5">Images</p>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <p className="text-lg font-bold text-orange-700">{plan.max_videos_per_venue}</p>
                    <p className="text-xs text-orange-500 mt-0.5">Videos</p>
                </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {plan.is_featured_allowed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured allowed
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                {/* Toggle active */}
                <button
                    onClick={() => onToggleActive(plan)}
                    disabled={toggling}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${plan.is_active
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                >
                    {toggling ? '...' : plan.is_active ? 'Deactivate' : 'Activate'}
                </button>

                <button
                    onClick={() => onEdit(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                >
                    <EditIcon />
                    Edit
                </button>

                <button
                    onClick={() => onDelete(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <TrashIcon />
                    Delete
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPlansPage() {
    const { dir } = useLanguage();
    const supabase = createClient();

    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Modal state
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    // Delete state
    const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Toggle active state
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchPlans = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true });

            if (error) throw error;
            setPlans((data as SubscriptionPlan[]) ?? []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load plans';
            setFetchError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleOpenCreate = () => {
        setEditingPlan(null);
        setShowForm(true);
    };

    const handleOpenEdit = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        setShowForm(true);
    };

    const handleSaved = (saved: SubscriptionPlan) => {
        setPlans((prev) => {
            const exists = prev.find((p) => p.id === saved.id);
            if (exists) {
                return prev.map((p) => (p.id === saved.id ? saved : p));
            }
            return [...prev, saved].sort((a, b) => a.price_monthly - b.price_monthly);
        });
        setShowForm(false);
        setEditingPlan(null);
        showToast(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
    };

    const handleToggleActive = async (plan: SubscriptionPlan) => {
        setTogglingId(plan.id);
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .update({ is_active: !plan.is_active })
                .eq('id', plan.id)
                .select()
                .single();

            if (error) throw error;
            setPlans((prev) => prev.map((p) => (p.id === plan.id ? (data as SubscriptionPlan) : p)));
            showToast(plan.is_active ? 'Plan deactivated' : 'Plan activated');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to update plan';
            showToast(msg, 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingPlan) return;
        setDeleteLoading(true);
        try {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', deletingPlan.id);

            if (error) throw error;
            setPlans((prev) => prev.filter((p) => p.id !== deletingPlan.id));
            showToast('Plan deleted successfully');
            setDeletingPlan(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete plan';
            showToast(msg, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-6" dir={dir}>
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                >
                    {toast.type === 'success' ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                            <TagIcon />
                        </div>
                        Subscription Plans
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage pricing plans for venue owners</p>
                </div>

                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <PlusIcon />
                    Add Plan
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
                            <div className="h-5 w-32 bg-slate-200 rounded mb-3" />
                            <div className="h-4 w-48 bg-slate-100 rounded mb-4" />
                            <div className="h-12 bg-slate-100 rounded-xl mb-4" />
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[1, 2, 3].map((j) => <div key={j} className="h-12 bg-slate-100 rounded-lg" />)}
                            </div>
                            <div className="h-8 bg-slate-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            )}

            {/* Fetch error */}
            {!loading && fetchError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700 font-medium">Failed to load plans</p>
                    <p className="text-xs text-red-500 mt-1">{fetchError}</p>
                    <button
                        onClick={fetchPlans}
                        className="mt-3 text-xs font-semibold text-red-700 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!loading && !fetchError && plans.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TagIcon />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">No plans yet</h3>
                    <p className="text-sm text-slate-500 mb-5">Create your first subscription plan to get started.</p>
                    <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        <PlusIcon />
                        Create First Plan
                    </button>
                </div>
            )}

            {/* Plans grid */}
            {!loading && !fetchError && plans.length > 0 && (
                <>
                    {/* Summary bar */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-sm text-slate-500">
                            <strong className="text-slate-800">{plans.length}</strong> total plan{plans.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-sm text-slate-500">
                            <strong className="text-green-700">{plans.filter((p) => p.is_active).length}</strong> active
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-sm text-slate-500">
                            <strong className="text-slate-500">{plans.filter((p) => !p.is_active).length}</strong> inactive
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onEdit={handleOpenEdit}
                                onDelete={setDeletingPlan}
                                onToggleActive={handleToggleActive}
                                toggling={togglingId === plan.id}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Form Modal */}
            {showForm && (
                <PlanFormModal
                    plan={editingPlan}
                    onClose={() => {
                        setShowForm(false);
                        setEditingPlan(null);
                    }}
                    onSaved={handleSaved}
                />
            )}

            {/* Delete Modal */}
            {deletingPlan && (
                <DeleteModal
                    plan={deletingPlan}
                    onClose={() => setDeletingPlan(null)}
                    onConfirm={handleDeleteConfirm}
                    deleting={deleteLoading}
                />
            )}
        </div>
    );
}
