'use client';

import { useState, useTransition } from 'react';
import { updateReceiptStatus } from '../actions';

interface Receipt {
    id: string;
    user_id: string;
    receipt_url: string | null;
    payment_method: string | null;
    amount: number | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_note: string | null;
    created_at: string;
    reviewed_at: string | null;
    profile: {
        full_name: string | null;
        email: string | null;
    } | null;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

function ReceiptStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-orange-100 text-orange-700 border-orange-200',
        approved: 'bg-green-100 text-green-700 border-green-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {status === 'pending' && '⏳ '}
            {status === 'approved' && '✅ '}
            {status === 'rejected' && '❌ '}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

interface ActionModalProps {
    receipt: Receipt;
    action: 'approve' | 'reject';
    onClose: () => void;
    onSuccess: () => void;
}

function ActionModal({ receipt, action, onClose, onSuccess }: ActionModalProps) {
    const [adminNote, setAdminNote] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        const formData = new FormData();
        formData.set('receiptId', receipt.id);
        formData.set('action', action);
        formData.set('adminNote', adminNote);

        startTransition(async () => {
            await updateReceiptStatus(formData);
            onSuccess();
            onClose();
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {action === 'approve' ? '✅ Approve Payment' : '❌ Reject Payment'}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    {action === 'approve'
                        ? `Approve payment of ${receipt.amount != null ? `${Number(receipt.amount).toLocaleString()} DZD` : 'unknown amount'} from ${receipt.profile?.full_name || receipt.profile?.email || 'Unknown user'}?`
                        : `Reject payment from ${receipt.profile?.full_name || receipt.profile?.email || 'Unknown user'}?`
                    }
                    {action === 'approve' && " This will also activate the user's account if pending."}
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Admin Note {action === 'reject' && <span className="text-red-500">*</span>}
                        {action === 'approve' && <span className="text-slate-400 font-normal"> (optional)</span>}
                    </label>
                    <textarea
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        rows={3}
                        placeholder={action === 'reject' ? 'Reason for rejection...' : 'Any notes for the user...'}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none text-sm"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || (action === 'reject' && !adminNote.trim())}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {isPending
                            ? 'Processing...'
                            : action === 'approve' ? 'Approve' : 'Reject'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminPaymentsClient({ receipts: initialReceipts }: { receipts: Receipt[] }) {
    const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');
    const [modalState, setModalState] = useState<{ receipt: Receipt; action: 'approve' | 'reject' } | null>(null);

    const tabs: { key: FilterTab; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: receipts.length },
        { key: 'pending', label: 'Pending', count: receipts.filter(r => r.status === 'pending').length },
        { key: 'approved', label: 'Approved', count: receipts.filter(r => r.status === 'approved').length },
        { key: 'rejected', label: 'Rejected', count: receipts.filter(r => r.status === 'rejected').length },
    ];

    const filteredReceipts = activeTab === 'all'
        ? receipts
        : receipts.filter(r => r.status === activeTab);

    const handleSuccess = (receiptId: string, action: 'approve' | 'reject') => {
        setReceipts(prev => prev.map(r =>
            r.id === receiptId
                ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' }
                : r
        ));
    };

    return (
        <>
            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            activeTab === tab.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                            activeTab === tab.key
                                ? tab.key === 'pending' ? 'bg-orange-100 text-orange-700'
                                    : tab.key === 'approved' ? 'bg-green-100 text-green-700'
                                    : tab.key === 'rejected' ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-100 text-slate-600'
                                : 'bg-slate-200 text-slate-500'
                        }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Receipts List */}
            {filteredReceipts.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="text-4xl mb-3">🧾</div>
                    <p className="text-slate-500 font-medium">No {activeTab === 'all' ? '' : activeTab} receipts found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReceipts.map(receipt => (
                        <div key={receipt.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                                {/* Receipt Image */}
                                <div className="shrink-0">
                                    {receipt.receipt_url ? (
                                        <a
                                            href={receipt.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:border-primary-400 transition-colors group relative"
                                        >
                                            <img
                                                src={receipt.receipt_url}
                                                alt="Receipt"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl">
                                            🧾
                                        </div>
                                    )}
                                </div>

                                {/* Receipt Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {receipt.profile?.full_name || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-slate-500">{receipt.profile?.email || '—'}</p>
                                        </div>
                                        <ReceiptStatusBadge status={receipt.status} />
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Amount</p>
                                            <p className="font-semibold text-slate-900">
                                                {receipt.amount != null ? `${Number(receipt.amount).toLocaleString()} DZD` : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Method</p>
                                            <p className="font-medium text-slate-700 capitalize">{receipt.payment_method || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">Date</p>
                                            <p className="font-medium text-slate-700">
                                                {new Date(receipt.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {receipt.reviewed_at && (
                                            <div>
                                                <p className="text-xs text-slate-400 mb-0.5">Reviewed</p>
                                                <p className="font-medium text-slate-700">
                                                    {new Date(receipt.reviewed_at).toLocaleDateString('en-GB', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {receipt.admin_note && (
                                        <div className="mt-3 p-2.5 bg-slate-50 rounded-lg">
                                            <p className="text-xs text-slate-500 italic">Admin note: {receipt.admin_note}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {receipt.status === 'pending' && (
                                    <div className="flex sm:flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => setModalState({ receipt, action: 'approve' })}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            ✅
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => setModalState({ receipt, action: 'reject' })}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            ❌
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            {modalState && (
                <ActionModal
                    receipt={modalState.receipt}
                    action={modalState.action}
                    onClose={() => setModalState(null)}
                    onSuccess={() => handleSuccess(modalState.receipt.id, modalState.action)}
                />
            )}
        </>
    );
}
