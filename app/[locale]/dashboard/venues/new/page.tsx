'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, Link } from '@/i18n/navigation';
import { uploadVenueImages, uploadVenueVideo, VideoUploadProgress } from '@/lib/supabase/storage';
import { validateVideo } from '@/lib/media-optimizer';
import { formatBytes } from '@/lib/media-optimizer';
import { useTranslations, useLocale } from 'next-intl';
import { WILAYAS, getWilayaLabel, getWilayas } from '@/lib/wilayas';
import MapPicker from '@/components/MapPicker';
import {
    Building2,
    PartyPopper,
    Users,
    TreeDeciduous,
    Home,
    Hotel,
    Utensils,
    Moon,
    Upload,
    X,
    Check,
    ChevronRight,
    ChevronLeft,
    MapPin,
    Phone,
    Mail,
    Facebook,
    Instagram,
    Info,
    Camera,
    Sparkles,
    Car,
    Wind,
    Speaker,
    Lightbulb,
    ChefHat,
    Wifi,
    Accessibility,
    Music,
    Flower2,
    Waves,
    Sun,
    ImageIcon,
    Loader2,
    CheckCircle2,
    Star,
    AlertCircle,
    Video,
    Play,
    Trash2
} from 'lucide-react';

// --- Types & Constants ---

const getCategories = (t: (key: string) => string) => [
    { id: 'wedding-hall', icon: Building2, label: t('NewVenue.categories.wedding_hall'), color: 'rose' },
    { id: 'event-salon', icon: PartyPopper, label: t('NewVenue.categories.event_salon'), color: 'purple' },
    { id: 'conference-room', icon: Users, label: t('NewVenue.categories.conference_room'), color: 'blue' },
    { id: 'garden-outdoor', icon: TreeDeciduous, label: t('NewVenue.categories.garden_outdoor'), color: 'green' },
    { id: 'villa', icon: Home, label: t('NewVenue.categories.villa'), color: 'orange' },
    { id: 'hotel-ballroom', icon: Hotel, label: t('NewVenue.categories.hotel_ballroom'), color: 'indigo' },
    { id: 'restaurant', icon: Utensils, label: t('NewVenue.categories.restaurant'), color: 'amber' },
    { id: 'rooftop', icon: Moon, label: t('NewVenue.categories.rooftop'), color: 'sky' },
];



const getAmenities = (t: (key: string) => string) => [
    { id: 'Parking', name: t('NewVenue.amenities.parking'), icon: Car },
    { id: 'Air Conditioning', name: t('NewVenue.amenities.air_conditioning'), icon: Wind },
    { id: 'Sound System', name: t('NewVenue.amenities.sound_system'), icon: Speaker },
    { id: 'Lighting', name: t('NewVenue.amenities.lighting'), icon: Lightbulb },
    { id: 'Catering', name: t('NewVenue.amenities.catering'), icon: ChefHat },
    { id: 'Wi-Fi', name: t('NewVenue.amenities.wifi'), icon: Wifi },
    { id: 'Wheelchair Access', name: t('NewVenue.amenities.wheelchair_access'), icon: Accessibility },
    { id: 'Dance Floor', name: t('NewVenue.amenities.dance_floor'), icon: Music },
    { id: 'Garden', name: t('NewVenue.amenities.garden'), icon: Flower2 },
    { id: 'Pool', name: t('NewVenue.amenities.pool'), icon: Waves },
    { id: 'Terrace', name: t('NewVenue.amenities.terrace'), icon: Sun },
    { id: 'Stage', name: t('NewVenue.amenities.stage'), icon: Star },
];

type CityOption = {
    id: number;
    commune_name: string;
    daira_name: string | null;
    wilaya_code: number;
    wilaya_name: string;
};

// --- Components ---

const StepIndicator = ({ currentStep, totalSteps, t }: { currentStep: number; totalSteps: number; t: (key: string) => string }) => {
    const steps = ['NewVenue.steps.start', 'NewVenue.steps.basic', 'NewVenue.steps.details', 'NewVenue.steps.contact', 'NewVenue.steps.review'];
    
    return (
        <div className="w-full max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
            <div className="flex items-center justify-between relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
                {/* Progress Bar Fill */}
                <motion.div 
                    className="absolute top-1/2 left-0 h-1 bg-linear-to-r from-primary-500 to-primary-600 -translate-y-1/2 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
                
                {steps.map((stepKey, idx) => {
                    const stepNum = idx + 1;
                    const isActive = stepNum === currentStep;
                    const isCompleted = stepNum < currentStep;
                    
                    return (
                        <div key={stepKey} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                                    isCompleted 
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                                        : isActive 
                                            ? 'bg-white text-primary-600 border-2 border-primary-600 shadow-lg shadow-primary-500/20 scale-110' 
                                            : 'bg-white text-slate-400 border-2 border-slate-200'
                                }`}
                                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                {isCompleted ? <Check className="w-3 h-3 sm:w-5 sm:h-5" /> : stepNum}
                            </motion.div>
                            <span className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium transition-colors text-center max-w-12.5 sm:max-w-none leading-tight ${
                                isActive || isCompleted ? 'text-primary-700' : 'text-slate-400'
                            }`}>
                                {t(stepKey)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CategoryCard = ({ 
    category, 
    selected, 
    onClick 
}: { 
    category: ReturnType<typeof getCategories>[number]; 
    selected: boolean; 
    onClick: () => void;
}) => {
    const Icon = category.icon;
    const colorClasses: Record<string, string> = {
        rose: 'group-hover:bg-rose-50 group-hover:border-rose-200 group-hover:text-rose-600',
        purple: 'group-hover:bg-purple-50 group-hover:border-purple-200 group-hover:text-purple-600',
        blue: 'group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600',
        green: 'group-hover:bg-green-50 group-hover:border-green-200 group-hover:text-green-600',
        orange: 'group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-orange-600',
        indigo: 'group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600',
        amber: 'group-hover:bg-amber-50 group-hover:border-amber-200 group-hover:text-amber-600',
        sky: 'group-hover:bg-sky-50 group-hover:border-sky-200 group-hover:text-sky-600',
    };
    
    const selectedClasses: Record<string, string> = {
        rose: 'bg-rose-50 border-rose-500 text-rose-700 shadow-rose-100',
        purple: 'bg-purple-50 border-purple-500 text-purple-700 shadow-purple-100',
        blue: 'bg-blue-50 border-blue-500 text-blue-700 shadow-blue-100',
        green: 'bg-green-50 border-green-500 text-green-700 shadow-green-100',
        orange: 'bg-orange-50 border-orange-500 text-orange-700 shadow-orange-100',
        indigo: 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-indigo-100',
        amber: 'bg-amber-50 border-amber-500 text-amber-700 shadow-amber-100',
        sky: 'bg-sky-50 border-sky-500 text-sky-700 shadow-sky-100',
    };
    
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 sm:gap-3 ${
                selected 
                    ? `${selectedClasses[category.color]} shadow-lg scale-[1.02]` 
                    : `bg-white border-slate-100 ${colorClasses[category.color]} hover:shadow-md hover:-translate-y-0.5`
            }`}
        >
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${
                selected ? 'bg-white/80' : 'bg-slate-50 group-hover:bg-white/60'
            }`}>
                <Icon className={`w-5 h-5 sm:w-7 sm:h-7 transition-colors ${
                    selected ? '' : 'text-slate-400 group-hover:text-current'
                }`} strokeWidth={1.5} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-center leading-tight">{category.label}</span>
            {selected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2"
                >
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                </motion.div>
            )}
        </button>
    );
};

const AmenityTag = ({ 
    amenity, 
    selected, 
    onClick 
}: { 
    amenity: ReturnType<typeof getAmenities>[number]; 
    selected: boolean; 
    onClick: () => void;
}) => {
    const Icon = amenity.icon;
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                selected 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 scale-105' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300 hover:bg-primary-50/50'
            }`}
        >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">{amenity.name}</span>
        </button>
    );
};

const ImageUploadZone = ({ 
    images, 
    onUpload, 
    onRemove, 
    uploading, 
    progress,
    t
}: { 
    images: string[];
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (idx: number) => void;
    uploading: boolean;
    progress: { current: number; total: number } | null;
    t: (key: string) => string;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
        <div className="space-y-4">
            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {images.map((img, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200"
                        >
                            <img src={img} alt={`Venue ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                                type="button"
                                onClick={() => onRemove(idx)}
                                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-lg"
                            >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            {idx === 0 && (
                                <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary-600 text-white text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg">
                                    {t('NewVenue.form.cover')}
                                </div>
                            )}
                        </motion.div>
                    ))}
                    
                    {/* Add More Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-slate-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all"
                    >
                        <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span className="text-xs sm:text-sm font-medium">{t('NewVenue.form.add_more')}</span>
                    </button>
                </div>
            )}
            
            {/* Upload Zone */}
            {images.length === 0 && (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-300 p-6 sm:p-12 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all cursor-pointer group"
                >
                    <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-primary-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 sm:w-10 sm:h-10 text-primary-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">{t('NewVenue.form.photos_help')}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-3 sm:mb-4">{t('NewVenue.form.photos_browse')}</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t('NewVenue.form.photos_formats')}
                        </span>
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t('NewVenue.form.photos_optimized')}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Hidden Input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={onUpload}
                className="hidden"
            />
            
            {/* Upload Progress */}
            {uploading && progress && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-4 bg-primary-50 border border-primary-200 rounded-lg sm:rounded-xl"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 animate-spin" />
                        <div className="flex-1">
                            <div className="flex justify-between text-xs sm:text-sm mb-1">
                                <span className="font-medium text-primary-900">{t('NewVenue.form.optimizing')}</span>
                                <span className="text-primary-700">{progress.current}/{progress.total}</span>
                            </div>
                            <div className="h-1.5 sm:h-2 bg-primary-200 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// --- Main Page Component ---

export default function NewVenuePage() {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const [optimizationStats, setOptimizationStats] = useState<{ saved: string; percent: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [videos, setVideos] = useState<Array<{
        id: string;
        file: File;
        previewUrl: string | null;
        thumbnailUrl: string | null;
        status: 'queued' | 'uploading' | 'uploaded' | 'error';
        error?: string | null;
    }>>([]);
    const [videoUploading, setVideoUploading] = useState(false);
    const [videoUploadProgress, setVideoUploadProgress] = useState<VideoUploadProgress | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

    // Subscription & plan limit state
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [hasActiveSub, setHasActiveSub] = useState(false);
    const [planLimits, setPlanLimits] = useState({ maxImages: 5, maxVideos: 0, maxVenues: 1 });
    const [currentVenueCount, setCurrentVenueCount] = useState(0);

    // Check subscription on mount — block page if not paid
    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const supabaseClient = (await import('@/lib/supabase/client')).createClient();
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (!user) { router.push(`/${locale}/dashboard/settings`); return; }

                // Fetch subscription
                const { data: sub } = await supabaseClient
                    .from('user_subscriptions')
                    .select('id, status, expires_at, subscription_plans(id, max_venues, max_images_per_venue, max_videos_per_venue)')
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
                    setSubscriptionLoading(false);
                    return;
                }

                setHasActiveSub(true);
                const plan = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;
                setPlanLimits({
                    maxImages: plan?.max_images_per_venue ?? 5,
                    maxVideos: plan?.max_videos_per_venue ?? 0,
                    maxVenues: plan?.max_venues ?? 1,
                });

                // Fetch current venue count
                const { count } = await supabaseClient
                    .from('venues')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id);
                setCurrentVenueCount(count || 0);
            } catch (err) {
                console.error('Subscription check failed:', err);
                setHasActiveSub(false);
            } finally {
                setSubscriptionLoading(false);
            }
        };
        checkSubscription();
    }, [locale, router]);

    const categories = useMemo(() => getCategories(t), [t]);
    const wilayas = useMemo(() => getWilayas(t), [t]);
    const amenitiesList = useMemo(() => getAmenities(t), [t]);
    const [cities, setCities] = useState<CityOption[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);
    const [citiesError, setCitiesError] = useState<string | null>(null);
    const citiesCacheRef = useRef(new Map<string, CityOption[]>());
    
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category: '',
        wilaya: '',
        city: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity_max: '',
        price_range_min: '',
        phone: '',
        whatsapp: '',
        email: '',
        facebook_url: '',
        instagram_url: '',
        amenities: [] as string[],
        images: [] as string[],
        offers: [] as Array<{ title: string; price: number }>,
    });

    const updateField = (field: string, value: string | string[]) => {
        setFormData(prev => {
            if (field === 'wilaya') {
                return { ...prev, wilaya: value as string, city: '' };
            }
            return { ...prev, [field]: value };
        });
        setError(null);
    };

    useEffect(() => {
        if (!formData.wilaya) {
            setCities([]);
            setCitiesError(null);
            return;
        }

        const selectedWilaya = WILAYAS.find((w) => w.id === formData.wilaya);
        if (!selectedWilaya) {
            setCities([]);
            setCitiesError(null);
            return;
        }

        const cached = citiesCacheRef.current.get(selectedWilaya.code);
        if (cached) {
            setCities(cached);
            return;
        }

        setCitiesLoading(true);
        setCitiesError(null);
        fetch(`/api/cities?wilaya_code=${selectedWilaya.code}`)
            .then((res) => res.json())
            .then((payload) => {
                const list = (payload?.data || []) as CityOption[];
                citiesCacheRef.current.set(selectedWilaya.code, list);
                setCities(list);
            })
            .catch(() => {
                setCitiesError(t('NewVenue.form.city_load_error'));
            })
            .finally(() => setCitiesLoading(false));
    }, [formData.wilaya, t]);

    const toggleAmenity = (amenityId: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenityId)
                ? prev.amenities.filter(a => a !== amenityId)
                : [...prev.amenities, amenityId]
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (!files.length) return;

        // Enforce plan image limit
        const remaining = planLimits.maxImages - formData.images.length;
        if (remaining <= 0) {
            setError(t('NewVenue.errors.upload_failed') + `: Plan limit ${planLimits.maxImages} images.`);
            e.target.value = '';
            return;
        }
        const filesToUpload = files.slice(0, remaining);

        setUploading(true);
        setError(null);

        try {
            const tempVenueId = `temp_${Date.now()}`;
            const results = await uploadVenueImages(filesToUpload, tempVenueId, (progress) => {
                setUploadProgress({ current: progress.current, total: progress.total });
            });

            const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
            const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSize, 0);
            const saved = totalOriginal - totalOptimized;
            
            if (saved > 0) {
                setOptimizationStats({
                    saved: formatBytes(saved),
                    percent: ((saved / totalOriginal) * 100).toFixed(1)
                });
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...results.map(r => r.publicUrl)]
            }));
        } catch (err: any) {
            setError(t('NewVenue.errors.upload_failed') + ': ' + err.message);
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };

    const removeImage = (idx: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('video/')) return;

        // Enforce plan video limit
        if (videos.length >= planLimits.maxVideos) {
            setVideoError(`Plan limit: ${planLimits.maxVideos} video(s) per venue.`);
            e.target.value = '';
            return;
        }

        setVideoUploading(true);
        setVideoError(null);
        setVideoUploadProgress(null);

        try {
            const validation = await validateVideo(file);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const previewUrl = URL.createObjectURL(file);
            let thumbnailUrl: string | null = null;

            try {
                const videoEl = document.createElement('video');
                videoEl.preload = 'metadata';
                videoEl.muted = true;
                videoEl.playsInline = true;
                videoEl.src = previewUrl;

                thumbnailUrl = await new Promise<string | null>((resolve) => {
                    videoEl.onloadedmetadata = () => {
                        videoEl.currentTime = videoEl.duration >= 2 ? 1 : Math.max(videoEl.duration / 2, 0);
                    };
                    videoEl.onseeked = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = videoEl.videoWidth || 640;
                        canvas.height = videoEl.videoHeight || 360;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            resolve(null);
                            return;
                        }
                        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.6));
                    };
                    videoEl.onerror = () => resolve(null);
                });
            } catch {
                thumbnailUrl = null;
            }

            setVideos(prev => [
                ...prev,
                {
                    id: `${file.name}-${file.lastModified}-${Date.now()}`,
                    file,
                    previewUrl,
                    thumbnailUrl,
                    status: 'queued',
                },
            ]);
        } catch (err: any) {
            setVideoError('Error uploading video: ' + err.message);
        } finally {
            setVideoUploading(false);
            setVideoUploadProgress(null);
            e.target.value = '';
        }
    };

    const removeVideo = (videoId: string) => {
        setVideos(prev => {
            const target = prev.find(v => v.id === videoId);
            if (target?.previewUrl) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter(v => v.id !== videoId);
        });
    };

    // Fixed submission using API route
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Use the API route instead of direct supabase insert
            const response = await fetch('/api/venues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    slug: formData.slug || undefined,
                    title: formData.name,
                    description: formData.description,
                    category: formData.category,
                    location: formData.wilaya,
                    wilaya: formData.wilaya,
                    city: formData.city,
                    address: formData.address,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    capacity_min: 0,
                    capacity_max: parseInt(formData.capacity_max) || 0,
                    capacity: parseInt(formData.capacity_max) || 0,
                    price_min: parseFloat(formData.price_range_min) || 0,
                    price_max: parseFloat(formData.price_range_min) || 0,
                    price: parseFloat(formData.price_range_min) || 0,
                    phone: formData.phone,
                    whatsapp: formData.whatsapp,
                    contact_email: formData.email,
                    facebook_url: formData.facebook_url,
                    instagram_url: formData.instagram_url,
                    amenities: formData.amenities,
                    images: formData.images,
                    offers: formData.offers,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            const createdVenueId = responseData?.data?.id as string | undefined;

            if (!createdVenueId) {
                throw new Error('Venue created, but no venue ID was returned.');
            }

            if (videos.length > 0) {
                setVideoUploading(true);
                setVideoUploadProgress({ stage: 'compressing-video', progress: 0 });
            }

            for (const queuedVideo of videos) {
                setVideos(prev => prev.map((video) => (
                    video.id === queuedVideo.id ? { ...video, status: 'uploading', error: null } : video
                )));

                try {
                    await uploadVenueVideo(queuedVideo.file, createdVenueId, (progress) => {
                        setVideoUploadProgress(progress);
                    });
                    setVideos(prev => prev.map((video) => (
                        video.id === queuedVideo.id ? { ...video, status: 'uploaded', error: null } : video
                    )));
                } catch (uploadError: any) {
                    setVideos(prev => prev.map((video) => (
                        video.id === queuedVideo.id ? { ...video, status: 'error', error: uploadError.message || 'Upload failed' } : video
                    )));
                    throw new Error(`Venue created, but video upload failed: ${uploadError.message || 'Unknown error'}`);
                }
            }

            // Success - redirect to venues list
            router.push(`/${locale}/dashboard/venues`);
            router.refresh();
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || t('NewVenue.errors.submit_failed'));
        } finally {
            setVideoUploading(false);
            setVideoUploadProgress(null);
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1: return true;
            case 2: return formData.name && formData.category && formData.wilaya && formData.city && formData.description;
            case 3: return true;
            case 4: return formData.phone;
            case 5: return true;
            default: return true;
        }
    };

    // --- Step Content Renderers ---

    const renderWelcomeStep = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-2xl mx-auto py-8 sm:py-12 px-4"
        >
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30">
                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
                {t('NewVenue.welcome.title')}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed px-2">
                {t('NewVenue.welcome.subtitle')}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
                {[
                    { icon: ImageIcon, label: t('NewVenue.welcome.add_photos'), desc: t('NewVenue.welcome.add_photos_desc') },
                    { icon: MapPin, label: t('NewVenue.welcome.set_location'), desc: t('NewVenue.welcome.set_location_desc') },
                    { icon: CheckCircle2, label: t('NewVenue.welcome.get_bookings'), desc: t('NewVenue.welcome.get_bookings_desc') },
                ].map((item, idx) => (
                    <div key={idx} className="p-2 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                        <item.icon className="w-5 h-5 sm:w-8 sm:h-8 text-primary-600 mx-auto mb-1.5 sm:mb-2" />
                        <div className="font-medium text-slate-900 text-xs sm:text-base">{item.label}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{item.desc}</div>
                    </div>
                ))}
            </div>
            <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 hover:bg-primary-700 text-white text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
                {t('NewVenue.welcome.start_button')}
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </motion.div>
    );

    const renderBasicInfoStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-0"
        >
            <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">{t('NewVenue.steps.basic')}</h2>
                <p className="text-sm sm:text-base text-slate-500">{t('NewVenue.form.description_hint')}</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Venue Name & Slug */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('NewVenue.form.name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder={t('NewVenue.form.name_placeholder')}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('NewVenue.form.slug')}
                        </label>
                        <div className="flex items-center">
                            <span className="text-xs text-slate-400 bg-slate-100 border border-slate-200 border-e-0 rounded-s-xl px-3 py-2.5 whitespace-nowrap shrink-0">
                                ahjazliqaati.com/salles/
                            </span>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => {
                                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
                                    updateField('slug', val);
                                }}
                                placeholder={t('NewVenue.form.slug_placeholder')}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-e-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{t('NewVenue.form.slug_help')}</p>
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 sm:mb-3">
                        {t('NewVenue.form.category')} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {categories.map((cat) => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                selected={formData.category === cat.id}
                                onClick={() => updateField('category', cat.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('NewVenue.form.wilaya')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.wilaya}
                            onChange={(e) => updateField('wilaya', e.target.value)}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                        >
                            <option value="">{t('NewVenue.form.select_wilaya')}</option>
                            {wilayas.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('NewVenue.form.city')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            disabled={!formData.wilaya || citiesLoading}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <option value="">
                                {citiesLoading ? t('NewVenue.form.city_loading') : t('NewVenue.form.select_city')}
                            </option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.commune_name}>{city.commune_name}</option>
                            ))}
                        </select>
                        {citiesError ? (
                            <p className="mt-2 text-xs text-red-600">{citiesError}</p>
                        ) : null}
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('NewVenue.form.address')}
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder={t('NewVenue.form.address_placeholder')}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                            />
                        </div>
                    </div>
                </div>

                {/* Latitude / Longitude + Map Picker */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('NewVenue.form.latitude')}
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={(e) => updateField('latitude', e.target.value)}
                                placeholder="36.7538"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                {t('NewVenue.form.longitude')}
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={(e) => updateField('longitude', e.target.value)}
                                placeholder="3.0588"
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">{t('NewVenue.form.map_picker_hint')}</p>
                    <MapPicker
                        lat={formData.latitude ? parseFloat(formData.latitude) : null}
                        lng={formData.longitude ? parseFloat(formData.longitude) : null}
                        onLocationChange={(lat, lng) => {
                            updateField('latitude', String(lat));
                            updateField('longitude', String(lng));
                        }}
                    />
                </div>

                {/* Description */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('NewVenue.form.description')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder={t('NewVenue.form.description_placeholder')}
                        rows={4}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none text-sm sm:text-base"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                        {t('NewVenue.form.description_hint')}
                    </p>
                </div>
            </div>
        </motion.div>
    );

    const renderDetailsStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-0"
        >
            <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">{t('NewVenue.steps.details')}</h2>
                <p className="text-sm sm:text-base text-slate-500">{t('NewVenue.form.photos_hint')}</p>
            </div>

            <div className="space-y-4 sm:space-y-6">
                {/* Capacity & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-3 sm:mb-4">
                            {t('NewVenue.form.capacity_label')}
                        </label>
                        <input
                            type="number"
                            value={formData.capacity_max}
                            onChange={(e) => updateField('capacity_max', e.target.value)}
                            placeholder="300"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                        />
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                        <label className="block text-sm font-medium text-slate-700 mb-3 sm:mb-4">
                            {t('NewVenue.form.price_label')}
                        </label>
                        <input
                            type="number"
                            value={formData.price_range_min}
                            onChange={(e) => updateField('price_range_min', e.target.value)}
                            placeholder="50000"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Amenities */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-3 sm:mb-4">
                        {t('NewVenue.form.amenities')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {amenitiesList.map((amenity) => (
                            <AmenityTag
                                key={amenity.id}
                                amenity={amenity}
                                selected={formData.amenities.includes(amenity.id)}
                                onClick={() => toggleAmenity(amenity.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Offers */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                {t('NewVenue.form.offers_title')}
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t('NewVenue.form.offers_desc')}
                            </p>
                        </div>
                        {formData.offers.length < 4 ? (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    offers: [...prev.offers, { title: '', price: 0 }],
                                }))}
                                className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1 shrink-0"
                            >
                                <span className="text-sm leading-none">+</span>
                                {t('NewVenue.form.add_offer')}
                            </button>
                        ) : (
                            <span className="text-xs text-slate-400 shrink-0">{t('NewVenue.form.max_offers')}</span>
                        )}
                    </div>
                    {formData.offers.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="text-slate-400 text-xs">{t('NewVenue.form.offers_desc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {formData.offers.map((offer, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                    <input
                                        type="text"
                                        value={offer.title}
                                        onChange={(e) => {
                                            const updated = formData.offers.map((o, i) =>
                                                i === idx ? { ...o, title: e.target.value } : o
                                            );
                                            setFormData(prev => ({ ...prev, offers: updated }));
                                        }}
                                        placeholder={t('NewVenue.form.offer_name')}
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    />
                                    <input
                                        type="number"
                                        value={offer.price === 0 ? '' : offer.price}
                                        onChange={(e) => {
                                            const updated = formData.offers.map((o, i) =>
                                                i === idx ? { ...o, price: parseFloat(e.target.value) || 0 } : o
                                            );
                                            setFormData(prev => ({ ...prev, offers: updated }));
                                        }}
                                        placeholder={t('NewVenue.form.offer_price')}
                                        className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            offers: prev.offers.filter((_, i) => i !== idx),
                                        }))}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Photos */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                {t('NewVenue.form.photos')}
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t('NewVenue.form.photos_hint')}
                            </p>
                        </div>
                        {optimizationStats && (
                            <span className="text-[10px] sm:text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                -{optimizationStats.saved}
                            </span>
                        )}
                    </div>
                    <ImageUploadZone
                        images={formData.images}
                        onUpload={handleImageUpload}
                        onRemove={removeImage}
                        uploading={uploading}
                        progress={uploadProgress}
                        t={t}
                    />
                </div>

                {/* Videos Section */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Videos
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Upload a video tour of your venue (MP4, WebM, MOV — max 50MB)
                            </p>
                        </div>
                        <label className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0 ${
                            videoUploading
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-violet-600 text-white cursor-pointer hover:bg-violet-700'
                        }`}>
                            <Video className="w-3.5 h-3.5" />
                            Add Video
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                                disabled={videoUploading}
                            />
                        </label>
                    </div>

                    {/* Video Upload Progress */}
                    {videoUploading && (
                        <div className="mb-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Loader2 className="w-4 h-4 text-violet-600 animate-spin shrink-0" />
                                <p className="text-xs text-violet-700 font-medium">
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
                                    style={{ width: `${videoUploadProgress?.progress ?? 10}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {videoError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs text-red-700">{videoError}</p>
                        </div>
                    )}

                    {videos.length === 0 && !videoUploading ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                            <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No videos yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {videos.map((video) => (
                                <div
                                    key={video.id}
                                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-200"
                                >
                                    {video.thumbnailUrl ? (
                                        <img
                                            src={video.thumbnailUrl}
                                            alt="Video thumbnail"
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video className="w-8 h-8 text-slate-500" />
                                        </div>
                                    )}
                                    {/* Play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow">
                                            <Play className="w-4 h-4 text-slate-800 ml-0.5" fill="currentColor" />
                                        </div>
                                    </div>
                                    {video.status !== 'queued' && (
                                        <div className={`absolute bottom-1.5 left-1.5 px-2 py-1 rounded-lg text-[10px] font-medium ${
                                            video.status === 'uploaded'
                                                ? 'bg-emerald-600 text-white'
                                                : video.status === 'uploading'
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-red-600 text-white'
                                        }`}>
                                            {video.status === 'uploaded' ? 'Saved' : video.status === 'uploading' ? 'Uploading' : 'Needs retry'}
                                        </div>
                                    )}
                                    {/* Remove button */}
                                    <button
                                        type="button"
                                        onClick={() => removeVideo(video.id)}
                                        className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );

    const renderContactStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-0"
        >
            <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">{t('NewVenue.steps.contact')}</h2>
                <p className="text-sm sm:text-base text-slate-500">{t('NewVenue.form.phone_required')}</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {/* Phone & WhatsApp */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-3 sm:mb-4">
                        {t('NewVenue.form.phone')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mb-3 sm:mb-4">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder={t('NewVenue.form.phone_placeholder')}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                        />
                    </div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('NewVenue.form.whatsapp')}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base sm:text-lg">💬</span>
                        <input
                            type="tel"
                            value={formData.whatsapp}
                            onChange={(e) => updateField('whatsapp', e.target.value)}
                            placeholder={t('NewVenue.form.whatsapp_placeholder')}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t('NewVenue.form.email')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder={t('NewVenue.form.email_placeholder')}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-medium text-slate-700 mb-3 sm:mb-4">
                        {t('NewVenue.form.social')} <span className="text-slate-400 font-normal">({t('NewVenue.form.social_optional')})</span>
                    </label>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="relative">
                            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <input
                                type="url"
                                value={formData.facebook_url}
                                onChange={(e) => updateField('facebook_url', e.target.value)}
                                placeholder={t('NewVenue.form.facebook')}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                            />
                        </div>
                        <div className="relative">
                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                            <input
                                type="url"
                                value={formData.instagram_url}
                                onChange={(e) => updateField('instagram_url', e.target.value)}
                                placeholder={t('NewVenue.form.instagram')}
                                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm sm:text-base"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderReviewStep = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-0"
        >
            <div className="text-center mb-4 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">{t('NewVenue.form.review_title')}</h2>
                <p className="text-sm sm:text-base text-slate-500">{t('NewVenue.form.review_subtitle')}</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {/* Summary Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{formData.name}</h3>
                                <p className="text-slate-500 flex items-center gap-1 mt-1 text-sm">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                    <span className="truncate">
                                        {[formData.city, getWilayaLabel(t, formData.wilaya)].filter(Boolean).join(', ')}
                                        {formData.address && `, ${formData.address}`}
                                    </span>
                                </p>
                            </div>
                            <span className="px-2.5 sm:px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full self-start">
                                {t('NewVenue.form.pending_review')}
                            </span>
                        </div>
                    </div>
                    
                    {/* Details */}
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="p-2.5 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl text-center">
                                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                                    {formData.capacity_max || '-'}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mt-1">{t('VenueDetails.capacity_label')}</div>
                            </div>
                            <div className="p-2.5 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl text-center">
                                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                                    {formData.price_range_min ? `${parseInt(formData.price_range_min).toLocaleString()} DZD` : '-'}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mt-1">{t('NewVenue.form.starting_price')}</div>
                            </div>
                            <div className="p-2.5 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl text-center">
                                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                                    {formData.images.length}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide mt-1">{t('NewVenue.form.photo_count')}</div>
                            </div>
                        </div>

                        {formData.amenities.length > 0 && (
                            <div>
                                <h4 className="text-xs sm:text-sm font-medium text-slate-700 mb-2">{t('NewVenue.form.amenities')}</h4>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {formData.amenities.map(a => {
                                        const amenity = amenitiesList.find(am => am.id === a);
                                        return (
                                            <span key={a} className="px-2 sm:px-3 py-1 bg-primary-50 text-primary-700 text-xs sm:text-sm rounded-md sm:rounded-lg">
                                                {amenity?.name || a}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {formData.images.length > 0 && (
                            <div>
                                <h4 className="text-xs sm:text-sm font-medium text-slate-700 mb-2">{t('NewVenue.form.photos')}</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                                    {formData.images.slice(0, 4).map((img, idx) => (
                                        <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {formData.images.length > 4 && (
                                        <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs sm:text-sm font-medium">
                                            +{formData.images.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Notice */}
                <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-amber-800">
                        <p className="font-medium mb-1">{t('NewVenue.form.what_happens_next')}</p>
                        <p className="text-amber-700">
                            {t('NewVenue.form.review_notice')}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // --- Main Render ---

    // Loading subscription check
    if (subscriptionLoading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    // Block: No active subscription
    if (!hasActiveSub) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{t('NewVenue.subscription_required_title')}</h2>
                    <p className="text-sm text-slate-600 mb-6">{t('NewVenue.subscription_required_desc')}</p>
                    <Link
                        href="/dashboard/settings"
                        prefetch={true}
                        className="block w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-center"
                    >
                        {t('NewVenue.go_to_settings')}
                    </Link>
                </div>
            </div>
        );
    }

    // Block: Venue limit reached
    if (currentVenueCount >= planLimits.maxVenues) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{t('NewVenue.venue_limit_title')}</h2>
                    <p className="text-sm text-slate-600 mb-6">{t('NewVenue.venue_limit_desc')}</p>
                    <Link
                        href="/dashboard/venues"
                        prefetch={true}
                        className="block w-full px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors text-center"
                    >
                        {t('NewVenue.back_to_venues')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/dashboard/venues"
                            prefetch={true}
                            className="text-slate-500 hover:text-slate-700 font-medium text-xs sm:text-sm flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{t('NewVenue.cancel')}</span>
                        </Link>
                        <h1 className="font-semibold text-slate-900 text-sm sm:text-base">{t('NewVenue.header_title')}</h1>
                        <div className="w-10 sm:w-16" />
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 mt-4"
                >
                    <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl flex items-start gap-2 sm:gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-red-800">
                            {error}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Content */}
            <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8">
                {step > 1 && <StepIndicator currentStep={step} totalSteps={5} t={t} />}
                
                <AnimatePresence mode="wait">
                    {step === 1 && renderWelcomeStep()}
                    {step === 2 && renderBasicInfoStep()}
                    {step === 3 && renderDetailsStep()}
                    {step === 4 && renderContactStep()}
                    {step === 5 && renderReviewStep()}
                </AnimatePresence>

                {/* Navigation */}
                {step > 1 && (
                    <div className="max-w-3xl mx-auto mt-6 sm:mt-8 flex items-center justify-between px-2 sm:px-0">
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-200 text-slate-700 font-medium rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 sm:gap-2 text-sm"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{t('NewVenue.buttons.prev')}</span>
                        </button>
                        
                        {step < 5 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                className="px-5 sm:px-8 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 text-sm"
                            >
                                {t('NewVenue.buttons.next')}
                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-5 sm:px-8 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-medium rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-primary-500/20 text-sm"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                        <span className="hidden sm:inline">{t('NewVenue.buttons.submitting')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">{t('NewVenue.buttons.create_venue')}</span>
                                        <span className="sm:hidden">{t('NewVenue.buttons.submit')}</span>
                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
