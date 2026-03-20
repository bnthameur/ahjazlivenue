'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { uploadVenueImages, uploadVenueVideo, deleteVenueVideo, fetchVenueMedia, VenueMediaRecord, VideoUploadProgress } from '@/lib/supabase/storage';
import { formatBytes } from '@/lib/media-optimizer';
import {
    Building2, PartyPopper, Users, TreeDeciduous, Home, Hotel, Utensils, Moon,
    Upload, X, Check, ChevronRight, MapPin, Phone, Mail, Facebook, Instagram,
    Camera, Sparkles, Car, Wind, Speaker, Lightbulb, ChefHat, Wifi, Accessibility,
    Music, Flower2, Waves, Sun, ImageIcon, Loader2, CheckCircle2, Star,
    Save, Eye, AlertCircle, ArrowLeft, Trash2, Video, Play
} from 'lucide-react';

// --- Types & Constants ---

type Tab = 'overview' | 'details' | 'photos' | 'contact';

const categories = [
    { id: 'wedding-hall', icon: Building2, label: 'Wedding Hall', color: 'rose' },
    { id: 'event-salon', icon: PartyPopper, label: 'Event Salon', color: 'purple' },
    { id: 'conference-room', icon: Users, label: 'Conference Room', color: 'blue' },
    { id: 'garden-outdoor', icon: TreeDeciduous, label: 'Garden/Outdoor', color: 'green' },
    { id: 'villa', icon: Home, label: 'Villa', color: 'orange' },
    { id: 'hotel-ballroom', icon: Hotel, label: 'Hotel Ballroom', color: 'indigo' },
    { id: 'restaurant', icon: Utensils, label: 'Restaurant', color: 'amber' },
    { id: 'rooftop', icon: Moon, label: 'Rooftop', color: 'sky' },
] as const;

const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Algiers',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naama', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane', 'El M\'Ghair', 'El Meniaa', 'Ouled Djellal', 'Bordj Baji Mokhtar',
    'Béni Abbès', 'Timimoun', 'Touggourt', 'Djanet', 'In Salah', 'In Guezzam'
];

const amenitiesList = [
    { name: 'Parking', icon: Car },
    { name: 'Air Conditioning', icon: Wind },
    { name: 'Sound System', icon: Speaker },
    { name: 'Lighting', icon: Lightbulb },
    { name: 'Catering', icon: ChefHat },
    { name: 'Wi-Fi', icon: Wifi },
    { name: 'Wheelchair Access', icon: Accessibility },
    { name: 'Dance Floor', icon: Music },
    { name: 'Garden', icon: Flower2 },
    { name: 'Pool', icon: Waves },
    { name: 'Terrace', icon: Sun },
    { name: 'Stage', icon: Star },
];

// --- Components ---

const TabButton = ({ 
    active, 
    onClick, 
    icon: Icon, 
    label,
    badge
}: { 
    active: boolean; 
    onClick: () => void; 
    icon: any; 
    label: string;
    badge?: number;
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
            active 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                : 'text-slate-600 hover:bg-slate-100'
        }`}
    >
        <Icon className="w-4 h-4" />
        {label}
        {badge !== undefined && badge > 0 && (
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                active ? 'bg-white/20' : 'bg-primary-100 text-primary-700'
            }`}>
                {badge}
            </span>
        )}
    </button>
);

const SectionCard = ({ 
    title, 
    description, 
    children,
    action
}: { 
    title: string; 
    description?: string; 
    children: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
            {action}
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const FormField = ({
    label,
    required,
    children,
    help
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    help?: string;
}) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
        {help && <p className="text-xs text-slate-500">{help}</p>}
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${props.className || ''}`}
    />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none ${props.className || ''}`}
    />
);

const CategoryCard = ({ 
    category, 
    selected, 
    onClick 
}: { 
    category: typeof categories[number]; 
    selected: boolean; 
    onClick: () => void;
}) => {
    const Icon = category.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                selected 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
            }`}
        >
            <Icon className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-xs font-medium text-center">{category.label}</span>
        </button>
    );
};

const AmenityTag = ({ 
    amenity, 
    selected, 
    onClick 
}: { 
    amenity: typeof amenitiesList[number]; 
    selected: boolean; 
    onClick: () => void;
}) => {
    const Icon = amenity.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                selected 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {amenity.name}
        </button>
    );
};

// --- Main Component ---

export default function EditVenuePage() {
    const locale = useLocale();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const supabase = createClient();
    
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoUploadProgress, setVideoUploadProgress] = useState<VideoUploadProgress | null>(null);
    const [videos, setVideos] = useState<VenueMediaRecord[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category: '',
        location: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity_min: '',
        capacity_max: '',
        price_range_min: '',
        price_range_max: '',
        phone: '',
        whatsapp: '',
        email: '',
        facebook_url: '',
        instagram_url: '',
        amenities: [] as string[],
        images: [] as string[],
        equipment: [] as { name: string; value: string }[],
        prestations: [] as { name: string; price: string }[],
        status: 'pending',
    });
    const [planLimits, setPlanLimits] = useState<{ maxImages: number; maxVideos: number }>({ maxImages: 5, maxVideos: 0 });
    const [hasActiveSub, setHasActiveSub] = useState(true); // assume true until checked

    // Load venue data
    useEffect(() => {
        const fetchVenue = async () => {
            try {
                const [{ data, error }, venueMedia] = await Promise.all([
                    supabase.from('venues').select('*').eq('id', id).single(),
                    fetchVenueMedia(id, 'video').catch(() => [] as VenueMediaRecord[]),
                ]);

                if (error) throw error;
                if (data) {
                    setFormData({
                        name: data.name || '',
                        slug: data.slug || '',
                        description: data.description || '',
                        category: data.category || '',
                        location: data.location || '',
                        address: data.address || '',
                        latitude: data.latitude?.toString() || '',
                        longitude: data.longitude?.toString() || '',
                        capacity_min: data.capacity_min?.toString() || '',
                        capacity_max: data.capacity_max?.toString() || '',
                        price_range_min: data.price_min?.toString() || '',
                        price_range_max: data.price_max?.toString() || '',
                        phone: data.phone || '',
                        whatsapp: data.whatsapp || '',
                        email: data.contact_email || '',
                        facebook_url: data.facebook_url || '',
                        instagram_url: data.instagram_url || '',
                        amenities: data.amenities || [],
                        images: data.images || [],
                        equipment: data.equipment || [],
                        prestations: (data.prestations || []).map((p: any) => ({ name: p.name || '', price: p.price?.toString() || '' })),
                        status: data.status || 'pending',
                    });
                }
                setVideos(venueMedia);

                // Fetch plan limits & subscription status
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: sub } = await supabase
                        .from('user_subscriptions')
                        .select('*, subscription_plans(*)')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    const status = (sub?.status || '').toLowerCase();
                    const isActive = ['active', 'trial'].includes(status);
                    const expiresAt = sub?.expires_at ? new Date(sub.expires_at) : null;
                    const expired = expiresAt ? expiresAt.getTime() < Date.now() : false;

                    if (!sub || !isActive || expired) {
                        setHasActiveSub(false);
                        setPlanLimits({ maxImages: 0, maxVideos: 0 });
                    } else if (sub?.subscription_plans) {
                        setHasActiveSub(true);
                        const plan = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;
                        setPlanLimits({
                            maxImages: plan?.max_images_per_venue ?? 5,
                            maxVideos: plan?.max_videos_per_venue ?? 0,
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching venue:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchVenue();
    }, [id]);

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('video/')) return;

        if (videos.length >= planLimits.maxVideos) {
            alert(`Your plan allows up to ${planLimits.maxVideos} videos per venue. Upgrade your plan to add more.`);
            e.target.value = '';
            return;
        }

        setVideoUploading(true);
        setVideoUploadProgress(null);
        try {
            const result = await uploadVenueVideo(file, id, (progress) => {
                setVideoUploadProgress(progress);
            });
            setVideos(prev => [...prev, result.mediaRecord]);
        } catch (error: any) {
            alert(`Error uploading video: ${error.message}`);
        } finally {
            setVideoUploading(false);
            setVideoUploadProgress(null);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDeleteVideo = async (mediaRecord: VenueMediaRecord) => {
        if (!confirm('Delete this video?')) return;
        try {
            // Extract storage path from URL (everything after the bucket prefix)
            const urlParts = mediaRecord.url.split('/venue-images/');
            const storagePath = urlParts[1] || '';
            await deleteVenueVideo(mediaRecord.id, storagePath);
            setVideos(prev => prev.filter(v => v.id !== mediaRecord.id));
        } catch (error: any) {
            alert(`Error deleting video: ${error.message}`);
        }
    };

    const updateField = useCallback((field: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    }, []);

    const toggleAmenity = useCallback((amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
        setHasChanges(true);
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (!files.length) return;

        const remaining = planLimits.maxImages - formData.images.length;
        if (remaining <= 0) {
            alert(`Your plan allows up to ${planLimits.maxImages} images per venue. Upgrade your plan to add more.`);
            e.target.value = '';
            return;
        }
        const filesToUpload = files.slice(0, remaining);
        if (filesToUpload.length < files.length) {
            alert(`Only uploading ${filesToUpload.length} of ${files.length} images (plan limit: ${planLimits.maxImages}).`);
        }

        setUploading(true);
        try {
            const results = await uploadVenueImages(filesToUpload, id, () => {});
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...results.map(r => r.publicUrl)]
            }));
            setHasChanges(true);
        } catch (error: any) {
            alert(`Error uploading: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (idx: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('venues')
                .update({
                    name: formData.name,
                    slug: formData.slug || undefined,
                    description: formData.description,
                    category: formData.category,
                    location: formData.location,
                    address: formData.address,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    capacity_min: parseInt(formData.capacity_min) || 0,
                    capacity_max: parseInt(formData.capacity_max) || 0,
                    price_min: parseFloat(formData.price_range_min) || 0,
                    price_max: parseFloat(formData.price_range_max) || 0,
                    phone: formData.phone,
                    whatsapp: formData.whatsapp,
                    contact_email: formData.email,
                    facebook_url: formData.facebook_url,
                    instagram_url: formData.instagram_url,
                    amenities: formData.amenities,
                    images: formData.images,
                    equipment: formData.equipment,
                    prestations: formData.prestations.map(p => ({ name: p.name, price: parseFloat(p.price) || 0 })),
                })
                .eq('id', id);

            if (error) throw error;
            setHasChanges(false);
            // Show success toast or notification here
        } catch (error: any) {
            alert(`Error saving: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    // Block editing if no active subscription — read-only view with warning
    if (!hasActiveSub) {
        return (
            <div className="p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Subscription Required</h2>
                    <p className="text-sm text-slate-600 mb-6">
                        Your subscription has expired or is not active. You cannot edit venues or upload media until you renew your plan.
                    </p>
                    <button
                        onClick={() => router.push(`/${locale}/dashboard/settings`)}
                        className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                    >
                        Go to Settings
                    </button>
                </div>
            </div>
        );
    }

    // --- Tab Content ---

    const renderOverviewTab = () => (
        <div className="space-y-6">
            <SectionCard 
                title="Basic Information" 
                description="Essential details about your venue"
            >
                <div className="space-y-4">
                    <FormField label="Venue Name" required>
                        <Input
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="e.g., Le Grand Palace"
                        />
                    </FormField>

                    <FormField label="URL Slug" help="Custom URL for your venue page. Lowercase, hyphens only.">
                        <div className="flex items-center gap-0">
                            <span className="text-xs text-slate-400 bg-slate-100 border border-slate-200 border-e-0 rounded-s-xl px-3 py-2.5 whitespace-nowrap">
                                ahjazliqaati.com/salles/
                            </span>
                            <Input
                                value={formData.slug}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
                                    updateField('slug', val);
                                }}
                                placeholder="my-venue-name"
                                className="rounded-s-none"
                            />
                        </div>
                    </FormField>

                    <FormField label="Category" required>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map((cat) => (
                                <CategoryCard
                                    key={cat.id}
                                    category={cat}
                                    selected={formData.category === cat.id}
                                    onClick={() => updateField('category', cat.id)}
                                />
                            ))}
                        </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Wilaya" required>
                            <select
                                value={formData.location}
                                onChange={(e) => updateField('location', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Select Wilaya</option>
                                {wilayas.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Address">
                            <Input
                                value={formData.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder="Street address"
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Latitude" help="e.g. 36.7538">
                            <Input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={(e) => updateField('latitude', e.target.value)}
                                placeholder="36.7538"
                            />
                        </FormField>
                        <FormField label="Longitude" help="e.g. 3.0588">
                            <Input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={(e) => updateField('longitude', e.target.value)}
                                placeholder="3.0588"
                            />
                        </FormField>
                    </div>

                    <FormField label="Description" required help="Describe what makes your venue special">
                        <TextArea
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Tell potential customers about your venue..."
                            rows={4}
                        />
                    </FormField>
                </div>
            </SectionCard>
        </div>
    );

    const renderDetailsTab = () => (
        <div className="space-y-6">
            <SectionCard title="Capacity & Pricing" description="Set your venue capacity and price range">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">Guest Capacity</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Minimum">
                                <Input
                                    type="number"
                                    value={formData.capacity_min}
                                    onChange={(e) => updateField('capacity_min', e.target.value)}
                                    placeholder="50"
                                />
                            </FormField>
                            <FormField label="Maximum">
                                <Input
                                    type="number"
                                    value={formData.capacity_max}
                                    onChange={(e) => updateField('capacity_max', e.target.value)}
                                    placeholder="300"
                                />
                            </FormField>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-medium text-slate-900">Price Range (DZD)</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="From">
                                <Input
                                    type="number"
                                    value={formData.price_range_min}
                                    onChange={(e) => updateField('price_range_min', e.target.value)}
                                    placeholder="50000"
                                />
                            </FormField>
                            <FormField label="To">
                                <Input
                                    type="number"
                                    value={formData.price_range_max}
                                    onChange={(e) => updateField('price_range_max', e.target.value)}
                                    placeholder="150000"
                                />
                            </FormField>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Amenities" description="Select all features your venue offers">
                <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((amenity) => (
                        <AmenityTag
                            key={amenity.name}
                            amenity={amenity}
                            selected={formData.amenities.includes(amenity.name)}
                            onClick={() => toggleAmenity(amenity.name)}
                        />
                    ))}
                </div>
            </SectionCard>

            {/* Equipment */}
            <SectionCard title="Equipment" description="List equipment and their details (e.g. Parking: 80 places, Boissons: Inclus)">
                <div className="space-y-3">
                    {formData.equipment.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <Input
                                value={item.name}
                                onChange={(e) => {
                                    const updated = [...formData.equipment];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    setFormData(prev => ({ ...prev, equipment: updated }));
                                    setHasChanges(true);
                                }}
                                placeholder="e.g. Parking"
                                className="flex-1"
                            />
                            <Input
                                value={item.value}
                                onChange={(e) => {
                                    const updated = [...formData.equipment];
                                    updated[idx] = { ...updated[idx], value: e.target.value };
                                    setFormData(prev => ({ ...prev, equipment: updated }));
                                    setHasChanges(true);
                                }}
                                placeholder="e.g. 80 places"
                                className="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, equipment: prev.equipment.filter((_, i) => i !== idx) }));
                                    setHasChanges(true);
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setFormData(prev => ({ ...prev, equipment: [...prev.equipment, { name: '', value: '' }] }));
                            setHasChanges(true);
                        }}
                        className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 rounded-xl text-sm font-medium transition-colors"
                    >
                        + Add equipment item
                    </button>
                </div>
            </SectionCard>

            {/* Prestations */}
            <SectionCard title="Services & Pricing (Prestations)" description="List your services with prices in DZD">
                <div className="space-y-3">
                    {formData.prestations.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <Input
                                value={item.name}
                                onChange={(e) => {
                                    const updated = [...formData.prestations];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    setFormData(prev => ({ ...prev, prestations: updated }));
                                    setHasChanges(true);
                                }}
                                placeholder="e.g. Location de salle (après-midi)"
                                className="flex-[2]"
                            />
                            <div className="flex items-center gap-1 flex-1">
                                <Input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => {
                                        const updated = [...formData.prestations];
                                        updated[idx] = { ...updated[idx], price: e.target.value };
                                        setFormData(prev => ({ ...prev, prestations: updated }));
                                        setHasChanges(true);
                                    }}
                                    placeholder="200000"
                                />
                                <span className="text-xs text-slate-400 whitespace-nowrap">DZD</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, prestations: prev.prestations.filter((_, i) => i !== idx) }));
                                    setHasChanges(true);
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            setFormData(prev => ({ ...prev, prestations: [...prev.prestations, { name: '', price: '' }] }));
                            setHasChanges(true);
                        }}
                        className="w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary-300 hover:text-primary-600 rounded-xl text-sm font-medium transition-colors"
                    >
                        + Add service
                    </button>
                </div>
            </SectionCard>
        </div>
    );

    const renderPhotosTab = () => (
        <div className="space-y-6">
            {/* Images Section */}
            <SectionCard
                title={`Photo Gallery (${formData.images.length}/${planLimits.maxImages})`}
                description="Upload high-quality photos of your venue"
                action={
                    <label className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-primary-700 transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Add Photos
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </label>
                }
            >
                {uploading && (
                    <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-primary-600 animate-spin shrink-0" />
                        <p className="text-sm text-primary-700 font-medium">Uploading photos...</p>
                    </div>
                )}
                {formData.images.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No photos yet</p>
                        <p className="text-sm text-slate-400">Upload photos to showcase your venue</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map((img, idx) => (
                            <motion.div
                                key={idx}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200"
                            >
                                <img src={img} alt={`Venue ${idx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {idx === 0 && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-md">
                                        Cover
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* Videos Section */}
            <SectionCard
                title={`Video Gallery (${videos.length}/${planLimits.maxVideos})`}
                description="Upload videos to showcase your venue (MP4, WebM, MOV — max 50MB each)"
                action={
                    <label className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                        videoUploading
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-violet-600 text-white cursor-pointer hover:bg-violet-700'
                    }`}>
                        <Video className="w-4 h-4" />
                        Add Video
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            disabled={videoUploading}
                        />
                    </label>
                }
            >
                {/* Upload Progress */}
                {videoUploading && (
                    <div className="mb-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <Loader2 className="w-4 h-4 text-violet-600 animate-spin shrink-0" />
                            <p className="text-sm text-violet-700 font-medium">
                                {videoUploadProgress?.stage === 'generating-thumbnail' && 'Generating thumbnail...'}
                                {videoUploadProgress?.stage === 'compressing-video' && 'Compressing video...'}
                                {videoUploadProgress?.stage === 'uploading-video' && 'Uploading video...'}
                                {videoUploadProgress?.stage === 'uploading-thumbnail' && 'Uploading thumbnail...'}
                                {videoUploadProgress?.stage === 'saving-record' && 'Saving...'}
                                {!videoUploadProgress && 'Processing...'}
                            </p>
                        </div>
                        <div className="h-1.5 bg-violet-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-violet-600 rounded-full transition-all duration-300"
                                style={{ width: `${videoUploadProgress?.progress ?? 0}%` }}
                            />
                        </div>
                    </div>
                )}

                {videos.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No videos yet</p>
                        <p className="text-sm text-slate-400">Upload a video tour of your venue</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {videos.map((video) => (
                            <motion.div
                                key={video.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-200"
                            >
                                {/* Thumbnail */}
                                {video.thumbnail_url ? (
                                    <img
                                        src={video.thumbnail_url}
                                        alt="Video thumbnail"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                        <Video className="w-10 h-10 text-slate-500" />
                                    </div>
                                )}

                                {/* Play icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Play className="w-5 h-5 text-slate-800 ml-0.5" fill="currentColor" />
                                    </a>
                                </div>

                                {/* Delete button */}
                                <button
                                    type="button"
                                    onClick={() => handleDeleteVideo(video)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );

    const renderContactTab = () => (
        <div className="space-y-6">
            <SectionCard title="Contact Information" description="How customers can reach you">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Phone Number" required>
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                placeholder="0555 123 456"
                            />
                        </FormField>
                        <FormField label="WhatsApp">
                            <Input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={(e) => updateField('whatsapp', e.target.value)}
                                placeholder="Same as phone"
                            />
                        </FormField>
                    </div>

                    <FormField label="Email Address">
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="contact@venue.dz"
                        />
                    </FormField>
                </div>
            </SectionCard>

            <SectionCard title="Social Media" description="Connect your social profiles">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <Input
                            value={formData.facebook_url}
                            onChange={(e) => updateField('facebook_url', e.target.value)}
                            placeholder="Facebook page URL"
                            className="flex-1 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Instagram className="w-5 h-5 text-pink-600" />
                        <Input
                            value={formData.instagram_url}
                            onChange={(e) => updateField('instagram_url', e.target.value)}
                            placeholder="Instagram profile URL"
                            className="flex-1 bg-white"
                        />
                    </div>
                </div>
            </SectionCard>
        </div>
    );

    // --- Preview Panel ---

    const PreviewPanel = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-1"
        >
            <div className="sticky top-24">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Live Preview
                        </h3>
                        <button 
                            onClick={() => setShowPreview(false)}
                            className="lg:hidden text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-4">
                        {/* Preview Card */}
                        <div className="rounded-xl overflow-hidden border border-slate-200">
                            {/* Cover Image */}
                            <div className="aspect-video bg-linear-to-br from-primary-100 to-primary-200 flex items-center justify-center relative">
                                {formData.images[0] ? (
                                    <img src={formData.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-12 h-12 text-primary-300" />
                                )}
                                {formData.status === 'pending' && (
                                    <span className="absolute top-2 left-2 px-2 py-1 bg-amber-400 text-amber-900 text-xs font-medium rounded-md">
                                        Pending
                                    </span>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="p-4">
                                <h4 className="font-bold text-slate-900 truncate">
                                    {formData.name || 'Your Venue Name'}
                                </h4>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {formData.location || 'Location'}
                                </p>
                                
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                    <span className="text-slate-600">
                                        {formData.capacity_max ? `${formData.capacity_max} guests` : 'Capacity'}
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-primary-600 font-medium">
                                        {formData.price_range_min ? `From ${parseInt(formData.price_range_min).toLocaleString()} DZD` : 'Price'}
                                    </span>
                                </div>
                                
                                {formData.amenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {formData.amenities.slice(0, 3).map(a => (
                                            <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                                {a}
                                            </span>
                                        ))}
                                        {formData.amenities.length > 3 && (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                                +{formData.amenities.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <div className="text-lg font-bold text-slate-900">{formData.images.length}</div>
                                <div className="text-xs text-slate-500">Photos</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <div className="text-lg font-bold text-slate-900">{videos.length}</div>
                                <div className="text-xs text-slate-500">Videos</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <div className="text-lg font-bold text-slate-900">{formData.amenities.length}</div>
                                <div className="text-xs text-slate-500">Amenities</div>
                            </div>
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                <div className="text-lg font-bold text-slate-900">
                                    {formData.phone ? '✓' : '—'}
                                </div>
                                <div className="text-xs text-slate-500">Contact</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/${locale}/dashboard/venues`)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="font-semibold text-slate-900">Edit Venue</h1>
                                <p className="text-sm text-slate-500">{formData.name || 'Loading...'}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="lg:hidden px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                            
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                                    hasChanges 
                                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20' 
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex items-center gap-1 -mb-px overflow-x-auto">
                        <TabButton
                            active={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                            icon={Sparkles}
                            label="Overview"
                        />
                        <TabButton
                            active={activeTab === 'details'}
                            onClick={() => setActiveTab('details')}
                            icon={CheckCircle2}
                            label="Details"
                        />
                        <TabButton
                            active={activeTab === 'photos'}
                            onClick={() => setActiveTab('photos')}
                            icon={Camera}
                            label="Media"
                            badge={formData.images.length + videos.length}
                        />
                        <TabButton
                            active={activeTab === 'contact'}
                            onClick={() => setActiveTab('contact')}
                            icon={Phone}
                            label="Contact"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'overview' && renderOverviewTab()}
                                {activeTab === 'details' && renderDetailsTab()}
                                {activeTab === 'photos' && renderPhotosTab()}
                                {activeTab === 'contact' && renderContactTab()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    
                    {/* Preview Panel - Desktop */}
                    <div className="hidden lg:block">
                        <PreviewPanel />
                    </div>
                </div>
            </div>

            {/* Mobile Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setShowPreview(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-auto"
                        >
                            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                            <PreviewPanel />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
