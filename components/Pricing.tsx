'use client';

import { motion } from 'framer-motion';
import { Emoji } from 'react-apple-emojis';

const benefits = [
    {
        icon: <Emoji name="loudspeaker" width={24} />,
        title: 'Reach More Customers',
        description: 'Get your venue in front of thousands of people looking for event spaces.',
    },
    {
        icon: <Emoji name="money-bag" width={24} />,
        title: 'No Platform Fees',
        description: 'Keep 100% of your bookings. We don\'t charge any commission.',
    },
    {
        icon: <Emoji name="high-voltage" width={24} />,
        title: 'Easy Management',
        description: 'Simple dashboard to manage your venue listing and inquiries.',
    },
    {
        icon: <Emoji name="bar-chart" width={24} />,
        title: 'Track Performance',
        description: 'See how many views and inquiries your venue receives.',
    },
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-20 sm:py-28 bg-white">
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
                        For Venue Owners
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Free to List,{' '}
                        <span className="text-primary-600">Free to Grow</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        We believe venue owners should focus on their business, not platform fees.
                    </p>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:3rem_3rem]" />
                        </div>

                        <div className="relative">
                            {/* Free Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
                                <span className="text-lg flex items-center"><Emoji name="wrapped-gift" width={20} /></span>
                                <span>Limited Time Offer</span>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="text-6xl sm:text-7xl font-bold mb-2">FREE</div>
                                <div className="text-primary-100">No credit card required</div>
                            </div>

                            {/* Benefits Grid */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left max-w-2xl mx-auto">
                                {benefits.map((benefit) => (
                                    <div key={benefit.title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                                        <span className="text-2xl flex items-center">{benefit.icon}</span>
                                        <div>
                                            <h4 className="font-bold mb-1">{benefit.title}</h4>
                                            <p className="text-sm text-primary-100">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* What's Included */}
                            <div className="flex flex-wrap justify-center gap-3 mb-8">
                                {[
                                    'Unlimited Photos',
                                    'Video Upload',
                                    'Contact Info Display',
                                    'Social Media Links',
                                    'Analytics Dashboard',
                                    'Direct Inquiries',
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                                        <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <a
                                href="/register"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-primary-600 font-bold rounded-xl text-lg transition-all duration-200"
                            >
                                Start Listing Now
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Trust Message */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center text-slate-500 mt-8"
                >
                    Join hundreds of venue owners already growing their business with us.
                </motion.p>
            </div>
        </section>
    );
}
