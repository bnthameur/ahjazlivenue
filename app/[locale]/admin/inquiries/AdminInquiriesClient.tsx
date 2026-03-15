'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';
import { useTranslations } from 'next-intl';

export interface UnifiedInquiry {
    id: string;
    source: 'platform' | 'direct';
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    message: string;
    eventDate: string | null;
    eventType: string | null;
    guestCount: number | null;
    status: string;
    createdAt: string;
    venueId: string | null;
    venueName: string;
    ownerName: string | null;
    ownerEmail: string | null;
}

interface VenueGroup {
    venueId: string;
    venueName: string;
    ownerName: string | null;
    ownerEmail: string | null;
    inquiries: UnifiedInquiry[];
}

interface AdminInquiriesClientProps {
    inquiries: UnifiedInquiry[];
}

export default function AdminInquiriesClient({ inquiries }: AdminInquiriesClientProps) {
    const t = useTranslations('Admin');
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'platform' | 'direct'>('all');
    const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

    // Filter
    const filtered = inquiries.filter(i => {
        if (sourceFilter !== 'all' && i.source !== sourceFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                i.customerName.toLowerCase().includes(q) ||
                i.venueName.toLowerCase().includes(q) ||
                (i.customerEmail?.toLowerCase().includes(q)) ||
                (i.customerPhone?.includes(q)) ||
                i.message.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // Group by venue
    const venueGroups: VenueGroup[] = [];
    const venueMap: Record<string, VenueGroup> = {};
    for (const inq of filtered) {
        const key = inq.venueId || 'no-venue';
        if (!venueMap[key]) {
            venueMap[key] = {
                venueId: inq.venueId || '',
                venueName: inq.venueName,
                ownerName: inq.ownerName,
                ownerEmail: inq.ownerEmail,
                inquiries: [],
            };
            venueGroups.push(venueMap[key]);
        }
        venueMap[key].inquiries.push(inq);
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Emoji name="envelope" width={24} />
                    {t('inquiries.title')}
                    <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {inquiries.length} total
                    </span>
                </h1>

                {/* View mode toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grouped')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'grouped' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        Grouped
                    </button>
                    <button
                        onClick={() => setViewMode('flat')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'flat' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, venue, email..."
                        className="w-full px-4 py-2.5 pl-9 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex gap-2">
                    {(['all', 'platform', 'direct'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setSourceFilter(f)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                                sourceFilter === f ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            {f === 'all' ? 'All Sources' : f === 'platform' ? 'Platform' : 'Direct Contact'}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="mb-4 opacity-50 flex justify-center">
                        <Emoji name="envelope" width={48} />
                    </div>
                    <p className="text-slate-500">{t('inquiries.no_inquiries')}</p>
                </div>
            ) : viewMode === 'grouped' ? (
                /* Grouped by venue */
                <div className="space-y-6">
                    {venueGroups.map(group => (
                        <div key={group.venueId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Venue header */}
                            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Emoji name="classical-building" width={16} />
                                    <div>
                                        <p className="font-semibold text-slate-800">{group.venueName}</p>
                                        {(group.ownerName || group.ownerEmail) && (
                                            <p className="text-xs text-slate-500">
                                                Owner: {group.ownerName || group.ownerEmail}
                                                {group.ownerEmail && group.ownerName ? ` (${group.ownerEmail})` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                        {group.inquiries.length} inquiries
                                    </span>
                                    {group.venueId && (
                                        <Link
                                            href={`/admin/venues/${group.venueId}`}
                                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                                        >
                                            View Venue
                                        </Link>
                                    )}
                                </div>
                            </div>
                            {/* Inquiries list */}
                            <div className="divide-y divide-slate-100">
                                {group.inquiries.map(inquiry => (
                                    <InquiryRow key={`${inquiry.source}-${inquiry.id}`} inquiry={inquiry} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Flat list */
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {filtered.map(inquiry => (
                            <div key={`${inquiry.source}-${inquiry.id}`} className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                        {inquiry.venueName}
                                    </span>
                                </div>
                                <InquiryRow inquiry={inquiry} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function InquiryRow({ inquiry }: { inquiry: UnifiedInquiry }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-medium text-slate-900">{inquiry.customerName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inquiry.source === 'platform'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                        }`}>
                            {inquiry.source === 'platform' ? 'Platform' : 'Direct'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {inquiry.customerEmail && <p className="text-xs text-slate-500">{inquiry.customerEmail}</p>}
                        {inquiry.customerPhone && <p className="text-xs text-slate-500">{inquiry.customerPhone}</p>}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                    {inquiry.message && (
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                        >
                            {expanded ? 'Hide' : 'Show'} message
                        </button>
                    )}
                </div>
            </div>

            {(inquiry.eventDate || inquiry.eventType || inquiry.guestCount) && (
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                    {inquiry.eventDate && <p className="text-xs text-slate-500">Date: {new Date(inquiry.eventDate).toLocaleDateString()}</p>}
                    {inquiry.eventType && <p className="text-xs text-slate-500">Type: {inquiry.eventType}</p>}
                    {inquiry.guestCount && <p className="text-xs text-slate-500">Guests: {inquiry.guestCount}</p>}
                </div>
            )}

            {expanded && inquiry.message && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                    {inquiry.message}
                </div>
            )}
        </div>
    );
}
