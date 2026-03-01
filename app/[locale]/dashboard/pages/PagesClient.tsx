'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';

interface LandingPage {
    id: string;
    slug: string;
    title: string;
    status: string;
    country: string;
    views_count: number;
    orders_count: number;
    created_at: string;
    product_price: number;
    final_image_url?: string;
    language?: string;
}

interface PagesClientProps {
    landingPages: LandingPage[];
}

export default function PagesClient({ landingPages }: PagesClientProps) {
    return (
        <div className="p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Landing Pages
                        </h1>
                        <p className="mt-1 text-slate-600">
                            Manage your landing pages
                        </p>
                    </div>
                    <Link
                        href="/dashboard/pages/new"
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Page
                    </Link>
                </div>

                {landingPages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {landingPages.map((page, index) => (
                            <motion.div
                                key={page.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Link href={`/dashboard/pages/${page.id}`}>
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer group">
                                        {/* Preview Image */}
                                        {page.final_image_url ? (
                                            <img
                                                src={page.final_image_url}
                                                alt={page.title}
                                                className="h-40 w-full object-cover object-top"
                                            />
                                        ) : (
                                            <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                <span className="text-4xl opacity-50">📄</span>
                                            </div>
                                        )}

                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                                                    {page.title}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${page.status === 'published'
                                                    ? 'bg-green-100 text-green-700'
                                                    : page.status === 'draft'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {page.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-3">/p/{page.id.slice(0, 8)}...</p>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3 text-slate-500">
                                                    <span>👁 {page.views_count}</span>
                                                    <span>📦 {page.orders_count}</span>
                                                </div>
                                                <span className="font-medium text-slate-900">
                                                    {page.product_price?.toLocaleString()} DZD
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
                    >
                        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">No landing pages yet</h2>
                        <p className="text-slate-600 mb-6">Create your first landing page with AI</p>
                        <Link
                            href="/dashboard/pages/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create New Page
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
