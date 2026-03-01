'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: 'How do I list my venue on the platform?',
        answer: 'Simply create a free account, fill in your venue details, upload photos and videos, and submit for review. Once approved, your venue will be visible to thousands of potential customers.',
    },
    {
        question: 'Is it really free for venue owners?',
        answer: 'Yes! Listing your venue is completely free. We don\'t charge any subscription fees, commission, or hidden costs. You keep 100% of your bookings.',
    },
    {
        question: 'How long does the approval process take?',
        answer: 'We review new venue listings within 24-48 hours. Make sure to provide accurate information and quality photos to speed up the approval process.',
    },
    {
        question: 'How do customers contact me?',
        answer: 'Customers can contact you directly through the contact information you provide - phone, WhatsApp, email, or social media links. We display all your contact options on your venue page.',
    },
    {
        question: 'Can I edit my venue listing after it\'s published?',
        answer: 'Absolutely! You can update your venue photos, description, pricing, and contact information anytime through your dashboard. Major changes may require re-approval.',
    },
    {
        question: 'What types of venues can I list?',
        answer: 'We accept all types of event venues including wedding halls, salons, conference rooms, gardens, villas, hotel ballrooms, restaurants with event spaces, and rooftops.',
    },
    {
        question: 'Is my information safe?',
        answer: 'Yes, we take security seriously. Your personal information is protected and only the contact details you choose to display will be visible to customers.',
    },
    {
        question: 'How can I get more visibility for my venue?',
        answer: 'Complete your profile with high-quality photos and videos, respond quickly to inquiries, and encourage satisfied customers to spread the word. We\'ll introduce premium features soon!',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-20 sm:py-28 bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                        FAQ
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Frequently Asked{' '}
                        <span className="text-primary-600">Questions</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        Everything you need to know about listing your venue.
                    </p>
                </motion.div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full bg-white rounded-xl p-5 text-left border border-slate-200 hover:border-primary-200 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <span className="font-semibold text-slate-900">{faq.question}</span>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === index ? 'bg-primary-600 text-white rotate-180' : 'bg-slate-100 text-slate-600'}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pt-4 text-slate-600 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center mt-12 p-8 bg-white rounded-2xl border border-slate-200"
                >
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Still have questions?</h3>
                    <p className="text-slate-600 mb-4">Can't find the answer you're looking for? We're here to help.</p>
                    <a
                        href="mailto:support@ahjazliqaati.dz"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact Support
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
