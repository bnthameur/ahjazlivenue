import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from '@/i18n/navigation';
import { notFound } from "next/navigation";
import { MapPin, Users, Coins, ArrowLeft } from "lucide-react";
import VenueBookingCard from "@/components/VenueBookingCard";
import { getWilayaLabel } from "@/lib/wilayas";

export default async function VenueDetailsPage(props: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const params = await props.params;
    const { id } = params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const t = await getTranslations('VenueDetails');
    const tCommon = await getTranslations();

    const { data: venue, error } = await supabase
        .from("venues")
        .select("*, profiles (full_name, phone, email)")
        .eq("id", id)
        .single();

    if (error || !venue) {
        notFound();
    }

    const wilayaLabel = getWilayaLabel(tCommon, venue.wilaya || venue.location);
    const locationLabel = [venue.city, wilayaLabel || venue.location].filter(Boolean).join(", ");
    const contactPhone = venue.phone || venue.profiles?.phone || null;
    const contactEmail = venue.contact_email || venue.profiles?.email || null;
    const contactWhatsapp = venue.whatsapp || null;

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header Image / Hero */}
            <div className="relative h-[40vh] sm:h-[50vh] bg-slate-900 w-full">
                {venue.images && venue.images.length > 0 ? (
                    <Image
                        src={venue.images[0]}
                        alt={venue.title}
                        fill
                        className="object-cover opacity-90"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/30 text-4xl">
                        🏛️
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                <div className="absolute top-6 left-0 w-full z-10">
                    <div className="container mx-auto px-4">
                        <Link
                            href={'/salles'}
                            className="inline-flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            {t('back_to_list')}
                        </Link>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full pb-8 sm:pb-12 text-white">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-primary-300 font-medium mb-2">
                                    <MapPin className="w-5 h-5" />
                                    {locationLabel || venue.location}
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{venue.title}</h1>
                                <div className="flex flex-wrap gap-4 text-sm sm:text-base">
                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
                                        <Users className="w-4 h-4 text-primary-300" />
                                        {venue.capacity} Guests
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur">
                                        <Coins className="w-4 h-4 text-primary-300" />
                                        {venue.price} DZD
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-10">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery Grid (if more than 1 image) */}
                        {venue.images && venue.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 sm:gap-4">
                                {venue.images.slice(0, 4).map((img: string, i: number) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                                        <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">{t('description_label')}</h2>
                            <div className="prose prose-slate max-w-none text-slate-600">
                                <p>{venue.description}</p>
                            </div>
                        </div>

                        {venue.amenities && venue.amenities.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                                <h2 className="text-xl font-bold text-slate-900 mb-4">{t('features_label')}</h2>
                                <div className="flex flex-wrap gap-2">
                                    {venue.amenities.map((amenity: string) => (
                                        <span
                                            key={amenity}
                                            className="px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700"
                                        >
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            <VenueBookingCard
                                venueId={venue.id}
                                venueTitle={venue.title}
                                city={venue.city}
                                wilaya={venue.wilaya}
                                location={venue.location}
                                capacity={venue.capacity}
                                price={venue.price}
                                phone={contactPhone}
                                whatsapp={contactWhatsapp}
                                contactEmail={contactEmail}
                            />

                            {/* Owner Info (Optional, minimal) */}
                            {/* <div className="bg-white rounded-2xl border border-slate-200 p-6">...</div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
