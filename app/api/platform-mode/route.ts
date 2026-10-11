import { NextResponse } from "next/server";
import { getPlatformFreeMode } from "@/lib/platform-mode-server";

// Public, read-only: lets the marketing site (ahjazlilanding) show free pricing while free mode is on.
export const dynamic = "force-dynamic";

export async function GET() {
    const freeMode = await getPlatformFreeMode();

    return NextResponse.json(
        { freeMode },
        {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        }
    );
}
