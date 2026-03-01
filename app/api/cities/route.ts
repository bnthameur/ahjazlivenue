import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const wilayaCode = searchParams.get("wilaya_code");

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase
        .from("cities")
        .select("id, commune_name, daira_name, wilaya_code, wilaya_name")
        .order("commune_name", { ascending: true });

    if (wilayaCode) {
        const code = parseInt(wilayaCode, 10);
        if (!Number.isNaN(code)) {
            query = query.eq("wilaya_code", code);
        }
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
