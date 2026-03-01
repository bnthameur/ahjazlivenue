'use client';

import { useState } from 'react';
import { Emoji } from 'react-apple-emojis';

interface CodedLandingPageProps {
    pageId: string;
    productName: string;
    language: 'ar' | 'fr' | 'en';
    country: 'DZ' | 'MA' | 'TN';
    price: number;
    discountPrice: number | null;
    primaryColor: string;
    secondaryColor: string;
    ctaText: string;
    aiContent: {
        headline?: string;
        subheadline?: string;
        benefits?: string[];
        features?: string[];
        trust_badge?: string;
    };
    sectionImages: {
        heroBg?: string;
        problem?: string;
        solution?: string;
        featureMacro?: string;
        featureAbstract?: string;
        steps?: string;
        beforeAfter?: string;
        avatars?: string;
    };
    productImages: string[];
}

const translations = {
    ar: {
        limitedOffer: '🔥 عرض محدود - خصم 50%',
        orderNow: 'اطلب الآن',
        problem1: 'هل تعاني من هذه المشكلة؟',
        problem2: 'هل جربت حلول لم تنجح؟',
        problem3: 'هل تبحث عن نتائج حقيقية؟',
        introducing: 'نقدم لكم',
        howItWorks: 'كيف يعمل',
        step1: 'الخطوة 1: التحضير',
        step2: 'الخطوة 2: الاستخدام',
        step3: 'الخطوة 3: النتائج',
        beforeAfter: 'قبل وبعد',
        before: 'قبل',
        after: 'بعد',
        guaranteed: 'نتائج مضمونة في 7 أيام',
        testimonials: 'آراء العملاء',
        stars: '⭐⭐⭐⭐⭐',
        urgency: 'فقط 12 قطعة متبقية!',
        freeDelivery: 'توصيل مجاني',
        cod: 'الدفع عند الاستلام',
        guarantee: 'ضمان استرداد المال',
        original: '100% أصلي',
        fastShipping: 'شحن سريع',
        fullName: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        address: 'العنوان',
        region: 'الولاية',
        quantity: 'الكمية',
        total: 'المجموع',
        submit: 'تأكيد الطلب - الدفع عند الاستلام',
        submitting: 'جاري الإرسال...',
        success: 'تم استلام طلبك!',
        successSub: 'سنتصل بك خلال 24 ساعة',
    },
    fr: {
        limitedOffer: '🔥 Offre Limitée - 50% de Réduction',
        orderNow: 'Commander',
        problem1: 'Souffrez-vous de ce problème?',
        problem2: 'Avez-vous essayé des solutions qui n\'ont pas fonctionné?',
        problem3: 'Cherchez-vous de vrais résultats?',
        introducing: 'Présentation',
        howItWorks: 'Comment ça marche',
        step1: 'Étape 1: Préparation',
        step2: 'Étape 2: Utilisation',
        step3: 'Étape 3: Résultats',
        beforeAfter: 'Avant et Après',
        before: 'Avant',
        after: 'Après',
        guaranteed: 'Résultats garantis en 7 jours',
        testimonials: 'Témoignages',
        stars: '⭐⭐⭐⭐⭐',
        urgency: 'Seulement 12 pièces restantes!',
        freeDelivery: 'Livraison gratuite',
        cod: 'Paiement à la livraison',
        guarantee: 'Garantie satisfait ou remboursé',
        original: '100% Original',
        fastShipping: 'Expédition rapide',
        fullName: 'Nom complet',
        phone: 'Téléphone',
        address: 'Adresse',
        region: 'Région',
        quantity: 'Quantité',
        total: 'Total',
        submit: 'Confirmer - Paiement à la livraison',
        submitting: 'Envoi...',
        success: 'Commande reçue!',
        successSub: 'Nous vous contacterons sous 24h',
    },
    en: {
        limitedOffer: '🔥 Limited Offer - 50% OFF',
        orderNow: 'Order Now',
        problem1: 'Do you suffer from this problem?',
        problem2: 'Have you tried solutions that didn\'t work?',
        problem3: 'Are you looking for real results?',
        introducing: 'Introducing',
        howItWorks: 'How It Works',
        step1: 'Step 1: Preparation',
        step2: 'Step 2: Application',
        step3: 'Step 3: Results',
        beforeAfter: 'Before & After',
        before: 'Before',
        after: 'After',
        guaranteed: 'Results guaranteed in 7 days',
        testimonials: 'Customer Reviews',
        stars: '⭐⭐⭐⭐⭐',
        urgency: 'Only 12 pieces left!',
        freeDelivery: 'Free Delivery',
        cod: 'Cash on Delivery',
        guarantee: 'Money-Back Guarantee',
        original: '100% Original',
        fastShipping: 'Fast Shipping',
        fullName: 'Full Name',
        phone: 'Phone',
        address: 'Address',
        region: 'Region',
        quantity: 'Quantity',
        total: 'Total',
        submit: 'Confirm Order - Cash on Delivery',
        submitting: 'Submitting...',
        success: 'Order Received!',
        successSub: 'We\'ll contact you within 24h',
    },
};

const StarRating = () => (
    <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Emoji key={i} name="star" width={20} />
        ))}
    </div>
);

const currencies = { DZ: 'د.ج', MA: 'د.م', TN: 'د.ت' };

export default function CodedLandingPage({
    pageId, productName, language, country, price, discountPrice, primaryColor, secondaryColor,
    ctaText, aiContent, sectionImages, productImages,
}: CodedLandingPageProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', region: '' });

    const t = translations[language];
    const currency = currencies[country];
    const finalPrice = discountPrice || price;
    const total = finalPrice * quantity;
    const isRtl = language === 'ar';
    const savings = discountPrice ? price - discountPrice : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return;
        setIsSubmitting(true);
        try {
            await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    landing_page_id: pageId, customer_name: formData.name, customer_phone: formData.phone,
                    customer_address: formData.address, customer_region: formData.region, customer_country: country,
                    quantity, product_name: productName, unit_price: finalPrice, total_price: total,
                }),
            });
            setIsSuccess(true);
        } catch (error) { console.error(error); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen" dir={isRtl ? 'rtl' : 'ltr'} style={{ backgroundColor: '#1a1a1a' }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Roboto:wght@400;700;900&display=swap');
                body { font-family: ${isRtl ? "'Cairo'" : "'Roboto'"}, sans-serif; margin: 0; }
                @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                .pulse-btn { animation: pulse 2s infinite; }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .shake { animation: shake 0.5s; }
            `}</style>

            <div className="max-w-2xl mx-auto" style={{ backgroundColor: '#ffffff' }}>
                {/* 1. HERO SECTION */}
                <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 py-12"
                    style={{
                        backgroundImage: sectionImages.heroBg ? `url(${sectionImages.heroBg})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover', backgroundPosition: 'center',
                    }}>
                    <div className="absolute inset-0 bg-black bg-opacity-40" />

                    {/* Top Banner */}
                    <div className="relative w-full py-3 text-white font-black text-lg tracking-wide flex items-center justify-center gap-2"
                        style={{ backgroundColor: secondaryColor, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                        <Emoji name="fire" width={20} /> {t.limitedOffer.replace('🔥', '').trim()}
                    </div>

                    <div className="relative z-10 mt-8">
                        {/* Headline */}
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight"
                            style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.8), -2px -2px 4px rgba(0,0,0,0.5)' }}>
                            {aiContent.headline || productName}
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl md:text-2xl text-white font-bold mb-8"
                            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                            {aiContent.subheadline || ''}
                        </p>

                        {/* Product Image */}
                        {productImages[0] && (
                            <div className="mb-8">
                                <img src={productImages[0]} alt={productName}
                                    className="w-80 h-80 object-contain mx-auto drop-shadow-2xl" />
                            </div>
                        )}

                        {/* Price */}
                        <div className="mb-8">
                            {discountPrice && (
                                <div className="text-3xl text-white line-through opacity-75 mb-2">
                                    {price.toLocaleString()} {currency}
                                </div>
                            )}
                            <div className="text-6xl font-black mb-2" style={{ color: secondaryColor, textShadow: '3px 3px 6px rgba(0,0,0,0.8)' }}>
                                {finalPrice.toLocaleString()} {currency}
                            </div>
                            {savings > 0 && (
                                <div className="inline-block px-6 py-2 bg-red-600 text-white font-black text-xl rounded-full">
                                    وفر {savings.toLocaleString()} {currency}
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <button onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="pulse-btn px-12 py-6 text-white font-black text-2xl rounded-full shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2 mx-auto justify-center"
                            style={{ backgroundColor: primaryColor }}>
                            {t.orderNow} <Emoji name="fire" width={28} />
                        </button>
                    </div>
                </section>

                {/* 2. PROBLEM SECTION */}
                <section className="py-16 px-6" style={{ backgroundColor: '#f5f5f5' }}>
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-gray-800 mb-8">هل تعاني من هذه المشاكل؟</h2>

                        {sectionImages.problem && (
                            <img src={sectionImages.problem} alt="Problem" className="w-full rounded-2xl mb-8 shadow-xl" />
                        )}

                        <div className="space-y-6 text-right max-w-lg mx-auto">
                            {[t.problem1, t.problem2, t.problem3].map((q, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-lg">
                                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-3xl font-black">✗</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">{q}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. SOLUTION SECTION */}
                <section className="py-16 px-6 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                    {/* Jagged transition */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gray-100"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)' }} />

                    <div className="relative z-10 text-center text-white flex flex-col items-center">
                        <div className="mb-4"><Emoji name="downwards-button" width={48} /></div>
                        <h2 className="text-5xl font-black mb-6">{t.introducing}</h2>
                        <h3 className="text-4xl font-black mb-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                            {productName}
                        </h3>

                        {sectionImages.solution && (
                            <img src={sectionImages.solution} alt="Solution" className="w-full max-w-md mx-auto rounded-2xl shadow-2xl mb-8" />
                        )}

                        <p className="text-xl font-bold leading-relaxed max-w-2xl mx-auto">
                            {aiContent.subheadline || `الحل النهائي والمثالي لجميع مشاكلك. ${productName} يوفر لك نتائج مضمونة وسريعة.`}
                        </p>
                    </div>
                </section>

                {/* 4. FEATURES SECTION */}
                <section className="py-16 px-6" style={{ backgroundColor: '#ffffff' }}>
                    <h2 className="text-4xl font-black text-center mb-12" style={{ color: primaryColor }}>
                        المميزات الحصرية
                    </h2>

                    <div className="space-y-8">
                        {aiContent.benefits?.slice(0, 4).map((benefit, i) => (
                            <div key={i} className={`flex items-center gap-6 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                                {i === 0 && sectionImages.featureMacro && (
                                    <img src={sectionImages.featureMacro} alt="Feature" className="w-32 h-32 rounded-xl shadow-lg object-cover" />
                                )}
                                {i === 1 && sectionImages.featureAbstract && (
                                    <img src={sectionImages.featureAbstract} alt="Feature" className="w-32 h-32 rounded-xl shadow-lg object-cover" />
                                )}
                                {(i > 1 || (!sectionImages.featureMacro && !sectionImages.featureAbstract)) && (
                                    <div className="w-32 h-32 rounded-xl flex items-center justify-center text-5xl" style={{ backgroundColor: `${primaryColor}20` }}>
                                        ✓
                                    </div>
                                )}
                                <div className="flex-1 bg-gradient-to-r from-green-50 to-white p-6 rounded-xl shadow-md">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                                            <span className="text-white font-black">✓</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800">{benefit}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. HOW IT WORKS */}
                <section className="py-16 px-6" style={{ backgroundColor: secondaryColor }}>
                    <h2 className="text-4xl font-black text-center mb-12 text-gray-800">{t.howItWorks}</h2>

                    {sectionImages.steps && (
                        <img src={sectionImages.steps} alt="Steps" className="w-full max-w-lg mx-auto mb-8" />
                    )}

                    <div className="max-w-md mx-auto space-y-6">
                        {[t.step1, t.step2, t.step3].map((step, i) => (
                            <div key={i} className="relative">
                                <div className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-lg">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black"
                                        style={{ backgroundColor: primaryColor }}>
                                        {i + 1}
                                    </div>
                                    <p className="text-lg font-bold text-gray-800">{step}</p>
                                </div>
                                {i < 2 && (
                                    <div className="absolute left-8 top-full h-6 w-1 bg-gray-300" style={{ transform: 'translateX(-50%)' }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-black text-lg rounded-full">
                            <Emoji name="herb" width={24} /> مكونات طبيعية 100%
                        </div>
                    </div>
                </section>

                {/* 6. BEFORE & AFTER */}
                <section className="py-16 px-6" style={{ backgroundColor: '#1a1a1a' }}>
                    <h2 className="text-4xl font-black text-center mb-4 text-white">{t.beforeAfter}</h2>
                    <p className="text-center text-yellow-400 font-bold text-xl mb-12">{t.guaranteed}</p>

                    {sectionImages.beforeAfter && (
                        <div className="relative max-w-2xl mx-auto">
                            <img src={sectionImages.beforeAfter} alt="Before After" className="w-full rounded-2xl shadow-2xl" />
                            <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 font-black rounded-lg">
                                {t.before}
                            </div>
                            <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 font-black rounded-lg">
                                {t.after}
                            </div>
                        </div>
                    )}
                </section>

                {/* 7. TESTIMONIALS */}
                <section className="py-16 px-6" style={{ backgroundColor: '#f9fafb' }}>
                    <h2 className="text-4xl font-black text-center mb-12" style={{ color: primaryColor }}>{t.testimonials}</h2>

                    {sectionImages.avatars && (
                        <img src={sectionImages.avatars} alt="Customers" className="w-64 mx-auto mb-8" />
                    )}

                    <div className="max-w-lg mx-auto space-y-6">
                        {[
                            { name: 'أحمد م.', text: 'منتج رائع! النتائج ظهرت بعد 3 أيام فقط. أنصح به بشدة!' },
                            { name: 'فاطمة ب.', text: 'جودة ممتازة وسعر مناسب. التوصيل كان سريع جداً.' },
                            { name: 'محمد ك.', text: 'أفضل شراء قمت به هذا العام. يستحق كل قرش!' },
                        ].map((review, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border-2" style={{ borderColor: primaryColor }}>
                                <div className="mb-2"><StarRating /></div>
                                <p className="text-gray-800 font-bold mb-3">"{review.text}"</p>
                                <p className="text-sm text-gray-600 font-bold">- {review.name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 8. URGENCY & ORDER FORM */}
                <section id="order-form" className="py-12 px-6" style={{ backgroundColor: primaryColor }}>
                    {/* Urgency Banner */}
                    <div className="bg-red-600 text-white text-center py-4 rounded-xl mb-8 shake flex items-center justify-center gap-3">
                        <Emoji name="warning" width={28} />
                        <p className="text-2xl font-black">{t.urgency.replace(/⚠️/g, '').trim()}</p>
                        <Emoji name="warning" width={28} />
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        {[t.original, t.freeDelivery, t.cod, t.guarantee, t.fastShipping].map((badge, i) => (
                            <div key={i} className="bg-white px-4 py-2 rounded-full shadow-lg">
                                <span className="text-sm font-black text-gray-800">✓ {badge}</span>
                            </div>
                        ))}
                    </div>

                    {/* Order Form */}
                    <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 shadow-2xl">
                        {isSuccess ? (
                            <div className="text-center py-8 flex flex-col items-center">
                                <div className="mb-4"><Emoji name="check-mark-button" width={64} /></div>
                                <h3 className="text-2xl font-black text-gray-800 mb-2">{t.success}</h3>
                                <p className="text-gray-600">{t.successSub}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h3 className="text-2xl font-black text-center mb-6" style={{ color: primaryColor }}>
                                    {t.orderNow}
                                </h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={t.fullName} required className="px-4 py-3 border-2 rounded-xl font-bold" style={{ borderColor: primaryColor }} />
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder={t.phone} required className="px-4 py-3 border-2 rounded-xl font-bold" style={{ borderColor: primaryColor }} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}
                                        placeholder={t.region} className="px-4 py-3 border-2 border-gray-300 rounded-xl" />
                                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder={t.address} className="px-4 py-3 border-2 border-gray-300 rounded-xl" />
                                </div>

                                <div className="flex items-center justify-between bg-gray-100 rounded-xl p-4">
                                    <span className="font-black text-gray-800">{t.quantity}</span>
                                    <div className="flex items-center gap-4">
                                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 bg-gray-300 rounded-full font-black text-xl hover:bg-gray-400">−</button>
                                        <span className="font-black text-2xl">{quantity}</span>
                                        <button type="button" onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 bg-gray-300 rounded-full font-black text-xl hover:bg-gray-400">+</button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-yellow-100 rounded-xl p-4 border-2 border-yellow-400">
                                    <span className="font-black text-gray-800 text-lg">{t.total}</span>
                                    <span className="text-3xl font-black" style={{ color: primaryColor }}>
                                        {total.toLocaleString()} {currency}
                                    </span>
                                </div>

                                <button type="submit" disabled={isSubmitting}
                                    className="w-full py-5 text-white font-black text-xl rounded-xl shadow-2xl pulse-btn disabled:opacity-60"
                                    style={{ backgroundColor: secondaryColor }}>
                                    {isSubmitting ? t.submitting : t.submit}
                                </button>
                            </form>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
