"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { VenueCard } from "@/components/VenueCard";
import { WILAYAS, getWilayas } from "@/lib/wilayas";

type Venue = {
    id: string;
    title: string;
    description: string;
    location: string;
    wilaya?: string | null;
    city?: string | null;
    price?: number | null;
    capacity?: number | null;
    images?: string[] | null;
};

type CityOption = {
    id: number;
    commune_name: string;
    wilaya_code: number;
    wilaya_name: string;
};

interface VenuesMarketplaceProps {
    venues: Venue[];
}

export default function VenuesMarketplace({ venues }: VenuesMarketplaceProps) {
    const t = useTranslations("VenuesList");
    const tCommon = useTranslations();
    const wilayas = useMemo(() => getWilayas(tCommon), [tCommon]);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWilaya, setSelectedWilaya] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [cities, setCities] = useState<CityOption[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);
    const citiesCacheRef = useRef(new Map<string, CityOption[]>());

    useEffect(() => {
        if (!selectedWilaya) {
            setCities([]);
            return;
        }

        const wilaya = WILAYAS.find((item) => item.id === selectedWilaya);
        if (!wilaya) {
            setCities([]);
            return;
        }

        const cached = citiesCacheRef.current.get(wilaya.code);
        if (cached) {
            setCities(cached);
            return;
        }

        setCitiesLoading(true);
        fetch(`/api/cities?wilaya_code=${wilaya.code}`)
            .then((res) => res.json())
            .then((payload) => {
                const list = payload?.data || [];
                citiesCacheRef.current.set(wilaya.code, list);
                setCities(list);
            })
            .catch(() => setCities([]))
            .finally(() => setCitiesLoading(false));
    }, [selectedWilaya]);

    const filteredVenues = useMemo(() => {
        return venues.filter((venue) => {
            const haystack = `${venue.title} ${venue.description} ${venue.city || ""} ${venue.wilaya || venue.location || ""}`.toLowerCase();
            const matchesSearch = searchQuery ? haystack.includes(searchQuery.toLowerCase()) : true;
            const matchesWilaya = selectedWilaya ? (venue.wilaya || venue.location) === selectedWilaya : true;
            const matchesCity = selectedCity ? venue.city === selectedCity : true;
            return matchesSearch && matchesWilaya && matchesCity;
        });
    }, [venues, searchQuery, selectedWilaya, selectedCity]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedWilaya("");
        setSelectedCity("");
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50" />
                <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
                <div className="absolute top-40 -left-16 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />

                <div className="relative container mx-auto px-4 pt-16 pb-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/80 px-3 py-1 text-xs text-rose-700">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {t("filters_title")}
                        </div>
                        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">{t("title")}</h1>
                        <p className="mt-2 text-slate-600">{t("subtitle")}</p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("search_placeholder")}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-3">
                            <select
                                value={selectedWilaya}
                                onChange={(e) => {
                                    setSelectedWilaya(e.target.value);
                                    setSelectedCity("");
                                }}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                            >
                                <option value="">{t("select_wilaya")}</option>
                                {wilayas.map((wilaya) => (
                                    <option key={wilaya.id} value={wilaya.id}>
                                        {wilaya.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-3">
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                disabled={!selectedWilaya || citiesLoading}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value="">{citiesLoading ? "Loading..." : t("select_city")}</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.commune_name}>
                                        {city.commune_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-900">{t("results_count", { count: filteredVenues.length })}</span>
                        {(searchQuery || selectedWilaya || selectedCity) && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-slate-300"
                            >
                                <X className="h-3 w-3" />
                                {t("clear_filters")}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16">
                {filteredVenues.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">{t("no_results")}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVenues.map((venue) => (
                            <VenueCard key={venue.id} venue={venue} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
