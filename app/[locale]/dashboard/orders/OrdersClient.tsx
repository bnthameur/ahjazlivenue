'use client';

import { motion } from 'framer-motion';

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_region: string;
    customer_country: string;
    quantity: number;
    product_name: string;
    total_price: number;
    status: string;
    created_at: string;
    landing_pages: {
        title: string;
        slug: string;
    } | null;
}

interface OrdersClientProps {
    orders: Order[];
}

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersClient({ orders }: OrdersClientProps) {
    return (
        <div className="p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        Orders
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Manage customer orders from your landing pages
                    </p>
                </div>

                {orders.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Qty</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {orders.map((order, index) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">{order.customer_name}</p>
                                                    <p className="text-sm text-slate-500">{order.customer_phone}</p>
                                                    <p className="text-sm text-slate-400">{order.customer_region}, {order.customer_country}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-900">{order.product_name}</p>
                                                <p className="text-sm text-slate-500">{order.landing_pages?.title}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-900">{order.quantity}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {order.total_price?.toLocaleString()} DZD
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 p-12 text-center"
                    >
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📦</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
                        <p className="text-slate-600">Orders will appear here when customers order from your landing pages</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
