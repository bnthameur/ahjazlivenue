'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { updateVenueStatus, deleteVenue, toggleVenueFeatured } from '../actions';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Venue {
    id: string;
    title: string;
    name: string;
    location: string;
    price: number;
    capacity: number;
    images: string[];
    status: 'pending' | 'approved' | 'rejected' | 'published';
    rejection_reason?: string;
    created_at: string;
    is_featured: boolean;
    profiles: {
        full_name: string;
        email: string;
        phone?: string | null;
    };
}

interface ToastMessage {
    id: number;
    type: 'success' | 'error';
    message: string;
}

// ─── Toast component ──────────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    onClick={() => onDismiss(toast.id)}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                        animate-in slide-in-from-top-2 fade-in duration-200 cursor-pointer select-none
                        ${toast.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteModalProps {
    venue: Venue;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
    t: ReturnType<typeof useTranslations<'Admin'>>;
}

function DeleteConfirmModal({ venue, onConfirm, onCancel, isDeleting, t }: DeleteModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Emoji name="warning" width={24} />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
                    {t('venues.delete_modal.title')}
                </h2>
                <p className="text-sm text-slate-600 text-center mb-6">
                    {t('venues.delete_modal.description', { venue: venue.title || venue.name || t('fallbacks.this_venue') })}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {t('venues.delete_modal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {isDeleting ? t('venues.delete_modal.deleting') : t('venues.delete_modal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Rejection Modal ───────────────────────────────────────────────────────────

interface RejectModalProps {
    venue: Venue;
    rejectionReason: string;
    onReasonChange: (val: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    t: ReturnType<typeof useTranslations<'Admin'>>;
}

function RejectModal({ venue, rejectionReason, onReasonChange, onConfirm, onCancel, isSubmitting, t }: RejectModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-slate-900 mb-4">{t('venues.reject_modal.title')}</h2>
                <p className="text-sm text-slate-600 mb-4">
                    {t('venues.reject_modal.description', { venue: venue.title || venue.name || t('fallbacks.this_venue') })}
                </p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => onReasonChange(e.target.value)}
                    placeholder={t('venues.reject_modal.placeholder')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    rows={4}
                    autoFocus
                />
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        {t('venues.reject_modal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!rejectionReason.trim() || isSubmitting}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 transition-colors"
                    >
                        {isSubmitting ? t('venues.reject_modal.submitting') : t('venues.reject_modal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Search Icon ───────────────────────────────────────────────────────────────

function SearchIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminVenuesClient({ initialVenues, statusFilter }: { initialVenues: Venue[]; statusFilter: string }) {
    const t = useTranslations('Admin');
    const [venues, setVenues] = useState(initialVenues);
    const [currentFilter, setCurrentFilter] = useState(statusFilter);
    const [searchQuery, setSearchQuery] = useState('');
    const [featuringId, setFeaturingId] = useState<string | null>(null);

    // Modals
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast system
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const toastCounterRef = useRef(0);

    const addToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = ++toastCounterRef.current;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Derived filtered list — status filter + client-side search
    const filteredVenues = useMemo(() => {
        const statusFiltered = currentFilter === 'all'
            ? venues
            : venues.filter(v => v.status === currentFilter);

        const query = searchQuery.trim().toLowerCase();
        if (!query) return statusFiltered;

        return statusFiltered.filter(v => {
            const name = (v.title || v.name || '').toLowerCase();
            const email = (v.profiles?.email || '').toLowerCase();
            const phone = (v.profiles?.phone || '').toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [venues, currentFilter, searchQuery]);

    // ── Approve ────────────────────────────────────────────────────────────────
    const handleApprove = async (venue: Venue) => {
        // Optimistic update
        setVenues(prev => prev.map(v => v.id === venue.id ? { ...v, status: 'published' as const } : v));
        addToast('success', t('venues.approve_success'));

        const formData = new FormData();
        formData.append('venueId', venue.id);
        formData.append('action', 'approve');
        await updateVenueStatus(formData);
        // No router.refresh() — local state is the source of truth
    };

    // ── Reject ─────────────────────────────────────────────────────────────────
    const handleReject = (venue: Venue) => {
        setSelectedVenue(venue);
        setShowRejectModal(true);
    };

    const submitRejection = async () => {
        if (!selectedVenue || !rejectionReason.trim()) return;
        setIsSubmitting(true);

        const venueId = selectedVenue.id;
        const reason = rejectionReason;

        // Optimistic update
        setVenues(prev => prev.map(v =>
            v.id === venueId ? { ...v, status: 'rejected' as const, rejection_reason: reason } : v
        ));
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedVenue(null);
        setIsSubmitting(false);
        addToast('success', t('venues.reject_success'));

        const formData = new FormData();
        formData.append('venueId', venueId);
        formData.append('action', 'reject');
        formData.append('rejectionReason', reason);
        await updateVenueStatus(formData);
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDeleteClick = (venue: Venue) => {
        setVenueToDelete(venue);
    };

    const confirmDelete = async () => {
        if (!venueToDelete) return;
        setIsDeleting(true);

        const venueId = venueToDelete.id;
        const venueName = venueToDelete.title || venueToDelete.name;

        const formData = new FormData();
        formData.append('venueId', venueId);
        const result = await deleteVenue(formData);

        setIsDeleting(false);
        setVenueToDelete(null);

        if (result?.error) {
            addToast('error', t('venues.delete_error'));
        } else {
            // Remove from local state immediately
            setVenues(prev => prev.filter(v => v.id !== venueId));
            addToast('success', t('venues.delete_success', { venue: venueName }));
        }
    };

    // ── Toggle Featured ────────────────────────────────────────────────────────
    const handleToggleFeatured = async (venue: Venue) => {
        setFeaturingId(venue.id);
        const newFeatured = !venue.is_featured;

        // Optimistic update
        setVenues(prev => prev.map(v =>
            v.id === venue.id ? { ...v, is_featured: newFeatured } : v
        ));

        const formData = new FormData();
        formData.append('venueId', venue.id);
        formData.append('isFeatured', String(newFeatured));
        const result = await toggleVenueFeatured(formData);

        setFeaturingId(null);

        if (result?.error) {
            // Revert on failure
            setVenues(prev => prev.map(v =>
                v.id === venue.id ? { ...v, is_featured: venue.is_featured } : v
            ));
            addToast('error', t('venues.feature_error'));
        } else {
            addToast(
                'success',
                newFeatured ? t('venues.feature_success') : t('venues.unfeature_success')
            );
        }
    };

    // ── Status badge ───────────────────────────────────────────────────────────
    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('status.pending') },
            approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('status.approved') },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: t('status.rejected') },
            published: { bg: 'bg-green-100', text: 'text-green-700', label: t('status.published') },
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <>
            <Toast toasts={toasts} onDismiss={dismissToast} />

            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">{t('venues.title')}</h1>
                </div>

                {/* Search Bar */}
                <div className="relative mb-5">
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
                        <SearchIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('venues.search_placeholder')}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                        aria-label={t('venues.search_placeholder')}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-slate-400 hover:text-slate-600"
                            aria-label={t('venues.search_clear')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto">
                    {(['all', 'pending', 'published', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setCurrentFilter(status)}
                            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors capitalize whitespace-nowrap ${
                                currentFilter === status
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            {status === 'all'
                                ? (t.has('status.all') ? t('status.all') : 'All')
                                : t(`status.${status}`)}
                        </button>
                    ))}
                </div>

                {/* Result count when searching */}
                {searchQuery && (
                    <p className="mb-4 text-sm text-slate-500">
                        {t('venues.search_results_count', { count: filteredVenues.length })}
                    </p>
                )}

                {/* Venues Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredVenues.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <div className="mb-4 opacity-50 flex justify-center">
                                <Emoji name="classical-building" width={48} />
                            </div>
                            <p className="text-slate-500">
                                {searchQuery
                                    ? t('venues.no_search_results')
                                    : t('venues.no_venues', { status: currentFilter === 'all' ? 'All' : t(`status.${currentFilter}`) })
                                }
                            </p>
                        </div>
                    ) : (
                        filteredVenues.map((venue) => (
                            <div
                                key={venue.id}
                                className={`bg-white rounded-xl border p-4 sm:p-6 hover:shadow-md transition-all ${
                                    venue.is_featured
                                        ? 'border-amber-300 ring-1 ring-amber-200'
                                        : 'border-slate-200'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0">
                                        {venue.images?.[0] ? (
                                            <img
                                                src={venue.images[0]}
                                                alt={venue.title || venue.name}
                                                className="w-full sm:w-24 h-48 sm:h-24 rounded-lg object-cover bg-slate-100"
                                            />
                                        ) : (
                                            <div className="w-full sm:w-24 h-48 sm:h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <Emoji name="classical-building" width={32} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-slate-900 truncate">{venue.title || venue.name}</h3>
                                                    {venue.is_featured && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                                            ★ {t('venues.featured_badge')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 truncate">{venue.location}</p>
                                            </div>
                                            {getStatusBadge(venue.status)}
                                        </div>

                                        {/* Owner Info */}
                                        <div className="mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-sm font-medium text-slate-700">{venue.profiles?.full_name || t('fallbacks.unknown_owner')}</p>
                                            {venue.profiles?.email && (
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    <span className="font-medium text-slate-600">{t('venues.owner_email')}:</span>{' '}
                                                    <a href={`mailto:${venue.profiles.email}`} className="hover:underline hover:text-primary-600 transition-colors">
                                                        {venue.profiles.email}
                                                    </a>
                                                </p>
                                            )}
                                            {venue.profiles?.phone && (
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    <span className="font-medium text-slate-600">{t('venues.owner_phone')}:</span>{' '}
                                                    <a href={`tel:${venue.profiles.phone}`} className="hover:underline hover:text-primary-600 transition-colors" dir="ltr">
                                                        {venue.profiles.phone}
                                                    </a>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                            <div><span className="font-medium">{t('venues.price')}:</span> {venue.price ? `${venue.price} DZD` : t('venues.contact_price')}</div>
                                            <div><span className="font-medium">{t('venues.capacity')}:</span> {venue.capacity} {t('venues.guests')}</div>
                                            <div><span className="font-medium">{t('venues.submitted')}:</span> {new Date(venue.created_at).toLocaleDateString()}</div>
                                        </div>

                                        {venue.status === 'rejected' && venue.rejection_reason && (
                                            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                <span className="font-medium">{t('venues.rejection_reason')}:</span> {venue.rejection_reason}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            {venue.status !== 'published' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApprove(venue)}
                                                    className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Emoji name="check-mark-button" width={14} className="inline mr-1" />
                                                    {t('venues.approve')}
                                                </button>
                                            )}
                                            {venue.status !== 'rejected' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReject(venue)}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Emoji name="cross-mark" width={14} className="inline mr-1" />
                                                    {t('venues.reject')}
                                                </button>
                                            )}

                                            {/* Featured toggle */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFeatured(venue)}
                                                disabled={featuringId === venue.id}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                                                    venue.is_featured
                                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                                                }`}
                                                aria-label={venue.is_featured ? t('venues.unfeature') : t('venues.feature')}
                                            >
                                                {featuringId === venue.id
                                                    ? '...'
                                                    : venue.is_featured
                                                        ? `★ ${t('venues.unfeature')}`
                                                        : `☆ ${t('venues.feature')}`
                                                }
                                            </button>

                                            <Link
                                                href={`/admin/venues/${venue.id}`}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Emoji name="eyes" width={14} className="inline mr-1" />
                                                {t('venues.view')}
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteClick(venue)}
                                                className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors ml-auto"
                                                aria-label={`${t('venues.delete')} ${venue.title || venue.name}`}
                                            >
                                                <Emoji name="wastebasket" width={14} className="inline mr-1" />
                                                {t('venues.delete')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && selectedVenue && (
                <RejectModal
                    venue={selectedVenue}
                    rejectionReason={rejectionReason}
                    onReasonChange={setRejectionReason}
                    onConfirm={submitRejection}
                    onCancel={() => {
                        setShowRejectModal(false);
                        setRejectionReason('');
                        setSelectedVenue(null);
                    }}
                    isSubmitting={isSubmitting}
                    t={t}
                />
            )}

            {/* Delete Confirmation Modal */}
            {venueToDelete && (
                <DeleteConfirmModal
                    venue={venueToDelete}
                    onConfirm={confirmDelete}
                    onCancel={() => setVenueToDelete(null)}
                    isDeleting={isDeleting}
                    t={t}
                />
            )}
        </>
    );
}
