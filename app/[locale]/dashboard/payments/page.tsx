import { redirect } from 'next/navigation';

interface PaymentsPageProps {
    params: Promise<{ locale: string }>;
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
    const { locale } = await params;
    redirect(`/${locale}/dashboard/settings`);
}
