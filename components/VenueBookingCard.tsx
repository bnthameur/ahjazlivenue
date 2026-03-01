"use client";

import { useState } from "react";
import { Phone, Mail, MessageCircle, X, MapPin, Users, Coins } from "lucide-react";
import { useTranslations } from "next-intl";
import InquiryForm from "@/components/InquiryForm";

interface VenueBookingCardProps {
    venueId: string;
    venueTitle: string;
    city?: string | null;
    wilaya?: string | null;
    location?: string | null;
    capacity?: number | null;
    price?: number | null;
    phone?: string | null;
    whatsapp?: string | null;
    contactEmail?: string | null;
}

export default function VenueBookingCard({
    venueId,
    venueTitle,
    city,
    wilaya,
    location,
    capacity,
    price,
    phone,
    whatsapp,
    contactEmail
}: VenueBookingCardProps) {
    const t = useTranslations("VenueDetails");
    const [isOpen, setIsOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const locationLabel = [city, wilaya || location].filter(Boolean).join(", ");
    const showPhone = phone || whatsapp;

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="space-y-2">
                    {locationLabel ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="w-4 h-4" />
                            <span>{locationLabel}</span>
                        </div>
                    ) : null}
                    <h3 className="text-xl font-bold text-slate-900">{venueTitle}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">{t("capacity_label")}</div>
                        <div className="flex items-center gap-2 text-slate-900 font-semibold">
                            <Users className="w-4 h-4 text-primary-500" />
                            <span>{capacity ? capacity : "-"}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">{t("price_label")}</div>
                        <div className="flex items-center gap-2 text-slate-900 font-semibold">
                            <Coins className="w-4 h-4 text-primary-500" />
                            <span>{price ? `${price} DZD` : "-"}</span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                    {t("book_now")}
                </button>

                {showPhone ? (
                    <p className="text-xs text-slate-500 text-center">
                        {t("contact_owner")}
                    </p>
                ) : null}
            </div>

            {isOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900">{t("contact_info")}</h4>
                                <p className="text-sm text-slate-500">{venueTitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 px-6 py-6">
                            <div className="space-y-4">
                                {phone ? (
                                    <a
                                        href={`tel:${phone}`}
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500">{t("call_now")}</div>
                                            <div className="font-semibold text-slate-900">{phone}</div>
                                        </div>
                                    </a>
                                ) : null}

                                {whatsapp ? (
                                    <a
                                        href={`https://wa.me/${whatsapp}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500">{t("whatsapp")}</div>
                                            <div className="font-semibold text-slate-900">{whatsapp}</div>
                                        </div>
                                    </a>
                                ) : null}

                                {contactEmail ? (
                                    <a
                                        href={`mailto:${contactEmail}?subject=Inquiry about ${venueTitle}`}
                                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-500">{t("email_owner")}</div>
                                            <div className="font-semibold text-slate-900">{contactEmail}</div>
                                        </div>
                                    </a>
                                ) : null}

                                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                                    {t("request_intro")}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowForm((prev) => !prev)}
                                    className="w-full border border-primary-600 text-primary-600 font-semibold py-2.5 rounded-xl hover:bg-primary-50 transition"
                                >
                                    {t("send_request")}
                                </button>
                            </div>

                            <div>
                                {showForm ? (
                                    <InquiryForm venueId={venueId} venueTitle={venueTitle} compact />
                                ) : (
                                    <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center p-6 text-center text-slate-400">
                                        <div>
                                            <div className="text-lg font-semibold text-slate-500">{t("send_inquiry")}</div>
                                            <p className="text-sm mt-2">{t("send_request")}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                            >
                                {t("close")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
