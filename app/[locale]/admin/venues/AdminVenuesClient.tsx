'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/i18n/navigation';
import { updateVenueStatus } from '../actions';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';

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

export default function AdminVenuesClient({ initialVenues, statusFilter }: { initialVenues: Venue[], statusFilter: string }) {
    const t = useTranslations('Admin');
    const [venues, setVenues] = useState(initialVenues);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReject = (venue: Venue) => {
        setSelectedVenue(venue);
        setShowRejectModal(true);
    };

    const submitRejection = async () => {
        if (!selectedVenue || !rejectionReason.trim()) return;

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('venueId', selectedVenue.id);
        formData.append('action', 'reject');
        formData.append('rejectionReason', rejectionReason);

        await updateVenueStatus(formData);

        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedVenue(null);
        setIsSubmitting(false);
        window.location.reload();
    };

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
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">{t('venues.title')}</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto">
                    {['pending', 'published', 'rejected'].map((status) => (
                        <Link
                            key={status}
                            href={`/admin/venues?status=${status}`}
                            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors capitalize whitespace-nowrap ${statusFilter === status
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {t(`status.${status}`)}
                        </Link>
                    ))}
                </div>

                {/* Venues Grid - Mobile Responsive */}
                <div className="grid grid-cols-1 gap-4">
                    {venues?.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                            <div className="mb-4 opacity-50 flex justify-center">
                                <Emoji name="classical-building" width={48} />
                            </div>
                            <p className="text-slate-500">{t('venues.no_venues', { status: t(`status.${statusFilter}`) })}</p>
                        </div>
                    ) : (
                        venues?.map((venue) => (
                            <div key={venue.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                        {venue.images?.[0] ? (
                                            <img src={venue.images[0]} alt={venue.title || venue.name} className="w-full sm:w-24 h-48 sm:h-24 rounded-lg object-cover bg-slate-100" />
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

                                        {/* Owner Info */}
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-slate-700">{venue.profiles?.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-500">{venue.profiles?.email}</p>
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                            <div>
                                                <span className="font-medium">{t('venues.price')}:</span> {venue.price ? `${venue.price} DZD` : t('venues.contact_price')}
                                            </div>
                                            <div>
                                                <span className="font-medium">{t('venues.capacity')}:</span> {venue.capacity} {t('venues.guests')}
                                            </div>
                                            <div>
                                                <span className="font-medium">{t('venues.submitted')}:</span> {new Date(venue.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Rejection Reason */}
                                        {venue.status === 'rejected' && venue.rejection_reason && (
                                            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                <span className="font-medium">{t('venues.rejection_reason')}:</span> {venue.rejection_reason}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2">
                                            {statusFilter !== 'published' && (
                                                <form action={updateVenueStatus}>
                                                    <input type="hidden" name="venueId" value={venue.id} />
                                                    <input type="hidden" name="action" value="approve" />
                                                    <button type="submit" className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors">
                                                        <Emoji name="check-mark-button" width={14} className="inline mr-1" />
                                                        {t('venues.approve')}
                                                    </button>
                                                </form>
                                            )}
                                            {statusFilter !== 'rejected' && (
                                                <button
                                                    onClick={() => handleReject(venue)}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Emoji name="cross-mark" width={14} className="inline mr-1" />
                                                    {t('venues.reject')}
                                                </button>
                                            )}
                                            <Link
                                                href={`/dashboard/venues/${venue.id}`}
                                                target="_blank"
                                                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Emoji name="eyes" width={14} className="inline mr-1" />
                                                {t('venues.view')}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">{t('venues.reject_modal.title')}</h2>
                        <p className="text-sm text-slate-600 mb-4">
                            {t('venues.reject_modal.description', { venue: selectedVenue?.title || selectedVenue?.name || 'this venue' })}
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={t('venues.reject_modal.placeholder')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                            rows={4}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                    setSelectedVenue(null);
                                }}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                {t('venues.reject_modal.cancel')}
                            </button>
                            <button
                                onClick={submitRejection}
                                disabled={!rejectionReason.trim() || isSubmitting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 transition-colors"
                            >
                                {isSubmitting ? t('venues.reject_modal.submitting') : t('venues.reject_modal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
