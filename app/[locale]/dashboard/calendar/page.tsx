'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/LanguageProvider';
import { isVenueCategory } from '@/lib/listing-types';
import { ChevronLeft, ChevronRight, Lock, Unlock, Check, X, Phone, CalendarDays, Plus } from 'lucide-react';

type Booking = {
    id: string;
    venue_id: string;
    event_date: string;
    status: 'pending' | 'confirmed' | 'declined' | 'blocked' | 'cancelled';
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    guests: number | null;
    event_type: string | null;
    message: string | null;
    note: string | null;
    created_at: string;
};

type Venue = { id: string; title: string | null; name: string | null; category: string | null };

const COPY = {
    fr: {
        title: 'Calendrier & réservations', subtitle: 'Gérez vos disponibilités. Les clients voient les jours libres sur votre page et peuvent demander une date.',
        venue: 'Salle', noVenue: "Vous n'avez pas encore de salle. Ajoutez-en une pour gérer son calendrier.",
        requests: 'Demandes en attente', noRequests: 'Aucune demande en attente.', confirm: 'Confirmer', decline: 'Refuser',
        free: 'Libre', booked: 'Réservé', blocked: 'Bloqué', pending: 'Demande', today: "Aujourd'hui",
        block: 'Bloquer ce jour', unblock: 'Débloquer', addBooking: 'Ajouter une réservation (hors site)', name: 'Nom du client', phone: 'Téléphone',
        save: 'Enregistrer', cancelBooking: 'Annuler la réservation', guests: 'invités', dayTaken: 'Ce jour est déjà réservé ou bloqué.',
        selectDay: 'Cliquez sur un jour pour le gérer.', past: 'Jour passé', note: 'Note (facultatif)',
        weekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    },
    ar: {
        title: 'التقويم والحجوزات', subtitle: 'تحكم في الأيام المتاحة. يرى الزبائن الأيام الشاغرة في صفحتك ويمكنهم طلب تاريخ.',
        venue: 'القاعة', noVenue: 'ليس لديك قاعة بعد. أضف قاعة لإدارة تقويمها.',
        requests: 'طلبات في الانتظار', noRequests: 'لا توجد طلبات في الانتظار.', confirm: 'تأكيد', decline: 'رفض',
        free: 'متاح', booked: 'محجوز', blocked: 'مغلق', pending: 'طلب', today: 'اليوم',
        block: 'إغلاق هذا اليوم', unblock: 'فتح اليوم', addBooking: 'إضافة حجز (خارج الموقع)', name: 'اسم الزبون', phone: 'الهاتف',
        save: 'حفظ', cancelBooking: 'إلغاء الحجز', guests: 'ضيف', dayTaken: 'هذا اليوم محجوز أو مغلق مسبقاً.',
        selectDay: 'اضغط على يوم لإدارته.', past: 'يوم مضى', note: 'ملاحظة (اختياري)',
        weekdays: ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'],
    },
    en: {
        title: 'Calendar & bookings', subtitle: 'Manage availability. Clients see free days on your page and can request a date.',
        venue: 'Venue', noVenue: "You don't have a venue yet. Add one to manage its calendar.",
        requests: 'Pending requests', noRequests: 'No pending requests.', confirm: 'Confirm', decline: 'Decline',
        free: 'Free', booked: 'Booked', blocked: 'Blocked', pending: 'Request', today: 'Today',
        block: 'Block this day', unblock: 'Unblock', addBooking: 'Add a booking (offline)', name: 'Client name', phone: 'Phone',
        save: 'Save', cancelBooking: 'Cancel booking', guests: 'guests', dayTaken: 'This day is already booked or blocked.',
        selectDay: 'Click a day to manage it.', past: 'Past day', note: 'Note (optional)',
        weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
};

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function CalendarPage() {
    const { language, dir } = useLanguage();
    const c = COPY[(language in COPY ? language : 'fr') as keyof typeof COPY];
    const supabase = useMemo(() => createClient(), []);
    const intlLocale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB';

    const [venues, setVenues] = useState<Venue[] | null>(null);
    const [venueId, setVenueId] = useState('');
    const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [pending, setPending] = useState<Booking[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manual, setManual] = useState({ name: '', phone: '', note: '' });

    const todayIso = iso(new Date());

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return setVenues([]);
            const { data } = await supabase.from('venues').select('id, title, name, category').eq('owner_id', user.id).order('created_at');
            const halls = (data || []).filter((v: Venue) => isVenueCategory(v.category));
            setVenues(halls);
            if (halls[0]) setVenueId(halls[0].id);
        })();
    }, [supabase]);

    const load = useCallback(async () => {
        if (!venueId) return;
        const from = iso(new Date(month.getFullYear(), month.getMonth(), 1));
        const to = iso(new Date(month.getFullYear(), month.getMonth() + 1, 0));
        const [{ data: monthRows }, { data: pendingRows }] = await Promise.all([
            supabase.from('venue_bookings').select('*').eq('venue_id', venueId).gte('event_date', from).lte('event_date', to).in('status', ['pending', 'confirmed', 'blocked']),
            supabase.from('venue_bookings').select('*').eq('venue_id', venueId).eq('status', 'pending').gte('event_date', todayIso).order('event_date'),
        ]);
        setBookings((monthRows || []) as Booking[]);
        setPending((pendingRows || []) as Booking[]);
    }, [supabase, venueId, month, todayIso]);

    useEffect(() => { load(); }, [load]);

    const byDay = useMemo(() => {
        const m = new Map<string, Booking[]>();
        bookings.forEach((b) => m.set(b.event_date, [...(m.get(b.event_date) || []), b]));
        return m;
    }, [bookings]);

    const run = async (fn: () => PromiseLike<{ error: { message: string; code?: string } | null }>) => {
        setBusy(true); setError(null);
        const { error: err } = await fn();
        setBusy(false);
        if (err) setError(err.code === '23505' ? c.dayTaken : err.message);
        await load();
        return !err;
    };

    const setStatus = (b: Booking, status: Booking['status']) =>
        run(async () => {
            const res = await supabase.from('venue_bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', b.id);
            // Confirming a date closes the other open requests for that day
            if (!res.error && status === 'confirmed') {
                await supabase.from('venue_bookings').update({ status: 'declined', updated_at: new Date().toISOString() })
                    .eq('venue_id', b.venue_id).eq('event_date', b.event_date).eq('status', 'pending');
            }
            return res;
        });

    const block = (day: string) => run(() => supabase.from('venue_bookings').insert({ venue_id: venueId, event_date: day, status: 'blocked' }));
    const unblock = (b: Booking) => run(() => supabase.from('venue_bookings').delete().eq('id', b.id));
    const addManual = async (day: string) => {
        const ok = await run(() => supabase.from('venue_bookings').insert({
            venue_id: venueId, event_date: day, status: 'confirmed',
            customer_name: manual.name || null, customer_phone: manual.phone || null, note: manual.note || null,
        }));
        if (ok) setManual({ name: '', phone: '', note: '' });
    };

    if (venues === null) return <div className="p-6 text-slate-500">…</div>;
    if (venues.length === 0) return <div className="p-6"><div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{c.noVenue}</div></div>;

    // Monday-first month grid
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(month.getFullYear(), month.getMonth(), i + 1)))];

    const selRows = selected ? byDay.get(selected) || [] : [];
    const selTaken = selRows.find((b) => b.status === 'confirmed' || b.status === 'blocked');
    const selPast = !!selected && selected < todayIso;

    return (
        <div className="p-4 sm:p-6 space-y-5" dir={dir}>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary-600" />{c.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{c.subtitle}</p>
            </div>

            {venues.length > 1 && (
                <label className="block max-w-sm">
                    <span className="text-xs font-semibold text-slate-600">{c.venue}</span>
                    <select value={venueId} onChange={(e) => { setVenueId(e.target.value); setSelected(null); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        {venues.map((v) => <option key={v.id} value={v.id}>{v.title || v.name}</option>)}
                    </select>
                </label>
            )}

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            {/* Pending requests */}
            <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
                <h2 className="font-bold text-slate-900 mb-3">{c.requests} {pending.length > 0 && <span className="ms-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">{pending.length}</span>}</h2>
                {pending.length === 0 ? <p className="text-sm text-slate-500">{c.noRequests}</p> : (
                    <div className="space-y-2">
                        {pending.map((b) => (
                            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-white border border-slate-200 p-3">
                                <div className="flex-1 min-w-0 text-sm">
                                    <div className="font-semibold text-slate-900">
                                        {new Date(b.event_date + 'T00:00:00').toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="text-slate-600">
                                        {b.customer_name} · <a href={`tel:${b.customer_phone}`} dir="ltr" className="font-medium hover:underline">{b.customer_phone}</a>
                                        {b.guests ? ` · ${b.guests} ${c.guests}` : ''}{b.event_type ? ` · ${b.event_type}` : ''}
                                    </div>
                                    {b.message && <div className="text-slate-500 text-xs mt-1 whitespace-pre-line">{b.message}</div>}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button disabled={busy} onClick={() => setStatus(b, 'confirmed')} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"><Check className="w-4 h-4" />{c.confirm}</button>
                                    <button disabled={busy} onClick={() => setStatus(b, 'declined')} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"><X className="w-4 h-4" />{c.decline}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                {/* Month grid */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100" aria-label="previous"><ChevronLeft className="w-5 h-5 rtl:rotate-180" /></button>
                        <div className="font-bold text-slate-900 capitalize">{month.toLocaleDateString(intlLocale, { month: 'long', year: 'numeric' })}</div>
                        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100" aria-label="next"><ChevronRight className="w-5 h-5 rtl:rotate-180" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-1">
                        {c.weekdays.map((w) => <div key={w}>{w}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, i) => {
                            if (!day) return <div key={`e${i}`} />;
                            const rows = byDay.get(day) || [];
                            const isBooked = rows.some((b) => b.status === 'confirmed');
                            const isBlocked = rows.some((b) => b.status === 'blocked');
                            const pendingCount = rows.filter((b) => b.status === 'pending').length;
                            const past = day < todayIso;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelected(day)}
                                    className={`relative aspect-square rounded-lg border text-sm font-semibold transition ${
                                        selected === day ? 'ring-2 ring-primary-500' : ''
                                    } ${isBooked ? 'bg-green-100 border-green-200 text-green-800'
                                        : isBlocked ? 'bg-slate-200 border-slate-300 text-slate-500 line-through'
                                        : past ? 'bg-slate-50 border-slate-100 text-slate-300'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300'}`}
                                >
                                    {Number(day.slice(8))}
                                    {day === todayIso && <span className="absolute top-1 start-1 h-1.5 w-1.5 rounded-full bg-primary-500" />}
                                    {pendingCount > 0 && !isBooked && <span className="absolute bottom-1 end-1 rounded-full bg-orange-500 px-1 text-[10px] leading-4 text-white">{pendingCount}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded border border-slate-200 bg-white" />{c.free}</span>
                        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-100 border border-green-200" />{c.booked}</span>
                        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-200" />{c.blocked}</span>
                        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-500" />{c.pending}</span>
                    </div>
                </section>

                {/* Day panel */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    {!selected ? <p className="text-sm text-slate-500">{c.selectDay}</p> : (
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-900">
                                {new Date(selected + 'T00:00:00').toLocaleDateString(intlLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            {selPast && <p className="text-xs text-slate-400">{c.past}</p>}

                            {selRows.map((b) => (
                                <div key={b.id} className={`rounded-xl border p-3 text-sm ${b.status === 'confirmed' ? 'border-green-200 bg-green-50' : b.status === 'blocked' ? 'border-slate-200 bg-slate-50' : 'border-orange-200 bg-orange-50'}`}>
                                    <div className="font-semibold">{b.status === 'confirmed' ? c.booked : b.status === 'blocked' ? c.blocked : c.pending}</div>
                                    {b.customer_name && <div>{b.customer_name}</div>}
                                    {b.customer_phone && <a href={`tel:${b.customer_phone}`} dir="ltr" className="inline-flex items-center gap-1 text-slate-700 hover:underline"><Phone className="w-3 h-3" />{b.customer_phone}</a>}
                                    {(b.note || b.message) && <div className="text-xs text-slate-500 mt-1">{b.note || b.message}</div>}
                                    <div className="mt-2 flex gap-2">
                                        {b.status === 'pending' && (
                                            <>
                                                <button disabled={busy} onClick={() => setStatus(b, 'confirmed')} className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60">{c.confirm}</button>
                                                <button disabled={busy} onClick={() => setStatus(b, 'declined')} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-60">{c.decline}</button>
                                            </>
                                        )}
                                        {b.status === 'blocked' && (
                                            <button disabled={busy} onClick={() => unblock(b)} className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold disabled:opacity-60"><Unlock className="w-3 h-3" />{c.unblock}</button>
                                        )}
                                        {b.status === 'confirmed' && (
                                            <button disabled={busy} onClick={() => setStatus(b, 'cancelled')} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-red-600 disabled:opacity-60">{c.cancelBooking}</button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {!selTaken && !selPast && (
                                <>
                                    <button disabled={busy} onClick={() => block(selected)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60">
                                        <Lock className="w-4 h-4" />{c.block}
                                    </button>
                                    <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Plus className="w-3 h-3" />{c.addBooking}</div>
                                        <input value={manual.name} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} placeholder={c.name} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                                        <input value={manual.phone} onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))} placeholder={c.phone} dir="ltr" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                                        <input value={manual.note} onChange={(e) => setManual((m) => ({ ...m, note: e.target.value }))} placeholder={c.note} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                                        <button disabled={busy} onClick={() => addManual(selected)} className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">{c.save}</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
