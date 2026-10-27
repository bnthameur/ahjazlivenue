import NewVenueForm from '@/components/venue-forms/NewVenueForm';

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminNewVenueForUserPage({ params }: PageProps) {
    const { id } = await params;
    return <NewVenueForm adminOwnerId={id} />;
}
