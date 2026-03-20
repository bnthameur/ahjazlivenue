import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Start building the query
    let query = supabase
        .from("venues")
        .select(
            `
      *,
      locations (name),
      venue_categories (name),
      venue_media (url, is_cover)
    `,
            { count: "exact" }
        )
        .eq("status", "approved");

    // Apply filters
    if (category && category !== "all") {
        // Determine if it's a UUID or name. For simplicity assume name filtering via join if possible, 
        // but standard supabase filtering on joined tables applies.
        // Easier usually to filter by ID if frontend sends ID, or filter on joined table.
        // Let's assume frontend sends category_id or we filter by category name.
        // If param is a UUID:
        if (category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            query = query.eq("category_id", category);
        } else {
            // Filter by joined category name (requires embedding filtering syntax or separate query)
            // !inner join trick for filtering on foreign table:
            // venue_categories!inner(name)
            // For now, let's assume the frontend sends the Category ID or Slug.
            // If simply a string like 'Wedding Hall', we might need to look it up or join.
            // Let's try simple text match on joined column if possible (not modifying select structure easily).
            // Best practice: Frontend sends IDs. 
            // Fallback: If "wedding-hall" slug style, match partial?
        }
    }

    if (location && location !== "all") {
        // Similar logic for location.
        if (location.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            query = query.eq("location_id", location);
        } else {
            // If it's a city name like "Algiers"
            // We can use the text search on location column if we had one joined?
            // Or locations!inner(name)
        }
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (minPrice) {
        query = query.gte("price_range_min", minPrice);
    }

    if (maxPrice) {
        query = query.lte("price_range_max", maxPrice);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Execute
    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
}

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check auth
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check profile roles and status
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "venue_owner") {
        return NextResponse.json({ error: "Only venue owners can create venues" }, { status: 403 });
    }

    if (profile.status !== "active") {
        return NextResponse.json({ error: "Your account is not approved yet" }, { status: 403 });
    }

    // --- Subscription & plan limit enforcement (anti-hack) ---
    const { data: subscriptionData } = await supabase
        .from("user_subscriptions")
        .select(`
            id, status, expires_at,
            subscription_plans (
                id, max_venues, max_images_per_venue, max_videos_per_venue
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    // Check active subscription
    const subStatus = (subscriptionData?.status || "").toLowerCase();
    const isActiveSubscription = ["active", "trial"].includes(subStatus);
    const expiresAt = subscriptionData?.expires_at ? new Date(subscriptionData.expires_at) : null;
    const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

    if (!subscriptionData || !isActiveSubscription || isExpired) {
        return NextResponse.json(
            { error: "Active subscription required. Please subscribe to a plan first." },
            { status: 402 }
        );
    }

    // Check venue count limit
    const plan = Array.isArray(subscriptionData.subscription_plans)
        ? subscriptionData.subscription_plans[0]
        : subscriptionData.subscription_plans;
    const maxVenues = plan?.max_venues ?? 1;

    const { count: venueCount } = await supabase
        .from("venues")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", user.id);

    if ((venueCount || 0) >= maxVenues) {
        return NextResponse.json(
            { error: `Venue limit reached. Your plan allows ${maxVenues} venue(s).` },
            { status: 403 }
        );
    }

    // Check image count limit
    const maxImages = plan?.max_images_per_venue ?? 5;
    const maxVideos = plan?.max_videos_per_venue ?? 0;

    try {
        const json = await request.json();

        // Validate required fields
        if (!json.name || !json.description || !json.phone) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Enforce image limit on creation
        const submittedImages = Array.isArray(json.images) ? json.images : [];
        if (submittedImages.length > maxImages) {
            return NextResponse.json(
                { error: `Your plan allows up to ${maxImages} images per venue. You submitted ${submittedImages.length}.` },
                { status: 403 }
            );
        }

        // Prepare insert data
        const venueData = {
            ...json,
            images: submittedImages.slice(0, maxImages), // Extra safety: trim to limit
            owner_id: user.id,
            status: "pending", // Always pending initially
        };

        // Insert
        const { data, error } = await supabase
            .from("venues")
            .insert(venueData)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (err) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
