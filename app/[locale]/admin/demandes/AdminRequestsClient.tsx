'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { approveListingRequest, deleteVenue, setListingRequestStatus } from '../actions';
import { getCategoryLabel, getGroupLabel, getListingGroupId, LISTING_GROUPS, type ListingGroupId } from '@/lib/listing-types';
import { publicListingUrl } from '@/lib/public-url';

export interface ListingRequest {
    id: string;
    slug: string | null;
    title: string | null;
    name: string | null;
    description: string | null;
    category: string | null;
    wilaya: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    tiktok_url: string | null;
    images: string[] | null;
    price: number | null;
    status: string;
    rejection_reason: string | null;
    created_at: string;
    plan_id: string | null;
    payment_receipt_url: string | null;
    listing_expires_at: string | null;
    submitted_via: string | null;
}

export interface IndividualPlan {
    id: string;
    name: string;
    name_ar: string | null;
    name_fr: string | null;
    price_monthly: number;
    duration_months: number;
    is_active: boolean;
}

type Filter = 'pending' | 'published' | 'expired' | 'rejected' | 'all';

const COPY = {
    fr: {
        title: 'Demandes individuelles', subtitle: "Demandeurs d'emploi, DJ & caméramans, services extra et locations — séparés des salles.",
        pending: 'À valider', published: 'Publiées', expired: 'Expirées', rejected: 'Rejetées', all: 'Toutes',
        allTypes: 'Tous les types', search: 'Rechercher nom, téléphone, wilaya…', none: 'Aucune demande ici.',
        plan: 'Forfait', noPlan: 'Sans forfait (pas d’expiration)', chosen: 'choisi par le demandeur',
        approve: 'Approuver & publier', reject: 'Rejeter', del: 'Supprimer', view: 'Voir la page', backPending: 'Remettre en attente',
        cv: 'CV', portfolio: 'Réalisations', receipt: 'Reçu de paiement', maps: 'Google Maps', price: 'Tarif',
        expires: 'Expire le', expiredOn: 'Expirée le', submitted: 'Reçue le', reason: 'Motif du rejet (facultatif)',
        confirmDelete: 'Supprimer définitivement cette demande ?', noPlans: 'Aucun forfait individuel. Créez-en dans Forfaits → Individus.',
        managePlans: 'Gérer les forfaits',
    },
    ar: {
        title: 'طلبات الأفراد', subtitle: 'طالبو العمل، دي جي ومصورون، خدمات وكراء — منفصلة عن القاعات.',
        pending: 'في الانتظار', published: 'منشورة', expired: 'منتهية', rejected: 'مرفوضة', all: 'الكل',
        allTypes: 'كل الأنواع', search: 'بحث بالاسم، الهاتف، الولاية…', none: 'لا توجد طلبات هنا.',
        plan: 'الباقة', noPlan: 'بدون باقة (بدون انتهاء)', chosen: 'اختارها صاحب الطلب',
        approve: 'قبول ونشر', reject: 'رفض', del: 'حذف', view: 'عرض الصفحة', backPending: 'إرجاع للانتظار',
        cv: 'السيرة الذاتية', portfolio: 'الأعمال', receipt: 'وصل الدفع', maps: 'خرائط Google', price: 'السعر',
        expires: 'تنتهي في', expiredOn: 'انتهت في', submitted: 'استلمت في', reason: 'سبب الرفض (اختياري)',
        confirmDelete: 'حذف هذا الطلب نهائياً؟', noPlans: 'لا توجد باقات للأفراد. أنشئها من الخطط ← الأفراد.',
        managePlans: 'إدارة الباقات',
    },
    en: {
        title: 'Individual requests', subtitle: 'Job seekers, DJs & camera crews, extra services and rentals — kept apart from venues.',
        pending: 'To review', published: 'Published', expired: 'Expired', rejected: 'Rejected', all: 'All',
        allTypes: 'All types', search: 'Search name, phone, wilaya…', none: 'No requests here.',
        plan: 'Plan', noPlan: 'No plan (never expires)', chosen: 'chosen by the applicant',
        approve: 'Approve & publish', reject: 'Reject', del: 'Delete', view: 'View page', backPending: 'Back to pending',
        cv: 'CV', portfolio: 'Work', receipt: 'Payment receipt', maps: 'Google Maps', price: 'Price',
        expires: 'Expires', expiredOn: 'Expired', submitted: 'Received', reason: 'Rejection reason (optional)',
        confirmDelete: 'Permanently delete this request?', noPlans: 'No individual plans yet. Create them in Plans → Individuals.',
        managePlans: 'Manage plans',
    },
};

const isExpired = (r: ListingRequest) => !!r.listing_expires_at && new Date(r.listing_expires_at).getTime() < Date.now();

export default function AdminRequestsClient({ initialRequests, plans }: { initialRequests: ListingRequest[]; plans: IndividualPlan[] }) {
    const locale = useLocale();
    const c = COPY[(locale in COPY ? locale : 'fr') as keyof typeof COPY];
    const [requests, setRequests] = useState(initialRequests);
    const [filter, setFilter] = useState<Filter>('pending');
    const [group, setGroup] = useState<ListingGroupId | ''>('');
    const [query, setQuery] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [planChoice, setPlanChoice] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

    const planName = (p: IndividualPlan) => (locale === 'ar' ? p.name_ar : locale === 'fr' ? p.name_fr : null) || p.name;
    const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-GB');
    const notify = (ok: boolean, msg: string) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 3000); };

    const statusOf = (r: ListingRequest): Filter =>
        r.status === 'published' ? (isExpired(r) ? 'expired' : 'published') : r.status === 'rejected' ? 'rejected' : 'pending';

    const counts = useMemo(() => {
        const out: Record<Filter, number> = { pending: 0, published: 0, expired: 0, rejected: 0, all: requests.length };
        requests.forEach((r) => { out[statusOf(r)]++; });
        return out;
    }, [requests]); // eslint-disable-line react-hooks/exhaustive-deps

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return requests.filter((r) => {
            if (filter !== 'all' && statusOf(r) !== filter) return false;
            if (group && getListingGroupId(r.category) !== group) return false;
            if (!q) return true;
            return `${r.title} ${r.phone} ${r.whatsapp} ${r.wilaya} ${r.city}`.toLowerCase().includes(q);
        });
    }, [requests, filter, group, query]); // eslint-disable-line react-hooks/exhaustive-deps

    const patch = (id: string, fields: Partial<ListingRequest>) =>
        setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...fields } : r)));

    async function approve(r: ListingRequest) {
        const planId = (planChoice[r.id] ?? r.plan_id ?? '') || null;
        setBusyId(r.id);
        const res = await approveListingRequest(r.id, planId);
        setBusyId(null);
        if (res.error) return notify(false, res.error);
        patch(r.id, { status: 'published', plan_id: planId, listing_expires_at: res.expiresAt ?? null, rejection_reason: null });
        notify(true, c.published);
    }

    async function reject(r: ListingRequest) {
        const reason = window.prompt(c.reason) ?? undefined;
        if (reason === undefined) return;
        setBusyId(r.id);
        const res = await setListingRequestStatus(r.id, 'rejected', reason);
        setBusyId(null);
        if (res.error) return notify(false, res.error);
        patch(r.id, { status: 'rejected', rejection_reason: reason || null });
    }

    async function backToPending(r: ListingRequest) {
        setBusyId(r.id);
        const res = await setListingRequestStatus(r.id, 'pending');
        setBusyId(null);
        if (res.error) return notify(false, res.error);
        patch(r.id, { status: 'pending', rejection_reason: null });
    }

    async function remove(r: ListingRequest) {
        if (!window.confirm(c.confirmDelete)) return;
        const fd = new FormData();
        fd.set('venueId', r.id);
        setBusyId(r.id);
        const res = await deleteVenue(fd);
        setBusyId(null);
        if (res.error) return notify(false, res.error);
        setRequests((prev) => prev.filter((x) => x.id !== r.id));
    }

    return (
        <div className="space-y-5">
            {toast && (
                <div className={`fixed top-4 end-4 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
            )}

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
                    <p className="text-sm text-slate-500 mt-1">{c.subtitle}</p>
                </div>
                <Link href="/admin/plans" className="text-sm font-semibold text-purple-700 hover:underline">{c.managePlans} →</Link>
            </div>

            {plans.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{c.noPlans}</div>
            )}

            <div className="flex flex-wrap gap-2">
                {(['pending', 'published', 'expired', 'rejected', 'all'] as Filter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {c[f]} <span className="opacity-60">{counts[f]}</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <select value={group} onChange={(e) => setGroup(e.target.value as ListingGroupId | '')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">{c.allTypes}</option>
                    {LISTING_GROUPS.filter((g) => g.id !== 'venue').map((g) => (
                        <option key={g.id} value={g.id}>{getGroupLabel(g.id, locale)}</option>
                    ))}
                </select>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search} className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>

            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{c.none}</div>
            ) : (
                <div className="space-y-4">
                    {visible.map((r) => {
                        const st = statusOf(r);
                        const grp = getListingGroupId(r.category);
                        const chosenPlan = plans.find((p) => p.id === r.plan_id);
                        const selectedPlan = planChoice[r.id] ?? r.plan_id ?? '';
                        return (
                            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex sm:flex-col gap-2 shrink-0">
                                        {(r.images || []).slice(0, 3).map((src, i) => (
                                            <a key={src} href={src} target="_blank" rel="noreferrer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={src} alt="" className={`${i === 0 ? 'h-24 w-24' : 'h-12 w-12'} rounded-lg object-cover bg-slate-100`} />
                                            </a>
                                        ))}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{r.title || r.name}</h3>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">
                                                        {getGroupLabel(grp, locale)} · {getCategoryLabel(r.category, locale)}
                                                    </span>
                                                    <span className="text-slate-500">{[r.city, r.wilaya].filter(Boolean).join(', ')}</span>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                st === 'published' ? 'bg-green-100 text-green-700' : st === 'expired' ? 'bg-slate-200 text-slate-600' : st === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>{c[st]}</span>
                                        </div>

                                        {r.description && <p className="mt-2 text-sm text-slate-600 whitespace-pre-line line-clamp-4">{r.description}</p>}

                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                            {r.phone && <a href={`tel:${r.phone}`} dir="ltr" className="font-semibold text-slate-800 hover:underline">📞 {r.phone}</a>}
                                            {r.whatsapp && <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noreferrer" dir="ltr" className="text-emerald-700 hover:underline">WhatsApp</a>}
                                            {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:underline">{grp === 'job' ? c.cv : c.portfolio} ↗</a>}
                                            {r.payment_receipt_url && <a href={r.payment_receipt_url} target="_blank" rel="noreferrer" className="font-semibold text-purple-700 hover:underline">{c.receipt} ↗</a>}
                                            {r.instagram_url && <a href={r.instagram_url} target="_blank" rel="noreferrer" className="hover:underline">Instagram ↗</a>}
                                            {r.facebook_url && <a href={r.facebook_url} target="_blank" rel="noreferrer" className="hover:underline">Facebook ↗</a>}
                                            {r.tiktok_url && <a href={r.tiktok_url} target="_blank" rel="noreferrer" className="hover:underline">TikTok ↗</a>}
                                            {r.latitude && r.longitude && <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="hover:underline">{c.maps} ↗</a>}
                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span>{c.submitted}: {fmtDate(r.created_at)}</span>
                                            {!!r.price && <span>{c.price}: {r.price} DA</span>}
                                            {chosenPlan && <span>{c.plan}: <strong className="text-slate-700">{planName(chosenPlan)}</strong> ({chosenPlan.price_monthly} DA / {chosenPlan.duration_months}m)</span>}
                                            {r.listing_expires_at && <span>{st === 'expired' ? c.expiredOn : c.expires}: {fmtDate(r.listing_expires_at)}</span>}
                                            {r.address && <span>{r.address}</span>}
                                        </div>
                                        {r.status === 'rejected' && r.rejection_reason && (
                                            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{r.rejection_reason}</p>
                                        )}

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            {(st !== 'published') && (
                                                <>
                                                    <select
                                                        value={selectedPlan}
                                                        onChange={(e) => setPlanChoice((p) => ({ ...p, [r.id]: e.target.value }))}
                                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
                                                    >
                                                        <option value="">{c.noPlan}</option>
                                                        {plans.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {planName(p)} — {p.price_monthly} DA / {p.duration_months}m{p.id === r.plan_id ? ` (${c.chosen})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button disabled={busyId === r.id} onClick={() => approve(r)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                                                        {c.approve}
                                                    </button>
                                                </>
                                            )}
                                            {r.status !== 'rejected' && (
                                                <button disabled={busyId === r.id} onClick={() => reject(r)} className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-60">{c.reject}</button>
                                            )}
                                            {r.status === 'rejected' && (
                                                <button disabled={busyId === r.id} onClick={() => backToPending(r)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60">{c.backPending}</button>
                                            )}
                                            {st === 'published' && (
                                                <a href={publicListingUrl(r.slug || r.id, locale)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-700 hover:bg-primary-100">{c.view} ↗</a>
                                            )}
                                            <button disabled={busyId === r.id} onClick={() => remove(r)} className="ms-auto rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-60">{c.del}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
