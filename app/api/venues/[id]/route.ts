import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Determine if id is UUID
    const isUuid = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    let query = supabase
        .from("venues")
        .select(`
      *,
      locations (name),
      venue_categories (name),
      venue_media (*)
    `);

    if (isUuid) {
        query = query.eq("id", id);
    } else {
        query = query.eq("slug", id);
    }

    const { data, error } = await query.single();

    if (error) {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Auth check implicit via RLS, but let's be sure user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const json = await request.json();

        // Whitelist allowed fields to update
        // (Don't allow updating owner_id, id, created_at, etc.)
        const allowedFields = [
            'name', 'description', 'category_id', 'location_id', 'address',
            'capacity_min', 'capacity_max', 'price_range_min', 'price_range_max',
            'phone', 'whatsapp', 'email', 'website',
            'facebook_url', 'instagram_url', 'tiktok_url',
            'amenities'
        ];

        // Filter updates
        const updates: any = {};
        for (const key of allowedFields) {
            if (json[key] !== undefined) updates[key] = json[key];
        }

        // Set status to pending on update? Or keep approved?
        // Often, major updates require re-approval. For now, let's keep it simple.
        // Optionally: updates.status = 'pending';

        const { data, error } = await supabase
            .from("venues")
            .update(updates)
            .eq("id", id)
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
        .from("venues")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
