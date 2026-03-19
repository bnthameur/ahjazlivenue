export interface SubscriptionPlanSummary {
    id: string;
    name: string | null;
    name_ar?: string | null;
    price_monthly?: number | null;
    price_yearly?: number | null;
    duration_months?: number | null;
    max_venues?: number | null;
    max_images_per_venue?: number | null;
    max_videos_per_venue?: number | null;
}

export interface UserSubscriptionSummary {
    id?: string;
    status?: string | null;
    started_at?: string | null;
    expires_at?: string | null;
    created_at?: string | null;
    subscription_plans?: SubscriptionPlanSummary | null;
}

interface RawUserSubscriptionSummary {
    id?: string;
    status?: string | null;
    started_at?: string | null;
    expires_at?: string | null;
    created_at?: string | null;
    subscription_plans?: SubscriptionPlanSummary | SubscriptionPlanSummary[] | null;
}

export function normalizeSubscriptionSummary(
    subscription: RawUserSubscriptionSummary | null | undefined
): UserSubscriptionSummary | null {
    if (!subscription) return null;

    const plan = Array.isArray(subscription.subscription_plans)
        ? subscription.subscription_plans[0] || null
        : subscription.subscription_plans || null;

    return {
        id: subscription.id,
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        created_at: subscription.created_at,
        subscription_plans: plan,
    };
}

export function parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntil(value?: string | null): number | null {
    const date = parseDate(value);
    if (!date) return null;

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function hasActiveOwnerSubscription(subscription: UserSubscriptionSummary | null | undefined): boolean {
    if (!subscription) return false;
    const status = (subscription.status || '').toLowerCase();
    if (!['active', 'trial'].includes(status)) return false;

    const remainingDays = daysUntil(subscription.expires_at);
    return remainingDays === null || remainingDays >= 0;
}

export interface PlanLimits {
    maxVenues: number;
    maxImagesPerVenue: number;
    maxVideosPerVenue: number;
    isActive: boolean;
}

const DEFAULT_LIMITS: PlanLimits = {
    maxVenues: 1,
    maxImagesPerVenue: 5,
    maxVideosPerVenue: 0,
    isActive: false,
};

export function getPlanLimits(subscription: UserSubscriptionSummary | null | undefined): PlanLimits {
    if (!subscription || !hasActiveOwnerSubscription(subscription)) {
        return DEFAULT_LIMITS;
    }

    const plan = subscription.subscription_plans;
    return {
        maxVenues: plan?.max_venues ?? 1,
        maxImagesPerVenue: plan?.max_images_per_venue ?? 5,
        maxVideosPerVenue: plan?.max_videos_per_venue ?? 0,
        isActive: true,
    };
}

export function getSubscriptionBanner(subscription: UserSubscriptionSummary | null | undefined) {
    if (!subscription) {
        return {
            tone: 'warning' as const,
            title: 'Choose a pack to activate your owner account',
            description: 'Complete your profile and choose a pack before you start receiving bookings and managing paid venue access.',
        };
    }

    const remainingDays = daysUntil(subscription.expires_at);
    const status = (subscription.status || '').toLowerCase();

    if (remainingDays !== null && remainingDays < 0) {
        return {
            tone: 'error' as const,
            title: 'Your subscription has expired',
            description: 'Renew your pack to keep your venue-owner account fully active and avoid interruptions.',
        };
    }

    if (remainingDays !== null && remainingDays <= 10) {
        return {
            tone: 'warning' as const,
            title: `Your subscription ends in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`,
            description: 'Renew early to avoid losing access to paid owner features.',
        };
    }

    if (status && !['active', 'trial'].includes(status)) {
        return {
            tone: 'warning' as const,
            title: 'Your subscription is awaiting activation',
            description: 'Submit your payment receipt or complete online payment so the admin team can activate your pack.',
        };
    }

    return null;
}
