'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/navigation';
import { Emoji } from 'react-apple-emojis';
import { Niche, AIGeneratedContent, COUNTRIES } from '@/lib/types/landing-page';

type PageType = 'static' | 'coded';
type StepId = 'upload' | 'niche' | 'settings' | 'content' | 'generate' | 'preview';

const PAGE_TYPES = [
    {
        id: 'static' as PageType,
        name: <span className="flex items-center gap-2"><Emoji name="framed-picture" width={24} /> صفحة سريعة</span>,
        nameEn: 'Quick Page',
        description: 'AI generates stunning landing page images',
        descriptionAr: 'الذكاء الاصطناعي يولد صور صفحة هبوط مذهلة',
    },
    {
        id: 'coded' as PageType,
        name: <span className="flex items-center gap-2"><Emoji name="high-voltage" width={24} /> صفحة احترافية</span>,
        nameEn: 'Pro Page',
        description: 'Fast-loading HTML with AI photoshoots',
        descriptionAr: 'موقع HTML سريع مع تصوير منتجات احترافي',
    },
];

export default function NewLandingPage() {
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Page Type
    const [pageType, setPageType] = useState<PageType>('static');

    // Steps
    const [currentStep, setCurrentStep] = useState<StepId>('upload');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generationStep, setGenerationStep] = useState('');

    // Product Images
    const [productImages, setProductImages] = useState<File[]>([]);
    const [productImagesPreview, setProductImagesPreview] = useState<string[]>([]);

    // Niches
    const [niches, setNiches] = useState<Niche[]>([]);
    const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);

    // Settings
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [discountPrice, setDiscountPrice] = useState('');
    const [country, setCountry] = useState<'DZ' | 'MA' | 'TN'>('DZ');
    const [language, setLanguage] = useState<'ar' | 'fr' | 'en'>('ar');
    const [primaryColor, setPrimaryColor] = useState('#22C55E');
    const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');

    // AI Content
    const [aiContent, setAiContent] = useState<AIGeneratedContent | null>(null);

    // Generated Images (for static type)
    const [part1ImageUrl, setPart1ImageUrl] = useState<string | null>(null);
    const [part2ImageUrl, setPart2ImageUrl] = useState<string | null>(null);
    const [part3ImageUrl, setPart3ImageUrl] = useState<string | null>(null);
    const [combinedImageBlob, setCombinedImageBlob] = useState<Blob | null>(null);

    // Photoshoots (for coded type)
    const [photoshoots, setPhotoshoots] = useState<string[]>([]);

    // Created page ID
    const [createdPageId, setCreatedPageId] = useState<string | null>(null);

    useEffect(() => { loadNiches(); }, []);

    const loadNiches = async () => {
        const { data } = await supabase.from('niches').select('*').eq('is_active', true).order('sort_order');
        if (data) {
            setNiches(data);
            if (data.length > 0) {
                setSelectedNiche(data[0]);
                const palette = data[0].color_palette as string[];
                if (palette?.length >= 2) {
                    setPrimaryColor(palette[0]);
                    setSecondaryColor(palette[1]);
                }
            }
        }
    };

    const handleNicheChange = (niche: Niche) => {
        setSelectedNiche(niche);
        const palette = niche.color_palette as string[];
        if (palette?.length >= 2) { setPrimaryColor(palette[0]); setSecondaryColor(palette[1]); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).slice(0, 5);
        if (!files.length) return;
        setProductImages(files);
        files.forEach((file, i) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductImagesPreview(prev => { const u = [...prev]; u[i] = reader.result as string; return u.slice(0, files.length); });
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setProductImages(prev => prev.filter((_, i) => i !== index));
        setProductImagesPreview(prev => prev.filter((_, i) => i !== index));
    };

    const generateContent = async () => {
        if (!selectedNiche) return;
        setError(''); setIsLoading(true);
        try {
            const res = await fetch('/api/ai/generate-page-content', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName, price, discountPrice, currency: COUNTRIES[country].symbol, language, niche: selectedNiche }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAiContent({ ...data.content, primaryColor, secondaryColor });
            setCurrentStep('content');
        } catch (err: any) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    // Generate static images (current flow)
    const generateStaticImages = async () => {
        if (!aiContent || !selectedNiche) return;
        setError(''); setIsLoading(true); setCurrentStep('generate');
        setPart1ImageUrl(null); setPart2ImageUrl(null); setPart3ImageUrl(null);

        const basePayload = {
            productName, headline: aiContent.headline, subheadline: aiContent.subheadline,
            benefits: aiContent.benefits, features: aiContent.features, price, discountPrice,
            currency: COUNTRIES[country].symbol, ctaText: aiContent.cta_text, trustBadge: aiContent.trust_badge,
            primaryColor, secondaryColor, language, country, productImageBase64: productImagesPreview[0] || null,
        };

        try {
            setGenerationStep('Generating Section 1/3 (Hero)...');
            const r1 = await fetch('/api/ai/generate-infographic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...basePayload, part: 'part1' }) });
            const d1 = await r1.json(); if (!r1.ok) throw new Error(d1.error); setPart1ImageUrl(d1.image);

            setGenerationStep('Generating Section 2/3 (Benefits)...');
            const r2 = await fetch('/api/ai/generate-infographic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...basePayload, part: 'part2' }) });
            const d2 = await r2.json(); if (!r2.ok) throw new Error(d2.error); setPart2ImageUrl(d2.image);

            setGenerationStep('Generating Section 3/3 (CTA)...');
            const r3 = await fetch('/api/ai/generate-infographic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...basePayload, part: 'part3' }) });
            const d3 = await r3.json(); if (!r3.ok) throw new Error(d3.error); setPart3ImageUrl(d3.image);

            await combineImages(d1.image, d2.image, d3.image);
            setCurrentStep('preview');
        } catch (err: any) { setError(err.message); setCurrentStep('content'); }
        finally { setIsLoading(false); setGenerationStep(''); }
    };

    // Generate coded page with section-specific images
    const generateCodedPage = async () => {
        if (!aiContent || !selectedNiche) return;
        setError(''); setIsLoading(true); setCurrentStep('generate');

        const sectionTypes = ['hero-bg', 'problem', 'solution', 'feature-macro', 'feature-abstract', 'steps', 'before-after', 'avatars'];
        const generatedSectionImages: Record<string, string> = {};

        try {
            for (let i = 0; i < sectionTypes.length; i++) {
                const sectionType = sectionTypes[i];
                setGenerationStep(`Generating ${sectionType} (${i + 1}/${sectionTypes.length})...`);

                const res = await fetch('/api/ai/generate-section-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionType,
                        productName,
                        productImageBase64: productImagesPreview[0] || null,
                        niche: selectedNiche.name,
                        primaryColor,
                        secondaryColor,
                        language,
                    }),
                });

                const data = await res.json();
                if (res.ok && data.image) {
                    generatedSectionImages[sectionType] = data.image;
                }
            }

            setPhotoshoots(Object.values(generatedSectionImages));
            setCurrentStep('preview');
        } catch (err: any) { setError(err.message); setCurrentStep('content'); }
        finally { setIsLoading(false); setGenerationStep(''); }
    };

    const combineImages = async (i1: string, i2: string, i3: string) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const imgs = await Promise.all([i1, i2, i3].map(src => new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = src; })));
        canvas.width = Math.max(...imgs.map(i => i.width));
        canvas.height = imgs.reduce((h, i) => h + i.height, 0);
        let y = 0;
        imgs.forEach(i => { ctx.drawImage(i, 0, y); y += i.height; });
        canvas.toBlob(b => b && setCombinedImageBlob(b), 'image/png');
    };

    const publishLandingPage = async () => {
        if (!aiContent || !selectedNiche) return;
        if (pageType === 'static' && !combinedImageBlob) return;
        setError(''); setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload product images
            const uploadedProductImages: string[] = [];
            for (const file of productImages) {
                const fn = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                const { error: upErr } = await supabase.storage.from('product-images').upload(fn, file);
                if (!upErr) {
                    const { data } = supabase.storage.from('product-images').getPublicUrl(fn);
                    uploadedProductImages.push(data.publicUrl);
                }
            }

            let finalImageUrl = null;
            let uploadedPhotoshoots: string[] = [];

            if (pageType === 'static' && combinedImageBlob) {
                const fn = `${user.id}/${Date.now()}-landing.png`;
                const { error: upErr } = await supabase.storage.from('product-images').upload(fn, combinedImageBlob, { contentType: 'image/png' });
                if (!upErr) { const { data } = supabase.storage.from('product-images').getPublicUrl(fn); finalImageUrl = data.publicUrl; }
            }

            if (pageType === 'coded') {
                const sectionTypes = ['hero-bg', 'problem', 'solution', 'feature-macro', 'feature-abstract', 'steps', 'before-after', 'avatars'];
                const uploadedSectionImages: Record<string, string> = {};

                for (let i = 0; i < photoshoots.length && i < sectionTypes.length; i++) {
                    const blob = await fetch(photoshoots[i]).then(r => r.blob());
                    const fn = `${user.id}/${Date.now()}-${sectionTypes[i]}.png`;
                    const { error: upErr } = await supabase.storage.from('product-images').upload(fn, blob, { contentType: 'image/png' });
                    if (!upErr) {
                        const { data } = supabase.storage.from('product-images').getPublicUrl(fn);
                        uploadedSectionImages[sectionTypes[i]] = data.publicUrl;
                    }
                }

                // Store section images in the new column
                const { data: page, error: insertErr } = await supabase.from('landing_pages').insert({
                    user_id: user.id,
                    title: productName,
                    country, language,
                    status: 'published',
                    product_name: productName,
                    product_description: aiContent.subheadline,
                    product_price: parseFloat(price),
                    product_discount_price: discountPrice ? parseFloat(discountPrice) : null,
                    product_images: uploadedProductImages,
                    final_image_url: null,
                    cta_button_text: aiContent.cta_text,
                    niche_id: selectedNiche.id,
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    ai_content: aiContent,
                    page_type: pageType,
                    section_images: uploadedSectionImages,
                    published_at: new Date().toISOString(),
                }).select('id').single();

                if (insertErr) throw insertErr;
                setCreatedPageId(page?.id || null);
                router.push('/dashboard/pages');
                return;
            }

            const { data: page, error: insertErr } = await supabase.from('landing_pages').insert({
                user_id: user.id,
                title: productName,
                country, language,
                status: 'published',
                product_name: productName,
                product_description: aiContent.subheadline,
                product_price: parseFloat(price),
                product_discount_price: discountPrice ? parseFloat(discountPrice) : null,
                product_images: uploadedProductImages,
                final_image_url: finalImageUrl,
                cta_button_text: aiContent.cta_text,
                niche_id: selectedNiche.id,
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                ai_content: aiContent,
                page_type: pageType,
                photoshoots: uploadedPhotoshoots,
                published_at: new Date().toISOString(),
            }).select('id').single();

            if (insertErr) throw insertErr;

            setCreatedPageId(page?.id || null);
            router.push('/dashboard/pages');
        } catch (err: any) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    const goToStep = (step: StepId) => { setError(''); setCurrentStep(step); };
    const currentStepIndex = ['upload', 'niche', 'settings', 'content', 'generate', 'preview'].indexOf(currentStep);

    return (
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-6">
                    <Link href="/dashboard/pages" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-flex items-center gap-1">
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Create Landing Page</h1>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

                {/* Progress */}
                <div className="mb-6 flex items-center gap-2 overflow-x-auto">
                    {['Upload', 'Niche', 'Details', 'Content', 'Generate', 'Preview'].map((label, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStepIndex === i ? 'bg-green-600 text-white' : currentStepIndex > i ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                                {currentStepIndex > i ? '✓' : i + 1}
                            </div>
                            <span className="text-xs hidden sm:block">{label}</span>
                            {i < 5 && <div className={`w-6 h-0.5 ${currentStepIndex > i ? 'bg-green-500' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Upload + Type Selection */}
                    {currentStep === 'upload' && (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            {/* Page Type Selector */}
                            <div className="bg-white rounded-xl border p-6 space-y-4">
                                <h2 className="text-lg font-bold">Choose Page Type</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {PAGE_TYPES.map(type => (
                                        <button key={type.id} onClick={() => setPageType(type.id)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${pageType === type.id ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}>
                                            <div className="text-2xl mb-2">{type.name}</div>
                                            <p className="text-xs text-slate-500">{type.descriptionAr}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="bg-white rounded-xl border p-6">
                                <h2 className="text-lg font-bold mb-4">Product Images</h2>
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-green-400">
                                    <p className="text-slate-600 font-medium">Click to upload</p>
                                    <p className="text-sm text-slate-400">PNG, JPG up to 10MB</p>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                {productImagesPreview.length > 0 && (
                                    <div className="grid grid-cols-5 gap-2 mt-4">
                                        {productImagesPreview.map((p, i) => (
                                            <div key={i} className="relative group">
                                                <img src={p} className="w-full aspect-square object-cover rounded-lg" />
                                                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => goToStep('niche')} disabled={productImages.length === 0} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold rounded-xl">
                                Next →
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: Niche */}
                    {currentStep === 'niche' && (
                        <motion.div key="niche" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-white rounded-xl border p-6">
                                <h2 className="text-lg font-bold mb-4">Choose Niche</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {niches.map(n => (
                                        <button key={n.id} onClick={() => handleNicheChange(n)}
                                            className={`p-4 rounded-xl border-2 text-left ${selectedNiche?.id === n.id ? 'border-green-600 bg-green-50' : 'border-slate-200'}`}>
                                            <div className="text-2xl mb-1">{n.icon}</div>
                                            <div className="font-bold text-sm">{language === 'ar' ? n.name_ar : n.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => goToStep('upload')} className="px-6 py-3 bg-slate-100 rounded-xl">← Back</button>
                                <button onClick={() => goToStep('settings')} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl">Next →</button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Settings */}
                    {currentStep === 'settings' && (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-white rounded-xl border p-6 space-y-4">
                                <h2 className="text-lg font-bold">Product Details</h2>
                                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Product Name" className="w-full px-4 py-3 border rounded-xl" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" className="px-4 py-3 border rounded-xl" />
                                    <input type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} placeholder="Sale Price" className="px-4 py-3 border rounded-xl" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={country} onChange={e => setCountry(e.target.value as any)} className="px-4 py-3 border rounded-xl">
                                        <option value="DZ">Algeria</option><option value="MA">Morocco</option><option value="TN">Tunisia</option>
                                    </select>
                                    <select value={language} onChange={e => setLanguage(e.target.value as any)} className="px-4 py-3 border rounded-xl">
                                        <option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-600 mb-1 block">Primary Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-lg" />
                                            <div className="flex gap-1">{(selectedNiche?.color_palette as string[])?.slice(0, 4).map((c, i) => (
                                                <button key={i} onClick={() => setPrimaryColor(c)} className="w-8 h-8 rounded-full border" style={{ backgroundColor: c }} />
                                            ))}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-600 mb-1 block">Secondary Color</label>
                                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-12 rounded-lg" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => goToStep('niche')} className="px-6 py-3 bg-slate-100 rounded-xl">← Back</button>
                                <button onClick={generateContent} disabled={!productName || !price || isLoading} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                                    {isLoading ? 'Generating...' : 'Generate Content →'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Content */}
                    {currentStep === 'content' && aiContent && (
                        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-white rounded-xl border p-6 space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                <h2 className="text-lg font-bold">Edit Content</h2>
                                <input type="text" value={aiContent.headline} onChange={e => setAiContent({ ...aiContent, headline: e.target.value })} className="w-full px-4 py-3 border rounded-xl text-lg font-bold" placeholder="Headline" />
                                <input type="text" value={aiContent.subheadline} onChange={e => setAiContent({ ...aiContent, subheadline: e.target.value })} className="w-full px-4 py-3 border rounded-xl" placeholder="Subheadline" />
                                <textarea value={aiContent.benefits.join('\n')} onChange={e => setAiContent({ ...aiContent, benefits: e.target.value.split('\n').filter(Boolean) })} rows={4} className="w-full px-4 py-3 border rounded-xl" placeholder="Benefits (one per line)" />
                                <textarea value={aiContent.features.join('\n')} onChange={e => setAiContent({ ...aiContent, features: e.target.value.split('\n').filter(Boolean) })} rows={3} className="w-full px-4 py-3 border rounded-xl" placeholder="Features (one per line)" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" value={aiContent.trust_badge} onChange={e => setAiContent({ ...aiContent, trust_badge: e.target.value })} className="px-4 py-3 border rounded-xl" placeholder="Trust Badge" />
                                    <input type="text" value={aiContent.cta_text} onChange={e => setAiContent({ ...aiContent, cta_text: e.target.value })} className="px-4 py-3 border rounded-xl" placeholder="CTA Text" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => goToStep('settings')} className="px-6 py-3 bg-slate-100 rounded-xl">← Back</button>
                                <button onClick={pageType === 'static' ? generateStaticImages : generateCodedPage} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl">
                                    Generate {pageType === 'static' ? 'Images' : 'Page'} →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5: Generating */}
                    {currentStep === 'generate' && (
                        <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl border p-12 text-center">
                            <div className="animate-spin h-16 w-16 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">{generationStep || 'Generating...'}</h2>
                            <p className="text-slate-600">Creating your {pageType === 'static' ? 'landing page images' : 'professional page'}...</p>
                        </motion.div>
                    )}

                    {/* STEP 6: Preview */}
                    {currentStep === 'preview' && (
                        <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-white rounded-xl border p-6">
                                <h2 className="text-lg font-bold mb-4">Preview</h2>
                                <div className="bg-slate-100 rounded-xl p-2 max-h-[500px] overflow-y-auto">
                                    {pageType === 'static' ? (
                                        <>
                                            {part1ImageUrl && <img src={part1ImageUrl} className="w-full" />}
                                            {part2ImageUrl && <img src={part2ImageUrl} className="w-full" style={{ marginTop: -1 }} />}
                                            {part3ImageUrl && <img src={part3ImageUrl} className="w-full" style={{ marginTop: -1 }} />}
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 p-2">
                                            {photoshoots.map((p, i) => <img key={i} src={p} className="w-full rounded-lg" />)}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 text-center mt-2">
                                    {pageType === 'static' ? 'Scrollable image preview' : 'Generated photoshoots for your page'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => goToStep('content')} className="px-6 py-3 bg-slate-100 rounded-xl">← Edit</button>
                                <button onClick={publishLandingPage} disabled={isLoading} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                                    {isLoading ? 'Publishing...' : '✓ Publish'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
