'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';

// Mock venue detail - will be fetched from Supabase by slug
const venueDetail = {
    id: '1',
    name: 'Le Grand Salon',
    slug: 'le-grand-salon',
    description: `Le Grand Salon is one of the most prestigious wedding venues in Algiers. With its elegant architecture and luxurious interior, it provides the perfect setting for your special day.

Our venue features high ceilings, crystal chandeliers, and a spacious dance floor. We can accommodate intimate gatherings of 100 guests up to grand celebrations with 500 guests.

Our dedicated team will work with you to create a truly memorable event, handling everything from catering to decoration.`,
    category: 'Wedding Hall',
    location: 'Algiers',
    address: '123 Avenue de l\'Indépendance, Alger Centre',
    capacity_min: 100,
    capacity_max: 500,
    price_range_min: 150000,
    price_range_max: 350000,
    phone: '0555 123 456',
    whatsapp: '213555123456',
    email: 'contact@legrandsalon.dz',
    facebook_url: 'https://facebook.com/legrandsalon',
    instagram_url: 'https://instagram.com/legrandsalon',
    amenities: ['Parking', 'Air Conditioning', 'Sound System', 'Lighting', 'Stage', 'Catering', 'Bridal Suite', 'Dance Floor', 'Valet Parking'],
    rating: 4.8,
    reviews_count: 45,
    views_count: 1245,
    media: [
        { type: 'image', url: null, caption: 'Main Hall' },
        { type: 'image', url: null, caption: 'Reception Area' },
        { type: 'image', url: null, caption: 'Dance Floor' },
        { type: 'image', url: null, caption: 'Bridal Suite' },
    ],
    owner: {
        name: 'Fatima Zahra',
        business_name: 'Zahra Events',
        member_since: '2024',
    },
};

export default function VenueDetailPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [venue] = useState(venueDetail);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Check authentication status
    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { session } = {} } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };
        checkUser();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-DZ').format(price);
    };

    return (
        <div className="min-h-screen bg-slate-50">


            {/* Image Gallery */}
            <section className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-4 gap-4 h-64 md:h-96">
                        <div className="col-span-4 md:col-span-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                            <span className="opacity-50 flex items-center"><Emoji name="classical-building" width={128} /></span>
                            {venue.media[selectedImageIndex]?.caption && (
                                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-lg">
                                    {venue.media[selectedImageIndex].caption}
                                </div>
                            )}
                        </div>
                        <div className="hidden md:grid col-span-2 grid-cols-2 gap-4">
                            {venue.media.slice(0, 4).map((media, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:opacity-80 ${selectedImageIndex === index ? 'ring-2 ring-primary-500' : ''
                                        }`}
                                >
                                    <span className="opacity-50 flex items-center"><Emoji name="camera" width={32} /></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title & Meta */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                                        {venue.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 text-slate-600">
                                        <span className="flex items-center gap-1"><Emoji name="round-pushpin" width={16} /> {venue.location}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Emoji name="label" width={16} /> {venue.category}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><Emoji name="star" width={16} /> {venue.rating} ({venue.reviews_count} reviews)</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-bold text-slate-900 mb-4">About this Venue</h2>
                            <div className="prose prose-slate max-w-none">
                                {venue.description.split('\n\n').map((para, i) => (
                                    <p key={i} className="text-slate-600 mb-4 last:mb-0">{para}</p>
                                ))}
                            </div>
                        </motion.div>

                        {/* Quick Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                        >
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center">
                                <div className="mb-1"><Emoji name="busts-in-silhouette" width={32} /></div>
                                <div className="text-sm text-slate-500">Capacity</div>
                                <div className="font-bold text-slate-900">{venue.capacity_min}-{venue.capacity_max}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center">
                                <div className="mb-1"><Emoji name="money-bag" width={32} /></div>
                                <div className="text-sm text-slate-500">Starting Price</div>
                                <div className="font-bold text-slate-900">{formatPrice(venue.price_range_min)} DZD</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center">
                                <div className="mb-1"><Emoji name="star" width={32} /></div>
                                <div className="text-sm text-slate-500">Rating</div>
                                <div className="font-bold text-slate-900">{venue.rating}/5</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center">
                                <div className="mb-1"><Emoji name="eye" width={32} /></div>
                                <div className="text-sm text-slate-500">Views</div>
                                <div className="font-bold text-slate-900">{venue.views_count.toLocaleString()}</div>
                            </div>
                        </motion.div>

                        {/* Amenities */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Amenities & Features</h2>
                            <div className="flex flex-wrap gap-2">
                                {venue.amenities.map((amenity) => (
                                    <span
                                        key={amenity}
                                        className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                                    >
                                        ✓ {amenity}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        {/* Location */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Location</h2>
                            <p className="text-slate-600 mb-4">{venue.address}</p>
                            <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center">
                                <span className="text-slate-400">📍 Map placeholder</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Contact Card */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24"
                        >
                            {/* Price Range */}
                            <div className="mb-6 pb-6 border-b border-slate-100">
                                <div className="text-sm text-slate-500 mb-1">Price Range</div>
                                <div className="text-3xl font-bold text-primary-600">
                                    {formatPrice(venue.price_range_min)} - {formatPrice(venue.price_range_max)}
                                    <span className="text-base font-normal text-slate-500 ml-1">DZD</span>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="mb-6 pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-xl font-bold">
                                        {venue.owner.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{venue.owner.name}</div>
                                        <div className="text-sm text-slate-500">{venue.owner.business_name}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">Member since {venue.owner.member_since}</div>
                            </div>

                            {/* Contact Buttons (Protected) */}
                            {loading ? (
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                    <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
                                </div>
                            ) : user ? (
                                <div className="space-y-3">
                                    <a
                                        href={`https://wa.me/${venue.whatsapp}?text=Hi, I'm interested in ${venue.name} for my event.`}
                                        target="_blank"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                                    >
                                        <Emoji name="speech-balloon" width={20} />
                                        Contact via WhatsApp
                                    </a>
                                    <a
                                        href={`tel:${venue.phone}`}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                                    >
                                        <Emoji name="telephone-receiver" width={20} />
                                        Call {venue.phone}
                                    </a>
                                    {venue.email && (
                                        <a
                                            href={`mailto:${venue.email}?subject=Inquiry about ${venue.name}`}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            <Emoji name="envelope" width={20} />
                                            Send Email
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-xl text-center border border-slate-100 flex flex-col items-center">
                                        <div className="mb-2"><Emoji name="locked" width={32} /></div>
                                        <p className="text-sm text-slate-600 mb-3">Login to view contact details and book this venue.</p>
                                        <Link
                                            href="/login"
                                            className="block w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                                        >
                                            Login / Register
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            {(venue.facebook_url || venue.instagram_url) && (
                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <div className="text-sm text-slate-500 mb-3">Follow on social media</div>
                                    <div className="flex gap-3">
                                        {venue.facebook_url && (
                                            <a
                                                href={venue.facebook_url}
                                                target="_blank"
                                                className="w-10 h-10 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <Emoji name="blue-book" width={20} />
                                            </a>
                                        )}
                                        {venue.instagram_url && (
                                            <a
                                                href={venue.instagram_url}
                                                target="_blank"
                                                className="w-10 h-10 bg-pink-100 hover:bg-pink-200 rounded-lg flex items-center justify-center transition-colors"
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
