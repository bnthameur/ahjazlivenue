'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/navigation';

interface LandingPage {
    id: string;
    slug: string;
    title: string;
    status: string;
    country: string;
    product_name: string;
    product_description: string;
    product_price: number;
    product_discount_price: number | null;
    views_count: number;
    orders_count: number;
    whatsapp_number: string | null;
    cta_button_text: string;
    created_at: string;
    published_at: string | null;
}

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    quantity: number;
    total_price: number;
    status: string;
    created_at: string;
}

interface PageDetailClientProps {
    page: LandingPage;
    orders: Order[];
}

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function PageDetailClient({ page, orders }: PageDetailClientProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(page.status);

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(true);
        try {
            const updateData: any = { status: newStatus };
            if (newStatus === 'published' && !page.published_at) {
                updateData.published_at = new Date().toISOString();
            }

            await supabase
                .from('landing_pages')
                .update(updateData)
                .eq('id', page.id);

            setStatus(newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this page? This cannot be undone.')) {
            return;
        }

        setIsLoading(true);
        try {
            await supabase.from('landing_pages').delete().eq('id', page.id);
            router.push('/dashboard/pages');
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const pageUrl = `/p/${page.id}`;

    return (
        <div className="p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <Link href="/dashboard/pages" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
                            ← Back to Pages
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{page.title}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status === 'published' ? 'bg-green-100 text-green-700' :
                                status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                {status}
                            </span>
                            <Link
                                href={pageUrl}
                                target="_blank"
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                {pageUrl} ↗
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {status === 'draft' && (
                            <button
                                onClick={() => handleStatusChange('published')}
                                disabled={isLoading}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Publish
                            </button>
                        )}
                        {status === 'published' && (
                            <button
                                onClick={() => handleStatusChange('draft')}
                                disabled={isLoading}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl transition-colors"
                            >
                                Unpublish
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <p className="text-sm text-slate-500 mb-1">Views</p>
                                <p className="text-2xl font-bold text-slate-900">{page.views_count}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <p className="text-sm text-slate-500 mb-1">Orders</p>
                                <p className="text-2xl font-bold text-slate-900">{page.orders_count}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <p className="text-sm text-slate-500 mb-1">Conversion</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {page.views_count > 0
                                        ? ((page.orders_count / page.views_count) * 100).toFixed(1)
                                        : 0}%
                                </p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <p className="text-sm text-slate-500 mb-1">Revenue</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {(page.orders_count * page.product_price).toLocaleString()} DZD
                                </p>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
                            </div>
                            {orders.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {orders.map((order) => (
                                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                            <div>
                                                <p className="font-medium text-slate-900">{order.customer_name}</p>
                                                <p className="text-sm text-slate-500">{order.customer_phone}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-slate-900">{order.total_price?.toLocaleString()} DZD</p>
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    No orders yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Page Details */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Product Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Product Name</p>
                                    <p className="font-medium text-slate-900">{page.product_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Description</p>
                                    <p className="text-slate-700">{page.product_description}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Price</p>
                                        <p className="font-bold text-slate-900">{page.product_price?.toLocaleString()} DZD</p>
                                    </div>
                                    {page.product_discount_price && (
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">Discount Price</p>
                                            <p className="font-bold text-green-600">{page.product_discount_price?.toLocaleString()} DZD</p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Country</p>
                                    <p className="font-medium text-slate-900">
                                        {page.country === 'DZ' ? '🇩🇿 Algeria' :
                                            page.country === 'MA' ? '🇲🇦 Morocco' :
                                                '🇹🇳 Tunisia'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">CTA Button</p>
                                    <p className="font-medium text-slate-900">{page.cta_button_text || 'Order Now'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Page Info</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Created</span>
                                    <span className="text-slate-900">{new Date(page.created_at).toLocaleDateString()}</span>
                                </div>
                                {page.published_at && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Published</span>
                                        <span className="text-slate-900">{new Date(page.published_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Slug</span>
                                    <span className="text-slate-900 font-mono">{page.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
