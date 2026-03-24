'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { updateVenueStatus, deleteVenue } from '../actions';
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
    profiles: {
        full_name: string;
        email: string;
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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminVenuesClient({ initialVenues, statusFilter }: { initialVenues: Venue[]; statusFilter: string }) {
    const t = useTranslations('Admin');
    const [venues, setVenues] = useState(initialVenues);
    const [currentFilter, setCurrentFilter] = useState(statusFilter);

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

    // Derived filtered list — computed from local state only, no page refresh needed
    const filteredVenues = currentFilter === 'all'
        ? venues
        : venues.filter(v => v.status === currentFilter);

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
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">{t('venues.title')}</h1>
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

                {/* Venues Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredVenues.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <div className="mb-4 opacity-50 flex justify-center">
                                <Emoji name="classical-building" width={48} />
                            </div>
                            <p className="text-slate-500">
                                {t('venues.no_venues', { status: currentFilter === 'all' ? 'All' : t(`status.${currentFilter}`) })}
                            </p>
                        </div>
                    ) : (
                        filteredVenues.map((venue) => (
                            <div
                                key={venue.id}
                                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-all"
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
                                                <h3 className="font-semibold text-slate-900 truncate">{venue.title || venue.name}</h3>
                                                <p className="text-sm text-slate-500 truncate">{venue.location}</p>
                                            </div>
                                            {getStatusBadge(venue.status)}
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-slate-700">{venue.profiles?.full_name || t('fallbacks.unknown_owner')}</p>
                                            <p className="text-xs text-slate-500">{venue.profiles?.email}</p>
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
