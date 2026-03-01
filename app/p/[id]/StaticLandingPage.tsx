'use client';

import { useState } from 'react';

interface StaticLandingPageProps {
    pageId: string;
    imageUrl: string;
    ctaText: string;
    language: 'ar' | 'fr' | 'en';
    country: 'DZ' | 'MA' | 'TN';
    price: number;
    discountPrice: number | null;
    productName: string;
    primaryColor: string;
}

const translations = {
    ar: {
        orderTitle: 'اطلب الآن',
        fullName: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        address: 'العنوان',
        region: 'الولاية / المدينة',
        quantity: 'الكمية',
        total: 'المجموع',
        submit: 'تأكيد الطلب',
        submitting: 'جاري الإرسال...',
        success: 'تم استلام طلبك بنجاح!',
        successSub: 'سيتم الاتصال بك قريباً للتأكيد',
        freeDelivery: 'توصيل مجاني',
        cod: 'الدفع عند الاستلام',
    },
    fr: {
        orderTitle: 'Passer la commande',
        fullName: 'Nom complet',
        phone: 'Téléphone',
        address: 'Adresse',
        region: 'Région / Ville',
        quantity: 'Quantité',
        total: 'Total',
        submit: 'Confirmer',
        submitting: 'Envoi...',
        success: 'Commande reçue!',
        successSub: 'Nous vous contacterons bientôt',
        freeDelivery: 'Livraison gratuite',
        cod: 'Paiement à la livraison',
    },
    en: {
        orderTitle: 'Place Your Order',
        fullName: 'Full Name',
        phone: 'Phone Number',
        address: 'Address',
        region: 'Region / City',
        quantity: 'Quantity',
        total: 'Total',
        submit: 'Confirm Order',
        submitting: 'Submitting...',
        success: 'Order Received!',
        successSub: 'We will contact you soon',
        freeDelivery: 'Free Delivery',
        cod: 'Cash on Delivery',
    },
};

const currencies = { DZ: 'د.ج', MA: 'د.م', TN: 'د.ت' };

export default function StaticLandingPage({
    pageId,
    imageUrl,
    ctaText,
    language,
    country,
    price,
    discountPrice,
    productName,
    primaryColor,
}: StaticLandingPageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', region: '' });

    const t = translations[language];
    const currency = currencies[country];
    const finalPrice = discountPrice || price;
    const total = finalPrice * quantity;
    const isRtl = language === 'ar';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return;
        setIsSubmitting(true);

        try {
            await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    landing_page_id: pageId,
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    customer_address: formData.address,
                    customer_region: formData.region,
                    customer_country: country,
                    quantity,
                    product_name: productName,
                    unit_price: finalPrice,
                    total_price: total,
                }),
            });
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50" dir={isRtl ? 'rtl' : 'ltr'}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap');
                body { font-family: ${isRtl ? "'Tajawal'" : "'Inter'"}, sans-serif; margin: 0; }
            `}</style>

            {/* Landing Page Image */}
            {imageUrl ? (
                <img src={imageUrl} alt={productName} className="w-full" loading="eager" fetchPriority="high" />
            ) : (
                <div className="w-full h-96 bg-slate-100 flex items-center justify-center">
                    <p className="text-slate-400">No image</p>
                </div>
            )}

            {/* Order Form */}
            <div className="p-4 sm:p-6" style={{ backgroundColor: `${primaryColor}10` }}>
                <div className="max-w-lg mx-auto">
                    {isSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primaryColor }}>
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">{t.success}</h2>
                            <p className="text-slate-600">{t.successSub}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <h2 className="text-xl font-bold text-center mb-4" style={{ color: primaryColor }}>{t.orderTitle}</h2>
                            <div className="flex items-center justify-center gap-4 text-sm text-slate-600 mb-4">
                                <span>✓ {t.freeDelivery}</span>
                                <span>✓ {t.cod}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t.fullName} required className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl" />
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder={t.phone} required className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}
                                    placeholder={t.region} className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl" />
                                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder={t.address} className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl" />
                            </div>

                            <div className="flex items-center justify-between bg-white rounded-xl p-3 border-2 border-slate-200">
                                <span className="font-medium">{t.quantity}</span>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 bg-slate-100 rounded-full font-bold">−</button>
                                    <span className="font-bold text-lg">{quantity}</span>
                                    <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 bg-slate-100 rounded-full font-bold">+</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-slate-200">
                                <span className="font-bold">{t.total}</span>
                                <span className="text-2xl font-bold" style={{ color: primaryColor }}>{total.toLocaleString()} {currency}</span>
                            </div>

                            <button type="submit" disabled={isSubmitting}
                                className="w-full py-4 text-white font-bold text-lg rounded-xl disabled:opacity-60"
                                style={{ backgroundColor: primaryColor }}>
                                {isSubmitting ? t.submitting : ctaText || t.submit}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
