'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, Locale, createLocalizedPath, getLocaleFromPath } from '@/i18n/routing';

type Language = Locale;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    dir: 'ltr' | 'rtl';
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
    en: {
        'nav.browse': 'Browse Venues',
        'nav.how': 'How It Works',
        'nav.owners': 'For Owners',
        'nav.signin': 'Sign In',
        'nav.list_venue': 'List Your Venue',
        'hero.title': 'Find the Perfect Venue for Your Event',
        'hero.subtitle': 'The #1 marketplace for wedding halls, salons, and event venues in Algeria.',
        'search.placeholder': 'Search venues...',
        'search.location': 'All Locations',
        'search.btn': 'Search',
        'settings.title': 'Settings',
        'settings.desc': 'Manage your account and profile',
        'settings.profile': 'Profile',
        'settings.save': 'Save Changes',
        'settings.saving': 'Saving...',
        'settings.upload': 'Change Photo',
        'settings.uploading': 'Uploading...',
        'settings.email': 'Email',
        'settings.fullname': 'Personal Name',
        'settings.phone': 'Phone',
        'settings.businessname': 'Business Name',
        'settings.businessdesc': 'Business Description',
        'settings.businessplaceholder': 'e.g. Wedding Hall Algiers',
        'dashboard.nav.home': 'Dashboard',
        'dashboard.nav.venues': 'My Venues',
        'dashboard.nav.inquiries': 'Inquiries',
        'dashboard.nav.settings': 'Settings',
        'dashboard.status.active': 'Active',
        'dashboard.status.pending': 'Pending Approval',
        'dashboard.status.pending_desc': 'Your account is under review.',
        'dashboard.status.review_time': 'This usually takes 24-48 hours.',
        'dashboard.status.rejected': 'Account Rejected',
        'dashboard.status.rejected_desc': 'Please contact support.',
        'dashboard.header.signout': 'Sign out',
        'dashboard.btn.add_venue': 'Add New Venue',
        'dashboard.welcome.title': 'Welcome back',
        'dashboard.welcome.subtitle': 'Manage your venues and track your performance.',
        'dashboard.stats.total_venues': 'Total Venues',
        'dashboard.stats.pending': 'Pending Review',
        'dashboard.stats.inquiries': 'Inquiries',
        'dashboard.stats.views': 'Total Views',
        'dashboard.actions.add_title': 'Add New Venue',
        'dashboard.actions.add_desc': 'List your venue and reach customers',
        'dashboard.actions.venues_title': 'My Venues',
        'dashboard.actions.venues_desc': 'View and manage your listings',
        'dashboard.actions.inquiries_title': 'Inquiries',
        'dashboard.actions.inquiries_desc': 'Check customer messages',
        'dashboard.actions.settings_title': 'Settings',
        'dashboard.actions.settings_desc': 'Update your profile',
        'venues.title': 'My Venues',
        'venues.subtitle': 'Manage your venue listings',
        'venues.empty': 'No Venues Found',
        'venues.empty_all': "You haven't added any venues yet.",
        'venues.btn.view': 'View',
        'venues.btn.edit': 'Edit',
        'inquiries.title': 'Inquiries',
        'inquiries.subtitle': 'Manage customer inquiries for your venues',
        'inquiries.empty': 'No Inquiries',
        'inquiries.empty_all': "You haven't received any inquiries yet.",
        'inquiries.select': 'Select an Inquiry',
        'inquiries.select_desc': 'Click on an inquiry to view details',
        'inquiries.details.date': 'Event Date',
        'inquiries.details.guests': 'Guests',
        'inquiries.details.type': 'Event Type',
        'inquiries.details.phone': 'Phone',
        'inquiries.details.message': 'Message',
        'inquiries.btn.whatsapp': 'WhatsApp',
        'inquiries.btn.call': 'Call',
        'inquiries.btn.replied': 'Mark as Replied',
        'inquiries.btn.close': 'Close',
        'status.all': 'All',
        'status.approved': 'Approved',
        'status.pending': 'Pending',
        'status.rejected': 'Rejected',
        'status.draft': 'Draft',
        'status.published': 'Published',
        'status.new': 'New',
        'status.read': 'Read',
        'status.replied': 'Replied',
        'status.closed': 'Closed',
        'admin.title': 'Admin Panel',
        'admin.nav.dashboard': 'Dashboard',
        'admin.nav.venues': 'Venues',
        'admin.nav.users': 'Users',
        'admin.nav.inquiries': 'Inquiries',
        'admin.nav.settings': 'Settings',
        'admin.dashboard.title': 'Admin Dashboard',
        'admin.dashboard.subtitle': 'Monitor and manage your platform',
        'admin.status.pending': 'Pending',
        'admin.status.approved': 'Approved',
        'admin.status.rejected': 'Rejected',
        'admin.status.published': 'Published',
        'admin.status.active': 'Active',
        'admin.stats.pending_venues': 'Pending Venues',
        'admin.stats.active_venues': 'Active Venues',
        'admin.stats.pending_users': 'Pending Users',
        'admin.stats.active_users': 'Active Users',
        'admin.stats.review_now': 'Review now',
        'admin.stats.view_all': 'View all',
        'admin.stats.review': 'Review',
        'admin.stats.total': 'Total',
        'admin.actions.title': 'Quick Actions',
        'admin.actions.manage_venues': 'Manage Venues',
        'admin.actions.manage_venues_desc': 'Review and approve venues',
        'admin.actions.manage_users': 'Manage Users',
        'admin.actions.manage_users_desc': 'Review venue owners',
        'admin.actions.view_inquiries': 'View Inquiries',
        'admin.actions.view_inquiries_desc': 'Monitor customer requests',
        'admin.activity.title': 'Recent Activity',
        'admin.activity.empty': 'No recent activity',
        'admin.activity.empty_desc': 'Activity logs will appear here',
    },
    fr: {
        'nav.browse': 'Parcourir les lieux',
        'nav.how': 'Comment ça marche',
        'nav.owners': 'Pour les propriétaires',
        'nav.signin': 'Se connecter',
        'nav.list_venue': 'Ajouter votre lieu',
        'hero.title': 'Trouvez le lieu idéal pour votre événement',
        'hero.subtitle': 'La première place de marché pour les salles des fêtes et les lieux événementiels en Algérie.',
        'search.placeholder': 'Rechercher des lieux...',
        'search.location': 'Toutes les villes',
        'search.btn': 'Rechercher',
        'settings.title': 'Paramètres',
        'settings.desc': 'Gérer votre compte et votre profil',
        'settings.profile': 'Profil',
        'settings.save': 'Enregistrer',
        'settings.saving': 'Enregistrement...',
        'settings.upload': 'Changer la photo',
        'settings.uploading': 'Téléchargement...',
        'settings.email': 'Email',
        'settings.fullname': 'Nom complet',
        'settings.phone': 'Téléphone',
        'settings.businessname': 'Nom de l\'entreprise (Business)',
        'settings.businessdesc': 'Description de l\'entreprise',
        'settings.businessplaceholder': 'ex. Salle des Fêtes Alger',
        'dashboard.nav.home': 'Tableau de bord',
        'dashboard.nav.venues': 'Mes Lieux',
        'dashboard.nav.inquiries': 'Demandes',
        'dashboard.nav.settings': 'Paramètres',
        'dashboard.status.active': 'Actif',
        'dashboard.status.pending': 'En attente d\'approbation',
        'dashboard.status.pending_desc': 'Votre compte est en cours d\'examen.',
        'dashboard.status.review_time': 'Cela prend généralement 24 à 48 heures.',
        'dashboard.status.rejected': 'Compte rejeté',
        'dashboard.status.rejected_desc': 'Veuillez contacter le support.',
        'dashboard.header.signout': 'Se déconnecter',
        'dashboard.btn.add_venue': 'Ajouter un lieu',
        'dashboard.welcome.title': 'Bon retour',
        'dashboard.welcome.subtitle': 'Gérez vos lieux et suivez vos performances.',
        'dashboard.stats.total_venues': 'Total des lieux',
        'dashboard.stats.pending': 'En attente',
        'dashboard.stats.inquiries': 'Demandes',
        'dashboard.stats.views': 'Vues totales',
        'dashboard.actions.add_title': 'Ajouter un lieu',
        'dashboard.actions.add_desc': 'Listez votre lieu et atteignez des clients',
        'dashboard.actions.venues_title': 'Mes Lieux',
        'dashboard.actions.venues_desc': 'Voir et gérer vos annonces',
        'dashboard.actions.inquiries_title': 'Demandes',
        'dashboard.actions.inquiries_desc': 'Vérifier les messages des clients',
        'dashboard.actions.settings_title': 'Paramètres',
        'dashboard.actions.settings_desc': 'Mettre à jour votre profil',
        'venues.title': 'Mes Lieux',
        'venues.subtitle': 'Gérer vos annonces de lieux',
        'venues.empty': 'Aucun lieu trouvé',
        'venues.empty_all': "Vous n'avez pas encore ajouté de lieux.",
        'venues.btn.view': 'Voir',
        'venues.btn.edit': 'Modifier',
        'inquiries.title': 'Demandes',
        'inquiries.subtitle': 'Gérer les demandes clients pour vos lieux',
        'inquiries.empty': 'Aucune demande',
        'inquiries.empty_all': "Vous n'avez reçu aucune demande pour le moment.",
        'inquiries.select': 'Sélectionnez une demande',
        'inquiries.select_desc': 'Cliquez sur une demande pour voir les détails',
        'inquiries.details.date': 'Date événement',
        'inquiries.details.guests': 'Invités',
        'inquiries.details.type': 'Type événement',
        'inquiries.details.phone': 'Téléphone',
        'inquiries.details.message': 'Message',
        'inquiries.btn.whatsapp': 'WhatsApp',
        'inquiries.btn.call': 'Appeler',
        'inquiries.btn.replied': 'Marquer comme répondu',
        'inquiries.btn.close': 'Fermer',
        'status.all': 'Tout',
        'status.approved': 'Approuvé',
        'status.pending': 'En attente',
        'status.rejected': 'Rejeté',
        'status.draft': 'Brouillon',
        'status.published': 'Publié',
        'status.new': 'Nouveau',
        'status.read': 'Lu',
        'status.replied': 'Répondu',
        'status.closed': 'Fermé',
        'admin.title': 'Panneau d\'Administration',
        'admin.nav.dashboard': 'Tableau de Bord',
        'admin.nav.venues': 'Salles',
        'admin.nav.users': 'Utilisateurs',
        'admin.nav.inquiries': 'Demandes',
        'admin.nav.settings': 'Paramètres',
        'admin.dashboard.title': 'Tableau de Bord Admin',
        'admin.dashboard.subtitle': 'Surveillez et gérez votre plateforme',
        'admin.status.pending': 'En Attente',
        'admin.status.approved': 'Approuvé',
        'admin.status.rejected': 'Rejeté',
        'admin.status.published': 'Publié',
        'admin.status.active': 'Actif',
        'admin.stats.pending_venues': 'Salles en Attente',
        'admin.stats.active_venues': 'Salles Actives',
        'admin.stats.pending_users': 'Utilisateurs en Attente',
        'admin.stats.active_users': 'Utilisateurs Actifs',
        'admin.stats.review_now': 'Vérifier',
        'admin.stats.view_all': 'Voir tout',
        'admin.stats.review': 'Révision',
        'admin.stats.total': 'Total',
        'admin.actions.title': 'Actions Rapides',
        'admin.actions.manage_venues': 'Gérer les Salles',
        'admin.actions.manage_venues_desc': 'Examiner et approuver les salles',
        'admin.actions.manage_users': 'Gérer les Utilisateurs',
        'admin.actions.manage_users_desc': 'Vérifier les propriétaires de salles',
        'admin.actions.view_inquiries': 'Voir les Demandes',
        'admin.actions.view_inquiries_desc': 'Suivre les demandes clients',
        'admin.activity.title': 'Activité Récente',
        'admin.activity.empty': 'Aucune activité récente',
        'admin.activity.empty_desc': 'Les journaux d\'activité apparaîtront ici',
    },
    ar: {
        'nav.browse': 'تصفح القاعات',
        'nav.how': 'كيف يعمل',
        'nav.owners': 'لأصحاب القاعات',
        'nav.signin': 'تسجيل الدخول',
        'nav.list_venue': 'أضف قاعتك',
        'hero.title': 'اعثر على المكان المثالي لمناسبتك',
        'hero.subtitle': 'أكبر سوق لقاعات الأفراح والمناسبات في الجزائر.',
        'search.placeholder': 'ابحث عن قاعات...',
        'search.location': 'كل الولايات',
        'search.btn': 'بحث',
        'settings.title': 'الإعدادات',
        'settings.desc': 'إدارة حسابك وملفك الشخصي',
        'settings.profile': 'الملف الشخصي',
        'settings.save': 'حفظ التغييرات',
        'settings.saving': 'جاري الحفظ...',
        'settings.upload': 'تغيير الصورة',
        'settings.uploading': 'جاري التحميل...',
        'settings.email': 'البريد الإلكتروني',
        'settings.fullname': 'الاسم الكامل',
        'settings.phone': 'الهاتف',
        'settings.businessname': 'اسم العمل التجاري',
        'settings.businessdesc': 'وصف العمل',
        'settings.businessplaceholder': 'مثال: قاعة أفراح الجزائر',
        'dashboard.nav.home': 'لوحة القيادة',
        'dashboard.nav.venues': 'قاعاتي',
        'dashboard.nav.inquiries': 'الاستفسارات',
        'dashboard.nav.settings': 'الإعدادات',
        'dashboard.status.active': 'نشط',
        'dashboard.status.pending': 'بانتظار الموافقة',
        'dashboard.status.pending_desc': 'حسابك قيد المراجعة.',
        'dashboard.status.review_time': 'عادة ما يستغرق هذا 24-48 ساعة.',
        'dashboard.status.rejected': 'تم رفض الحساب',
        'dashboard.status.rejected_desc': 'يرجى الاتصال بالدعم.',
        'dashboard.header.signout': 'تسجيل الخروج',
        'dashboard.btn.add_venue': 'إضافة قاعة جديدة',
        'dashboard.welcome.title': 'مرحباً بعودتك',
        'dashboard.welcome.subtitle': 'أدر قاعاتك وتتبع أدائك.',
        'dashboard.stats.total_venues': 'إجمالي القاعات',
        'dashboard.stats.pending': 'بانتظار المراجعة',
        'dashboard.stats.inquiries': 'الاستفسارات',
        'dashboard.stats.views': 'إجمالي المشاهدات',
        'dashboard.actions.add_title': 'إضافة قاعة جديدة',
        'dashboard.actions.add_desc': 'اعرض قاعتك وتواصل مع العملاء',
        'dashboard.actions.venues_title': 'قاعاتي',
        'dashboard.actions.venues_desc': 'عرض وإدارة إعلاناتك',
        'dashboard.actions.inquiries_title': 'الاستفسارات',
        'dashboard.actions.inquiries_desc': 'تفقد رسائل العملاء',
        'dashboard.actions.settings_title': 'الإعدادات',
        'dashboard.actions.settings_desc': 'تحديث ملفك الشخصي',
        'venues.title': 'قاعاتي',
        'venues.subtitle': 'إدارة إعلانات القاعات الخاصة بك',
        'venues.empty': 'لم يتم العثور على قاعات',
        'venues.empty_all': "لم تقم بإضافة أي قاعات بعد.",
        'venues.btn.view': 'عرض',
        'venues.btn.edit': 'تعديل',
        'inquiries.title': 'الاستفسارات',
        'inquiries.subtitle': 'إدارة استفسارات العملاء لقاعاتك',
        'inquiries.empty': 'لا توجد استفسارات',
        'inquiries.empty_all': "لم تتلق أي استفسارات حتى الآن.",
        'inquiries.select': 'حدد استفساراً',
        'inquiries.select_desc': 'انقر على استفسار لعرض التفاصيل',
        'inquiries.details.date': 'تاريخ المناسبة',
        'inquiries.details.guests': 'الضيوف',
        'inquiries.details.type': 'نوع الفعالية',
        'inquiries.details.phone': 'الهاتف',
        'inquiries.details.message': 'الرسالة',
        'inquiries.btn.whatsapp': 'واتساب',
        'inquiries.btn.call': 'اتصال',
        'inquiries.btn.replied': 'تم الرد',
        'inquiries.btn.close': 'إغلاق',
        'status.all': 'الكل',
        'status.approved': 'مقبول',
        'status.pending': 'قيد الانتظار',
        'status.rejected': 'مرفوض',
        'status.draft': 'مسودة',
        'status.published': 'منشور',
        'status.new': 'جديد',
        'status.read': 'مقروء',
        'status.replied': 'تم الرد',
        'status.closed': 'مغلق',
        'admin.title': 'لوحة الإدارة',
        'admin.nav.dashboard': 'لوحة التحكم',
        'admin.nav.venues': 'القاعات',
        'admin.nav.users': 'المستخدمين',
        'admin.nav.inquiries': 'الطلبات',
        'admin.nav.settings': 'الإعدادات',
        'admin.dashboard.title': 'لوحة تحكم المشرف',
        'admin.dashboard.subtitle': 'راقب وأدر منصتك',
        'admin.status.pending': 'قيد الانتظار',
        'admin.status.approved': 'موافق عليه',
        'admin.status.rejected': 'مرفوض',
        'admin.status.published': 'منشور',
        'admin.status.active': 'نشط',
        'admin.stats.pending_venues': 'قاعات قيد الانتظار',
        'admin.stats.active_venues': 'قاعات نشطة',
        'admin.stats.pending_users': 'مستخدمين قيد الانتظار',
        'admin.stats.active_users': 'مستخدمين نشطين',
        'admin.stats.review_now': 'مراجعة الآن',
        'admin.stats.view_all': 'عرض الكل',
        'admin.stats.review': 'مراجعة',
        'admin.stats.total': 'إجمالي',
        'admin.actions.title': 'إجراءات سريعة',
        'admin.actions.manage_venues': 'إدارة القاعات',
        'admin.actions.manage_venues_desc': 'مراجعة والموافقة على القاعات',
        'admin.actions.manage_users': 'إدارة المستخدمين',
        'admin.actions.manage_users_desc': 'مراجعة أصحاب القاعات',
        'admin.actions.view_inquiries': 'عرض الطلبات',
        'admin.actions.view_inquiries_desc': 'متابعة طلبات العملاء',
        'admin.activity.title': 'النشاط الأخير',
        'admin.activity.empty': 'لا يوجد نشاط حديث',
        'admin.activity.empty_desc': 'ستظهر سجلات النشاط هنا',
    }
};


export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [language, setLanguageState] = useState<Language>(routing.defaultLocale);

    // Initialize language from localStorage and URL on mount
    useEffect(() => {
        // Get current pathname with locale from window location
        const fullPath = window.location.pathname;
        const localeMatch = fullPath.match(/^\/(en|fr|ar)(?:\/|$)/);
        const urlLocale = localeMatch?.[1] as Language | null;

        // Check localStorage for saved preference
        const savedLocale = localStorage.getItem('language') as Language | null;

        // Use URL locale first, then saved locale, then default
        const initialLocale = (urlLocale && routing.locales.includes(urlLocale))
            ? urlLocale
            : (savedLocale && routing.locales.includes(savedLocale) ? savedLocale : routing.defaultLocale);

        setLanguageState(initialLocale);
        document.documentElement.lang = initialLocale;
        document.documentElement.dir = initialLocale === 'ar' ? 'rtl' : 'ltr';

        // Save to localStorage
        localStorage.setItem('language', initialLocale);
    }, []);

    // Handle language change
    const handleSetLanguage = useCallback((lang: Language) => {
        // Preserve query params and anchors while swapping locales.
        const fullPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        // Use the utility function to properly create localized path
        // This ensures we don't get double locale prefixes
        const newPath = createLocalizedPath(fullPath, lang);

        // Optimistically update state
        setLanguageState(lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem('language', lang);

        // IMPORTANT: Use window.location.href for hard navigation
        // next-intl's router automatically adds locale prefix which causes double locales like /ar/fr/dashboard
        // Hard navigation ensures clean state and proper locale handling
        window.location.href = newPath;
    }, []);

    const t = useCallback((key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage: handleSetLanguage,
            dir: language === 'ar' ? 'rtl' : 'ltr',
            t
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};
