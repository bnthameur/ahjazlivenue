import {
    Building2, PartyPopper, Users, TreeDeciduous, Home, Hotel, Utensils, Moon,
    Briefcase, HandPlatter, ChefHat, CakeSlice, Brush, Disc3, Video, Drum, Crown,
    Sparkles, Shirt, Car, Package, Store,
    type LucideIcon,
} from 'lucide-react';

// Every listing lives in the `venues` table; its `category` slug decides which
// group it belongs to. Keep this file identical in ahjazlivenue and ahjazlilanding.

export type ListingGroupId = 'venue' | 'job' | 'artist' | 'service' | 'rental';

type Labels = { ar: string; fr: string; en: string };

export interface ListingCategory {
    id: string;
    group: ListingGroupId;
    icon: LucideIcon;
    color: string;
    label: Labels;
}

export interface ListingGroup {
    id: ListingGroupId;
    icon: LucideIcon;
    label: Labels;
    description: Labels;
}

export const LISTING_GROUPS: ListingGroup[] = [
    {
        id: 'venue',
        icon: Building2,
        label: { ar: 'قاعات', fr: 'Salles', en: 'Venues' },
        description: { ar: 'قاعات الأفراح والمناسبات', fr: 'Salles des fêtes et événements', en: 'Wedding and event venues' },
    },
    {
        id: 'job',
        icon: Briefcase,
        label: { ar: 'طالبو العمل', fr: "Demandeurs d'emploi", en: 'Job seekers' },
        description: { ar: 'نادلون، طباخون، عاملات نظافة...', fr: 'Serveurs, traiteurs, femmes de ménage…', en: 'Waiters, caterers, cleaners…' },
    },
    {
        id: 'artist',
        icon: Disc3,
        label: { ar: 'دي جي ومصورون', fr: 'DJ & caméramans', en: 'DJs & camera crews' },
        description: { ar: 'دي جي، مصورو فيديو رجال ونساء', fr: 'DJ, caméramans et camérawomen', en: 'DJs, cameramen and camerawomen' },
    },
    {
        id: 'service',
        icon: Sparkles,
        label: { ar: 'خدمات الأفراح', fr: 'Services extra', en: 'Extra services' },
        description: { ar: 'زرنة، عمارية، منظمو الحفلات...', fr: 'Zorna, amariya, organisateurs de fêtes…', en: 'Zorna, amariya, party planners…' },
    },
    {
        id: 'rental',
        icon: Shirt,
        label: { ar: 'كراء', fr: 'Locations', en: 'Rentals' },
        description: { ar: 'ملابس، سيارات، معدات الأعراس', fr: 'Vêtements, voitures, matériel de mariage', en: 'Clothing, cars, wedding equipment' },
    },
];

export const LISTING_CATEGORIES: ListingCategory[] = [
    // Venues (slugs already stored on existing listings — never rename)
    { id: 'wedding-hall', group: 'venue', icon: Building2, color: 'rose', label: { ar: 'قاعة أفراح', fr: 'Salle des fêtes', en: 'Wedding hall' } },
    { id: 'event-salon', group: 'venue', icon: PartyPopper, color: 'purple', label: { ar: 'صالون مناسبات', fr: 'Salon événementiel', en: 'Event salon' } },
    { id: 'conference-room', group: 'venue', icon: Users, color: 'blue', label: { ar: 'قاعة مؤتمرات', fr: 'Salle de conférence', en: 'Conference room' } },
    { id: 'garden-outdoor', group: 'venue', icon: TreeDeciduous, color: 'green', label: { ar: 'حديقة / فضاء خارجي', fr: 'Jardin / extérieur', en: 'Garden / outdoor' } },
    { id: 'villa', group: 'venue', icon: Home, color: 'orange', label: { ar: 'فيلا', fr: 'Villa', en: 'Villa' } },
    { id: 'hotel-ballroom', group: 'venue', icon: Hotel, color: 'indigo', label: { ar: 'قاعة فندق', fr: "Salle d'hôtel", en: 'Hotel ballroom' } },
    { id: 'restaurant', group: 'venue', icon: Utensils, color: 'amber', label: { ar: 'مطعم', fr: 'Restaurant', en: 'Restaurant' } },
    { id: 'rooftop', group: 'venue', icon: Moon, color: 'sky', label: { ar: 'سطح', fr: 'Rooftop', en: 'Rooftop' } },

    // Job seekers
    { id: 'serveur', group: 'job', icon: HandPlatter, color: 'rose', label: { ar: 'نادل / نادلة', fr: 'Serveur / Serveuse', en: 'Waiter / Waitress' } },
    { id: 'traiteur', group: 'job', icon: ChefHat, color: 'amber', label: { ar: 'طباخ / ممون', fr: 'Traiteur', en: 'Caterer' } },
    { id: 'aide-traiteur', group: 'job', icon: Utensils, color: 'orange', label: { ar: 'مساعد طباخ', fr: 'Aide traiteur', en: 'Catering assistant' } },
    { id: 'la-planche', group: 'job', icon: CakeSlice, color: 'purple', label: { ar: 'لابلانش', fr: 'La planche', en: 'La planche' } },
    { id: 'femme-de-menage', group: 'job', icon: Brush, color: 'sky', label: { ar: 'عاملة نظافة', fr: 'Femme de ménage', en: 'Cleaner' } },
    { id: 'autre-emploi', group: 'job', icon: Briefcase, color: 'indigo', label: { ar: 'عمل آخر', fr: 'Autre emploi', en: 'Other job' } },

    // DJs & camera
    { id: 'dj', group: 'artist', icon: Disc3, color: 'purple', label: { ar: 'دي جي', fr: 'DJ', en: 'DJ' } },
    { id: 'cameraman', group: 'artist', icon: Video, color: 'blue', label: { ar: 'مصور فيديو (رجل)', fr: 'Caméraman', en: 'Cameraman' } },
    { id: 'camerawoman', group: 'artist', icon: Video, color: 'rose', label: { ar: 'مصورة فيديو (امرأة)', fr: 'Camérawoman', en: 'Camerawoman' } },

    // Extra services
    { id: 'zorna', group: 'service', icon: Drum, color: 'amber', label: { ar: 'زرنة', fr: 'Zorna', en: 'Zorna' } },
    { id: 'amariya', group: 'service', icon: Crown, color: 'rose', label: { ar: 'عمارية', fr: 'Amariya', en: 'Amariya' } },
    { id: 'organisateur', group: 'service', icon: PartyPopper, color: 'green', label: { ar: 'منظم حفلات', fr: 'Organisateur de fêtes', en: 'Party planner' } },
    { id: 'autre-service', group: 'service', icon: Sparkles, color: 'indigo', label: { ar: 'خدمة أخرى', fr: 'Autre service', en: 'Other service' } },

    // Rentals
    { id: 'robes-soiree', group: 'rental', icon: Shirt, color: 'rose', label: { ar: 'كراء فساتين السهرة', fr: 'Location robes de soirée', en: 'Evening dress rental' } },
    { id: 'vetements', group: 'rental', icon: Store, color: 'purple', label: { ar: 'كراء وبيع ملابس رجال ونساء', fr: 'Location & vente vêtements homme / femme', en: "Men's & women's clothing rental & sale" } },
    { id: 'location-voiture', group: 'rental', icon: Car, color: 'blue', label: { ar: 'كراء السيارات', fr: 'Location de voitures', en: 'Car rental' } },
    { id: 'materiel-mariage', group: 'rental', icon: Package, color: 'orange', label: { ar: 'كراء معدات الأعراس', fr: 'Location matériel de mariage', en: 'Wedding equipment rental' } },
];

type Locale = keyof Labels;

const pick = (labels: Labels, locale: string) => labels[(locale in labels ? locale : 'fr') as Locale];

export const getListingCategory = (id?: string | null) =>
    LISTING_CATEGORIES.find((c) => c.id === id);

/** Unknown or empty categories count as venues, which is what every listing was before. */
export const getListingGroupId = (categoryId?: string | null): ListingGroupId =>
    getListingCategory(categoryId)?.group ?? 'venue';

export const isVenueCategory = (categoryId?: string | null) => getListingGroupId(categoryId) === 'venue';

export const getCategoriesForGroup = (group: ListingGroupId) =>
    LISTING_CATEGORIES.filter((c) => c.group === group);

export const getCategoryLabel = (categoryId: string | null | undefined, locale: string) => {
    const category = getListingCategory(categoryId);
    return category ? pick(category.label, locale) : categoryId || '';
};

export const getGroupLabel = (group: ListingGroupId, locale: string) =>
    pick(LISTING_GROUPS.find((g) => g.id === group)!.label, locale);

export const getGroupDescription = (group: ListingGroupId, locale: string) =>
    pick(LISTING_GROUPS.find((g) => g.id === group)!.description, locale);
