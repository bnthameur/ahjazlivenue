'use client';

import { motion } from 'framer-motion';
import { Emoji } from 'react-apple-emojis';

const features = [
    {
        icon: <Emoji name="magnifying-glass-tilted-left" width={28} />,
        title: 'Easy Venue Discovery',
        description: 'Browse hundreds of venues across all 58 wilayas of Algeria. Find the perfect space for your event in minutes.',
    },
    {
        icon: <Emoji name="telephone-receiver" width={28} />,
        title: 'Direct Owner Contact',
        description: 'Connect instantly with venue owners via WhatsApp, phone, or social media. No intermediaries, no hidden fees.',
    },
    {
        icon: <Emoji name="round-pushpin" width={28} />,
        title: 'Location-Based Filtering',
        description: 'Filter venues by wilaya, city, or neighborhood. Find venues near you or in your preferred location.',
    },
    {
        icon: <Emoji name="camera-with-flash" width={28} />,
        title: 'Rich Media Galleries',
        description: 'View high-quality photos and videos of each venue. Get a real feel for the space before you visit.',
    },
    {
        icon: <Emoji name="free-button" width={28} />,
        title: 'Free Venue Listing',
        description: 'Venue owners can list their spaces for free. Reach thousands of potential customers at no cost.',
    },
    {
        icon: <Emoji name="high-voltage" width={28} />,
        title: 'Quick Response',
        description: 'Get fast responses from venue owners. Most inquiries are answered within hours, not days.',
    },
];

export default function Features() {
    return (
        <section id="features" className="py-20 sm:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                        Why Choose Us
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Everything You Need to Find{' '}
                        <span className="text-primary-600">Your Venue</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        We make it simple to discover, compare, and book the perfect venue for your special event.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300"
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover Gradient */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/50 group-hover:to-primary-100/30 transition-all duration-300 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center mt-12 sm:mt-16"
                >
                    <a
                        href="/venues"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        Explore All Venues
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
