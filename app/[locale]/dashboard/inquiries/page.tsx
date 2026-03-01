'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { Emoji } from 'react-apple-emojis';

const statusColors = {
    new: 'bg-green-100 text-green-700',
    read: 'bg-slate-100 text-slate-700',
    replied: 'bg-blue-100 text-blue-700',
    closed: 'bg-slate-100 text-slate-500',
};

// Interface reflecting the DB table
interface Inquiry {
    id: string;
    venue_id: string;
    customer_name: string;
    customer_phone: string;
    event_date: string;
    event_type: string;
    guest_count: number;
    message: string;
    status: 'new' | 'read' | 'replied' | 'closed';
    created_at: string;
    venues?: {
        name: string;
    }
}

export default function InquiriesPage() {
    const supabase = createClient();
    const { t } = useLanguage();
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // We need to fetch inquiries and join with venues to get venue name
            // Note: This relies on foreign key relationship setup in supabase
            const { data, error } = await supabase
                .from('inquiries')
                .select(`
                    *,
                    venues (
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching inquiries:', error);
            } else {
                setInquiries(data as unknown as Inquiry[] || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('inquiries')
                .update({ status: newStatus })
                .eq('id', id);

            if (!error) {
                setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));
                if (selectedInquiry?.id === id) {
                    setSelectedInquiry(prev => prev ? { ...prev, status: newStatus as any } : null);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredInquiries = filter === 'all'
        ? inquiries
        : inquiries.filter(i => i.status === filter);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {t('inquiries.title')}
                    </h1>
                    <p className="mt-1 text-slate-600">
                        {t('inquiries.subtitle')}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {['all', 'new', 'read', 'replied', 'closed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {t(`status.${status}`)}
                            {status === 'new' && inquiries.filter(i => i.status === 'new').length > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                                    {inquiries.filter(i => i.status === 'new').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Inquiries List */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="space-y-3">
                        {filteredInquiries.length > 0 ? (
                            filteredInquiries.map((inquiry) => (
                                <motion.div
                                    key={inquiry.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => setSelectedInquiry(inquiry)}
                                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${selectedInquiry?.id === inquiry.id
                                        ? 'border-primary-500 ring-2 ring-primary-100'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{inquiry.customer_name}</span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${statusColors[inquiry.status] || 'bg-slate-100 text-slate-700'}`}>
                                                    {t(`status.${inquiry.status}`)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500">{inquiry.venues?.name || 'Unknown Venue'}</div>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {formatDate(inquiry.created_at)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{inquiry.message}</p>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5"><Emoji name="calendar" width={16} /> <span className="pt-0.5">{formatDate(inquiry.event_date)}</span></span>
                                        <span className="flex items-center gap-1.5"><Emoji name="busts-in-silhouette" width={16} /> <span className="pt-0.5">{inquiry.guest_count || 0} guests</span></span>
                                        <span className="flex items-center gap-1.5"><Emoji name="ring" width={16} /> <span className="pt-0.5">{inquiry.event_type || 'Event'}</span></span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                                <div className="flex justify-center mb-3"><Emoji name="speech-balloon" width={48} /></div>
                                <h3 className="font-bold text-slate-900 mb-1">{t('inquiries.empty')}</h3>
                                <p className="text-sm text-slate-600">
                                    {filter === 'all'
                                        ? t('inquiries.empty_all')
                                        : `${t('inquiries.empty')} (${t(`status.${filter}`)})`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Detail View */}
                    <div className="lg:sticky lg:top-20">
                        {selectedInquiry ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white border border-slate-200 rounded-xl p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{selectedInquiry.customer_name}</h2>
                                        <p className="text-sm text-slate-500">for {selectedInquiry.venues?.name}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-medium rounded capitalize ${statusColors[selectedInquiry.status] || 'bg-slate-100 text-slate-700'}`}>
                                        {t(`status.${selectedInquiry.status}`)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-500 mb-1">{t('inquiries.details.date')}</div>
                                        <div className="font-medium">{formatDate(selectedInquiry.event_date)}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-500 mb-1">{t('inquiries.details.guests')}</div>
                                        <div className="font-medium">{selectedInquiry.guest_count}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-500 mb-1">{t('inquiries.details.type')}</div>
                                        <div className="font-medium">{selectedInquiry.event_type}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-500 mb-1">{t('inquiries.details.phone')}</div>
                                        <div className="font-medium">{selectedInquiry.customer_phone}</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="text-sm text-slate-500 mb-2">{t('inquiries.details.message')}</div>
                                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedInquiry.message}</p>
                                </div>

                                <div className="flex gap-3">
                                    <a
                                        href={`https://wa.me/${selectedInquiry.customer_phone.replace(/\s/g, '')}`}
                                        target="_blank"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        <Emoji name="speech-balloon" width={20} /> {t('inquiries.btn.whatsapp')}
                                    </a>
                                    <a
                                        href={`tel:${selectedInquiry.customer_phone}`}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        <Emoji name="telephone-receiver" width={20} /> {t('inquiries.btn.call')}
                                    </a>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => updateStatus(selectedInquiry.id, 'replied')}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        {t('inquiries.btn.replied')}
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedInquiry.id, 'closed')}
                                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        {t('inquiries.btn.close')}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                                <div className="flex justify-center mb-3"><Emoji name="backhand-index-pointing-up" width={48} /></div>
                                <h3 className="font-bold text-slate-900 mb-1">{t('inquiries.select')}</h3>
                                <p className="text-sm text-slate-600">{t('inquiries.select_desc')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
