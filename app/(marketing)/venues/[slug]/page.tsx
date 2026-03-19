'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

type VenueRecord = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category?: string | null;
    location?: string | null;
    address?: string | null;
    capacity_min?: number | null;
    capacity_max?: number | null;
    price_range_min?: number | null;
    price_range_max?: number | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    amenities?: string[] | null;
    views_count?: number | null;
    images?: string[] | null;
    venue_media?: Array<{
        url: string;
        caption?: string | null;
        media_type?: string | null;
        is_cover?: boolean | null;
    }> | null;
};

export default function VenueDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [venue, setVenue] = useState<VenueRecord | null>(null);
    const [loadError, setLoadError] = useState('');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        const loadPage = async () => {
            const supabase = createClient();
            const [{ data: { session } = {} }, venueResponse] = await Promise.all([
                supabase.auth.getSession(),
                fetch(`/api/venues/${slug}`, { cache: 'no-store' }),
            ]);

            setUser(session?.user || null);

            if (!venueResponse.ok) {
                setLoadError('Venue not found.');
                setLoading(false);
                return;
            }

            const payload = await venueResponse.json();
            setVenue(payload.data || null);
            setLoading(false);
        };

        if (slug) {
            loadPage().catch((error) => {
                console.error('Error loading venue page:', error);
                setLoadError('Could not load this venue right now.');
                setLoading(false);
            });
        }
    }, [slug]);

    const gallery = useMemo(() => {
        if (!venue) return [];

        const mediaFromTable = (venue.venue_media || [])
            .filter((item) => item.url)
            .map((item) => ({
                url: item.url,
                caption: item.caption || null,
            }));

        if (mediaFromTable.length > 0) return mediaFromTable;

        return (venue.images || []).map((url) => ({
            url,
            caption: null,
        }));
    }, [venue]);

    const selectedImage = gallery[selectedImageIndex] || gallery[0] || null;

    const formatPrice = (price: number) => new Intl.NumberFormat('fr-DZ').format(price);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
        );
    }

    if (!venue || loadError) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center">
                    <div className="mb-4 flex justify-center">
                        <Emoji name="warning" width={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Venue unavailable</h1>
                    <p className="mt-2 text-slate-600">{loadError || 'This venue page is not available.'}</p>
                    <Link
                        href="/venues"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                    >
                        Back to venues
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="grid h-64 grid-cols-4 gap-4 md:h-96">
                        <div className="relative col-span-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 md:col-span-2">
                            {selectedImage?.url ? (
                                <img src={selectedImage.url} alt={venue.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <span className="opacity-50"><Emoji name="classical-building" width={128} /></span>
                                </div>
                            )}
                            {selectedImage?.caption && (
                                <div className="absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-1 text-sm text-white">
                                    {selectedImage.caption}
                                </div>
                            )}
                        </div>
                        <div className="hidden col-span-2 grid-cols-2 gap-4 md:grid">
                            {(gallery.length > 0 ? gallery : new Array(4).fill(null)).slice(0, 4).map((media, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`overflow-hidden rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 transition-all hover:opacity-80 ${
                                        selectedImageIndex === index ? 'ring-2 ring-primary-500' : ''
                                    }`}
                                >
                                    {media?.url ? (
                                        <img src={media.url} alt={`${venue.name} ${index + 1}`} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex h-full items-center justify-center opacity-50">
                                            <Emoji name="camera" width={32} />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="mb-2 text-3xl font-bold text-slate-900 sm:text-4xl">{venue.name}</h1>
                                    <div className="flex flex-wrap items-center gap-3 text-slate-600">
                                        {venue.location && <span className="flex items-center gap-1"><Emoji name="round-pushpin" width={16} /> {venue.location}</span>}
                                        {venue.category && <span className="flex items-center gap-1"><Emoji name="label" width={16} /> {venue.category}</span>}
                                        <span className="flex items-center gap-1"><Emoji name="eye" width={16} /> {venue.views_count || 0} views</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-slate-200 bg-white p-6"
                        >
                            <h2 className="mb-4 text-lg font-bold text-slate-900">About this Venue</h2>
                            <div className="prose prose-slate max-w-none">
                                {(venue.description || 'No description provided yet.').split('\n\n').map((para, i) => (
                                    <p key={i} className="mb-4 text-slate-600 last:mb-0">{para}</p>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                        >
                            <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center">
                                <div className="mb-1"><Emoji name="busts-in-silhouette" width={32} /></div>
                                <div className="text-sm text-slate-500">Capacity</div>
                                <div className="font-bold text-slate-900">{venue.capacity_min || 0}-{venue.capacity_max || 0}</div>
                            </div>
                            <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center">
                                <div className="mb-1"><Emoji name="money-bag" width={32} /></div>
                                <div className="text-sm text-slate-500">Starting Price</div>
                                <div className="font-bold text-slate-900">
                                    {venue.price_range_min ? `${formatPrice(venue.price_range_min)} DZD` : 'Contact for pricing'}
                                </div>
                            </div>
                            <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center">
                                <div className="mb-1"><Emoji name="label" width={32} /></div>
                                <div className="text-sm text-slate-500">Category</div>
                                <div className="font-bold text-slate-900">{venue.category || 'Venue'}</div>
                            </div>
                            <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center">
                                <div className="mb-1"><Emoji name="eye" width={32} /></div>
                                <div className="text-sm text-slate-500">Views</div>
                                <div className="font-bold text-slate-900">{(venue.views_count || 0).toLocaleString()}</div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-slate-200 bg-white p-6"
                        >
                            <h2 className="mb-4 text-lg font-bold text-slate-900">Amenities & Features</h2>
                            <div className="flex flex-wrap gap-2">
                                {(venue.amenities || []).length > 0 ? (
                                    (venue.amenities || []).map((amenity) => (
                                        <span
                                            key={amenity}
                                            className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700"
                                        >
                                            {amenity}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">Amenities will appear here once the owner adds them.</p>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl border border-slate-200 bg-white p-6"
                        >
                            <h2 className="mb-4 text-lg font-bold text-slate-900">Location</h2>
                            <p className="mb-4 text-slate-600">{venue.address || venue.location || 'Address not available yet.'}</p>
                            <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                Map preview coming soon
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6"
                        >
                            <div className="mb-6 border-b border-slate-100 pb-6">
                                <div className="mb-1 text-sm text-slate-500">Price Range</div>
                                <div className="text-3xl font-bold text-primary-600">
                                    {venue.price_range_min || venue.price_range_max
                                        ? `${venue.price_range_min ? formatPrice(venue.price_range_min) : '0'} - ${venue.price_range_max ? formatPrice(venue.price_range_max) : '0'}`
                                        : 'Contact'}
                                    {(venue.price_range_min || venue.price_range_max) && (
                                        <span className="ml-1 text-base font-normal text-slate-500">DZD</span>
                                    )}
                                </div>
                            </div>

                            {user ? (
                                <div className="space-y-3">
                                    {venue.whatsapp && (
                                        <a
                                            href={`https://wa.me/${venue.whatsapp}?text=Hi, I'm interested in ${venue.name} for my event.`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700"
                                        >
                                            <Emoji name="speech-balloon" width={20} />
                                            Contact via WhatsApp
                                        </a>
                                    )}
                                    {venue.phone && (
                                        <a
                                            href={`tel:${venue.phone}`}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                                        >
                                            <Emoji name="telephone-receiver" width={20} />
                                            Call {venue.phone}
                                        </a>
                                    )}
                                    {venue.email && (
                                        <a
                                            href={`mailto:${venue.email}?subject=Inquiry about ${venue.name}`}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                        >
                                            <Emoji name="envelope" width={20} />
                                            Send Email
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                                        <div className="mb-2"><Emoji name="locked" width={32} /></div>
                                        <p className="mb-3 text-sm text-slate-600">Login to view contact details and book this venue.</p>
                                        <Link
                                            href="/login"
                                            className="block w-full rounded-xl bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                                        >
                                            Login / Register
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {(venue.facebook_url || venue.instagram_url) && (
                                <div className="mt-6 border-t border-slate-100 pt-6">
                                    <div className="mb-3 text-sm text-slate-500">Follow on social media</div>
                                    <div className="flex gap-3">
                                        {venue.facebook_url && (
                                            <a
                                                href={venue.facebook_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 transition-colors hover:bg-blue-200"
                                            >
                                                <Emoji name="blue-book" width={20} />
                                            </a>
                                        )}
                                        {venue.instagram_url && (
                                            <a
                                                href={venue.instagram_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 transition-colors hover:bg-pink-200"
                                            >
                                                <Emoji name="camera" width={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
