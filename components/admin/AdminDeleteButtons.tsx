'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { deleteUser, deleteVenue } from '@/app/[locale]/admin/actions';

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
    const t = useTranslations('Listings');
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const onClick = () => {
        if (!window.confirm(t('confirm_delete_user', { name }))) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteUser(userId);
            if (result.error) {
                setError(result.error);
                return;
            }
            router.push('/admin/users');
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={onClick}
                disabled={pending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                🗑️ {pending ? t('deleting') : t('delete_user')}
            </button>
            {error && <p className="text-xs text-red-600 max-w-xs text-end">{error}</p>}
        </div>
    );
}

export function DeleteVenueButton({ venueId, name, redirectTo }: { venueId: string; name: string; redirectTo?: string }) {
    const t = useTranslations('Listings');
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    const onClick = () => {
        if (!window.confirm(t('confirm_delete_listing', { name }))) return;
        startTransition(async () => {
            const formData = new FormData();
            formData.set('venueId', venueId);
            const result = await deleteVenue(formData);
            if (result.error) {
                window.alert(result.error);
                return;
            }
            if (redirectTo) router.push(redirectTo);
            router.refresh();
        });
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className="text-xs text-red-600 hover:text-red-800 disabled:text-red-300 font-medium"
        >
            {pending ? t('deleting') : t('delete')}
        </button>
    );
}
