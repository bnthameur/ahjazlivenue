// Landing Page Types for the Niche-Based System

export interface Niche {
    id: string;
    name: string;
    name_ar: string;
    name_fr: string;
    description: string;
    icon: string;
    preview_image_url: string | null;
    hero_prompt_template: string;
    body_prompt_template: string;
    suggested_benefits: string[];
    suggested_features: string[];
    trust_elements: string[];
    color_palette: string[];
    style_keywords: string[];
    is_active: boolean;
    sort_order: number;
}

export interface AIGeneratedContent {
    headline: string;
    subheadline: string;
    benefits: string[];
    features: string[];
    trust_badge: string;
    cta_text: string;
    urgency_text?: string;
    // AI-selected colors based on niche
    primaryColor: string;
    secondaryColor: string;
}

export interface LandingPageFormData {
    // Step 1: Product Images
    productImages: File[];
    productImagesPreview: string[];

    // Step 2: Niche Selection
    nicheId: string;

    // Step 3: Settings
    productName: string;
    price: string;
    discountPrice?: string;
    country: 'DZ' | 'MA' | 'TN';
    language: 'ar' | 'fr' | 'en';

    // Step 4: AI Content (editable)
    aiContent: AIGeneratedContent | null;
    isContentApproved: boolean;

    // Step 5: Generated Image
    finalImageUrl: string | null;

    // Meta
    slug: string;
}

export interface CreateLandingPageStep {
    id: 'upload' | 'niche' | 'settings' | 'content' | 'generate' | 'preview';
    label: string;
    labelAr: string;
}

export const CREATION_STEPS: CreateLandingPageStep[] = [
    { id: 'upload', label: 'Upload', labelAr: 'رفع الصور' },
    { id: 'niche', label: 'Niche', labelAr: 'التخصص' },
    { id: 'settings', label: 'Details', labelAr: 'التفاصيل' },
    { id: 'content', label: 'Content', labelAr: 'المحتوى' },
    { id: 'generate', label: 'Generate', labelAr: 'إنشاء' },
    { id: 'preview', label: 'Preview', labelAr: 'معاينة' },
];

// Countries with their currencies
export const COUNTRIES = {
    DZ: { name: 'Algeria', nameAr: 'الجزائر', currency: 'DZD', symbol: 'د.ج' },
    MA: { name: 'Morocco', nameAr: 'المغرب', currency: 'MAD', symbol: 'د.م' },
    TN: { name: 'Tunisia', nameAr: 'تونس', currency: 'TND', symbol: 'د.ت' },
} as const;

// Form labels by language
export const FORM_LABELS = {
    ar: {
        fullName: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        address: 'العنوان',
        region: 'الولاية',
        quantity: 'الكمية',
        orderNow: 'اطلب الآن',
        orderReceived: 'تم استلام طلبك بنجاح',
        willContact: 'سيتم الاتصال بك قريباً',
        freeDelivery: 'توصيل مجاني',
        cod: 'الدفع عند الاستلام',
        total: 'المجموع',
    },
    fr: {
        fullName: 'Nom complet',
        phone: 'Téléphone',
        address: 'Adresse',
        region: 'Région',
        quantity: 'Quantité',
        orderNow: 'Commander',
        orderReceived: 'Commande reçue',
        willContact: 'Nous vous contacterons bientôt',
        freeDelivery: 'Livraison gratuite',
        cod: 'Paiement à la livraison',
        total: 'Total',
    },
    en: {
        fullName: 'Full Name',
        phone: 'Phone',
        address: 'Address',
        region: 'Region',
        quantity: 'Quantity',
        orderNow: 'Order Now',
        orderReceived: 'Order Received',
        willContact: 'We will contact you soon',
        freeDelivery: 'Free Delivery',
        cod: 'Cash on Delivery',
        total: 'Total',
    },
} as const;
