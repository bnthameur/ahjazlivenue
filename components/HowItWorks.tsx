'use client';

import { motion } from 'framer-motion';
import { Emoji } from 'react-apple-emojis';

const customerSteps = [
    {
        step: '01',
        title: 'Browse Venues',
        description: 'Explore hundreds of venues. Filter by location, category, capacity, and price range.',
        icon: <Emoji name="magnifying-glass-tilted-left" width={24} />,
    },
    {
        step: '02',
        title: 'View Details',
        description: 'Check out photos, videos, amenities, and all the information you need about each venue.',
        icon: <Emoji name="camera-with-flash" width={24} />,
    },
    {
        step: '03',
        title: 'Contact Owner',
        description: 'Reach out directly via WhatsApp, phone, or social media. Book your perfect venue!',
        icon: <Emoji name="telephone-receiver" width={24} />,
    },
];

const ownerSteps = [
    {
        step: '01',
        title: 'Register Free',
        description: 'Create your account in minutes. It\'s completely free for venue owners.',
        icon: <Emoji name="memo" width={24} />,
    },
    {
        step: '02',
        title: 'Add Your Venue',
        description: 'Upload photos, videos, and details. Showcase what makes your venue special.',
        icon: <Emoji name="classical-building" width={24} />,
    },
    {
        step: '03',
        title: 'Get Inquiries',
        description: 'Receive direct inquiries from interested customers. Grow your business!',
        icon: <Emoji name="chart-increasing" width={24} />,
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50">
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
                        How It Works
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Simple Steps to{' '}
                        <span className="text-primary-600">Get Started</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        Whether you're looking for a venue or listing one, we make it easy.
                    </p>
                </motion.div>

                {/* Two Columns */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* For Customers */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <Emoji name="bullseye" width={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">For Customers</h3>
                        </div>

                        <div className="space-y-6">
                            {customerSteps.map((item, index) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                            {item.step}
                                        </div>
                                        {index < customerSteps.length - 1 && (
                                            <div className="w-0.5 h-12 bg-primary-200 mx-auto mt-2" />
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="flex items-center">{item.icon}</span>
                                            <h4 className="font-bold text-slate-900">{item.title}</h4>
                                        </div>
                                        <p className="text-slate-600 text-sm">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <a
                            href="/venues"
                            className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Find Venues
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </motion.div>

                    {/* For Owners */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Emoji name="classical-building" width={32} />
                            </div>
                            <h3 className="text-2xl font-bold">For Venue Owners</h3>
                        </div>

                        <div className="space-y-6">
                            {ownerSteps.map((item, index) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-white text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {item.step}
                                        </div>
                                        {index < ownerSteps.length - 1 && (
                                            <div className="w-0.5 h-12 bg-white/30 mx-auto mt-2" />
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="flex items-center">{item.icon}</span>
                                            <h4 className="font-bold">{item.title}</h4>
                                        </div>
                                        <p className="text-primary-100 text-sm">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <a
                            href="/register"
                            className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-primary-600 font-semibold rounded-lg transition-all duration-200"
                        >
                            List Your Venue Free
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
