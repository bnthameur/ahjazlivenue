"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

interface InquiryFormProps {
    venueId: string;
    venueTitle: string;
    compact?: boolean;
}

export default function InquiryForm({ venueId, venueTitle, compact }: InquiryFormProps) {
    const t = useTranslations('VenueDetails');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(`inquiryCooldown:${venueId}`);
        if (stored) {
            const value = parseInt(stored, 10);
            if (!Number.isNaN(value)) {
                setCooldownUntil(value);
            }
        }
    }, [venueId]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const honeypot = formData.get("company");
        if (honeypot) {
            setLoading(false);
            setError(t('inquiry_error'));
            return;
        }

        if (cooldownUntil && cooldownUntil > Date.now()) {
            const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
            setLoading(false);
            setError(t('inquiry_rate_limit', { seconds }));
            return;
        }
        const data = {
            venue_id: venueId,
            customer_name: formData.get("name"),
            customer_email: formData.get("email"),
            customer_phone: formData.get("phone"),
            message: formData.get("message"),
            event_date: formData.get("date") || null,
            guest_count: formData.get("guests") ? parseInt(formData.get("guests") as string) : null,
            status: "new",
            event_type: "inquiry", // Default type
        };

        const supabase = createClient();
        const { error: insertError } = await supabase.from("inquiries").insert(data);

        if (insertError) {
            console.error(insertError);
            setError(t('inquiry_error'));
        } else {
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
            const nextCooldown = Date.now() + 60_000;
            localStorage.setItem(`inquiryCooldown:${venueId}`, String(nextCooldown));
            setCooldownUntil(nextCooldown);
        }
        setLoading(false);
    }

    const containerClass = compact
        ? "bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm"
        : "bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm";

    return (
        <div className={containerClass}>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('send_inquiry')}</h3>
            <p className="text-slate-500 mb-6 text-sm">
                Interested in <span className="font-semibold text-slate-900">{venueTitle}</span>? Send a message to the owner.
            </p>

            {success ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('inquiry_sent')}
                </div>
            ) : null}

            {error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                />
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Your full name"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">{t('phone')}</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="+213 6 00 00 00 00"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">Event Date (Optional)</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="guests" className="block text-sm font-medium text-slate-700 mb-1">Guest Count (Optional)</label>
                        <input
                            type="number"
                            id="guests"
                            name="guests"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="e.g. 200"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">{t('message')}</label>
                    <textarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                        placeholder="Tell us about your event..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {t('send')}
                </button>
            </form>
        </div>
    );
}
