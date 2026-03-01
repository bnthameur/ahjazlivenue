import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import VenuesMarketplace from "@/components/VenuesMarketplace";

export default async function VenuesPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const params = await props.params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: venues, error } = await supabase
        .from("venues")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching venues:", error);
    }

    return <VenuesMarketplace venues={venues || []} />;
}
