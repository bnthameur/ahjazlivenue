'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';

// Mock venues for browsing
const mockVenues = [
    {
        id: '1',
        name: 'Le Grand Salon',
        slug: 'le-grand-salon',
        description: 'Elegant wedding hall in the heart of Algiers. Perfect for grand celebrations with up to 500 guests.',
        category: 'Wedding Hall',
        location: 'Algiers',
        capacity_min: 100,
        capacity_max: 500,
        price_range_min: 150000,
        price_range_max: 350000,
        cover_image: null,
        rating: 4.8,
        reviews_count: 45,
    },
    {
        id: '2',
        name: 'Villa des Roses',
        slug: 'villa-des-roses',
        description: 'Beautiful villa with garden and pool. Ideal for intimate gatherings and outdoor events.',
        category: 'Villa',
        location: 'Oran',
        capacity_min: 30,
        capacity_max: 150,
        price_range_min: 80000,
        price_range_max: 150000,
        cover_image: null,
        rating: 4.6,
        reviews_count: 28,
    },
    {
        id: '3',
        name: 'Garden Palace',
        slug: 'garden-palace',
        description: 'Stunning outdoor venue with manicured gardens and mountain views.',
        category: 'Garden/Outdoor',
        location: 'Constantine',
        capacity_min: 50,
        capacity_max: 300,
        price_range_min: 100000,
        price_range_max: 200000,
        cover_image: null,
        rating: 4.9,
        reviews_count: 62,
    },
    {
        id: '4',
        name: 'Hotel Marriott Ballroom',
        slug: 'hotel-marriott-ballroom',
        description: 'Luxurious hotel ballroom with world-class amenities and professional service.',
        category: 'Hotel Ballroom',
        location: 'Algiers',
        capacity_min: 150,
        capacity_max: 800,
        price_range_min: 250000,
        price_range_max: 500000,
        cover_image: null,
        rating: 4.7,
        reviews_count: 89,
    },
    {
        id: '5',
        name: 'Beach Resort Venue',
        slug: 'beach-resort-venue',
        description: 'Beachfront venue with stunning Mediterranean views. Perfect for sunset ceremonies.',
        category: 'Garden/Outdoor',
        location: 'Béjaïa',
        capacity_min: 50,
        capacity_max: 200,
        price_range_min: 120000,
        price_range_max: 220000,
        cover_image: null,
        rating: 4.5,
        reviews_count: 34,
    },
];

const categories = [
    { id: 'all', name: 'All Categories', icon: <Emoji name="classical-building" width={18} /> },
    { id: 'wedding-hall', name: 'Wedding Hall', icon: <Emoji name="wedding" width={18} /> },
    { id: 'event-salon', name: 'Event Salon', icon: <Emoji name="party-popper" width={18} /> },
    { id: 'villa', name: 'Villa', icon: <Emoji name="house-with-garden" width={18} /> },
    { id: 'garden-outdoor', name: 'Garden/Outdoor', icon: <Emoji name="deciduous-tree" width={18} /> },
    { id: 'hotel-ballroom', name: 'Hotel Ballroom', icon: <Emoji name="hotel" width={18} /> },
];

const locations = ['All Locations', 'Algiers', 'Oran', 'Constantine', 'Annaba', 'Béjaïa', 'Sétif', 'Tlemcen'];

export default function VenuesPage() {
    const [venues] = useState(mockVenues);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('All Locations');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredVenues = venues.filter(venue => {
        const matchesCategory = selectedCategory === 'all' || venue.category.toLowerCase().replace(/\//g, '-').includes(selectedCategory);
        const matchesLocation = selectedLocation === 'All Locations' || venue.location === selectedLocation;
        const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            venue.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesLocation && matchesSearch;
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-DZ').format(price);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <br className="mt-16" />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Find Your Perfect Venue
                    </h1>
                    <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
                        Discover amazing event spaces across Algeria for weddings, parties, and special occasions.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl p-3 shadow-xl">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center"><Emoji name="magnifying-glass-tilted-left" width={20} /></span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search venues..."
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-primary-300'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-slate-600">
                        <span className="font-medium text-slate-900">{filteredVenues.length}</span> venues found
                    </p>
                    <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                        <option>Sort by: Featured</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Highest Rated</option>
                    </select>
                </div>

                {/* Venues Grid */}
                {filteredVenues.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVenues.map((venue, index) => (
                            <motion.div
                                key={venue.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Link href={`/venues/${venue.slug}`}>
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all group">
                                        {/* Image */}
                                        <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative overflow-hidden">
                                            {venue.cover_image ? (
                                                <img src={venue.cover_image} alt={venue.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="opacity-50 group-hover:scale-110 transition-transform flex items-center"><Emoji name="classical-building" width={64} /></span>
                                            )}
                                            <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-lg text-xs font-medium flex items-center gap-1">
                                                <Emoji name="star" width={12} /> {venue.rating} ({venue.reviews_count})
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                                    {venue.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                                <span className="flex items-center gap-1"><Emoji name="round-pushpin" width={14} /> {venue.location}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Emoji name="label" width={14} /> {venue.category}</span>
                                            </div>

                                            <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                                                {venue.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div>
                                                    <div className="text-xs text-slate-500">Capacity</div>
                                                    <div className="font-medium text-slate-900">
                                                        {venue.capacity_min}-{venue.capacity_max} guests
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-500">Starting from</div>
                                                    <div className="font-bold text-primary-600">
                                                        {formatPrice(venue.price_range_min)} DZD
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                        <div className="text-6xl mb-4 flex justify-center"><Emoji name="magnifying-glass-tilted-left" width={64} /></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Venues Found</h3>
                        <p className="text-slate-600 mb-4">
                            Try adjusting your filters or search query.
                        </p>
                        <button
                            onClick={() => { setSelectedCategory('all'); setSelectedLocation('All Locations'); setSearchQuery(''); }}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Load More */}
                {filteredVenues.length > 0 && (
                    <div className="text-center mt-10">
                        <button className="px-8 py-3 border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium rounded-xl transition-colors">
                            Load More Venues
                        </button>
                    </div>
                )}
            </div>


        </div>
    );
}
