'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_location: string;
    quantity: number;
    status: string;
    created_at: string;
    landing_page_id: string;
    landing_pages?: {
        title: string;
        slug: string;
    };
}

export default function OrdersPage() {
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch orders for pages owned by this user
            // We join with landing_pages to filtering by user_id
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    landing_pages!inner (
                        title,
                        slug,
                        user_id
                    )
                `)
                .eq('landing_pages.user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setOrders(data as any);
            }
            setIsLoading(false);
        };

        fetchOrders();

        // Realtime subscription could go here
    }, [supabase]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (!error) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                    <p className="text-slate-600">Manage orders from your landing pages.</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-500 mb-2">No orders yet.</p>
                    <p className="text-sm text-slate-400">Orders from your landing pages will appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Product / Page</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`text-xs font-bold px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            'bg-slate-100 text-slate-700'
                                                    }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.landing_pages?.title || 'Unknown Product'}</div>
                                            <div className="text-xs text-slate-500">Qty: {order.quantity}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.customer_name}</div>
                                            <div className="text-sm font-mono text-slate-500">{order.customer_phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {order.customer_location}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`tel:${order.customer_phone}`}
                                                className="text-primary-600 hover:text-primary-800 font-medium text-sm mr-4"
                                            >
                                                Call
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
