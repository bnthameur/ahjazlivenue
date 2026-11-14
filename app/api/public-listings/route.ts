import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListingCategory } from "@/lib/listing-types";

/**
 * Public, account-free listing requests from the marketing site (ahjazlilanding /services/demande).
 *
 * Job seekers, DJs / camera crews, extra services and rentals fill one form; the listing is
 * stored in `venues` with status "pending" and owned by the platform admin, so it only goes
 * live once an admin approves it from /admin/venues.
 *
 *   POST { action: "upload", files: [{ name, type, size }] }  -> signed upload URLs (venue-images bucket)
 *   POST { action: "submit", ...fields }                      -> creates the pending listing
 */

export const dynamic = "force-dynamic";

const BUCKET = "venue-images";
const PREFIX = "public-requests";
const MAX_FILES = 10;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const DOC_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

const ALLOWED_ORIGINS = new Set([
    "https://ahjazliqaati.com",
    "https://www.ahjazliqaati.com",
    "http://localhost:3000",
    "http://localhost:3001",
]);

function corsHeaders(origin: string | null): Record<string, string> {
    const allowed = origin && (ALLOWED_ORIGINS.has(origin) || /^https:\/\/ahjazli-landing[a-z0-9-]*\.vercel\.app$/.test(origin));
    return {
        "Access-Control-Allow-Origin": allowed ? origin! : "https://ahjazliqaati.com",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin",
    };
}

function json(body: unknown, status: number, origin: string | null) {
    return NextResponse.json(body, { status, headers: corsHeaders(origin) });
}

// ── Simple in-memory rate limit (per IP, per instance) ─────────────────────────
const hits = new Map<string, number[]>();
function rateLimited(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    list.push(now);
    hits.set(key, list);
    if (hits.size > 5000) hits.clear();
    return list.length > max;
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const safeUrl = (v: unknown) => {
    const s = str(v, 500);
    if (!s) return null;
    try {
        const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
        return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
    } catch {
        return null;
    }
};

const slugify = (text: string) =>
    text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

/** Accepts "36.75,3.05" or any Google Maps URL that carries coordinates. */
function parseCoords(input: string): { lat: number; lng: number } | null {
    const m = input.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/) || input.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (!m) return null;
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat, lng };
}

async function getPlatformOwnerId(supabase: ReturnType<typeof createAdminClient>) {
    if (process.env.PUBLIC_LISTINGS_OWNER_ID) return process.env.PUBLIC_LISTINGS_OWNER_ID;
    const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
    return data?.id as string | undefined;
}

export async function OPTIONS(request: Request) {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: Request) {
    const origin = request.headers.get("origin");
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return json({ error: "invalid_json" }, 400, origin);
    }

    const supabase = createAdminClient();

    // ── Step 1: signed upload URLs ──────────────────────────────────────────
    if (body.action === "upload") {
        if (rateLimited(`up:${ip}`, 20, 10 * 60 * 1000)) return json({ error: "rate_limited" }, 429, origin);

        const files = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES) : [];
        if (files.length === 0) return json({ error: "no_files" }, 400, origin);

        const batch = randomUUID();
        const uploads = [];
        for (let i = 0; i < files.length; i++) {
            const f = files[i] as { name?: unknown; type?: unknown; size?: unknown };
            const type = str(f.type, 100);
            const size = Number(f.size) || 0;
            const isImage = type.startsWith("image/");
            const isDoc = DOC_TYPES.includes(type);
            if (!isImage && !isDoc) return json({ error: "file_type" }, 400, origin);
            if (size <= 0 || size > (isImage ? MAX_IMAGE_BYTES : MAX_DOC_BYTES)) return json({ error: "file_size" }, 400, origin);

            const ext = (str(f.name, 120).split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || (isImage ? "jpg" : "pdf");
            const path = `${PREFIX}/${batch}/${i}-${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
            if (error || !data) return json({ error: "upload_init_failed" }, 500, origin);
            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
            uploads.push({ path, token: data.token, publicUrl: pub.publicUrl });
        }
        return json({ uploads }, 200, origin);
    }

    // ── Step 2: create the pending listing ──────────────────────────────────
    if (body.action !== "submit") return json({ error: "unknown_action" }, 400, origin);
    if (str(body.website_confirm)) return json({ ok: true }, 200, origin); // honeypot: silently drop bots
    if (rateLimited(`sub:${ip}`, 5, 60 * 60 * 1000)) return json({ error: "rate_limited" }, 429, origin);

    const category = getListingCategory(str(body.category, 60));
    if (!category || category.group === "venue") return json({ error: "category" }, 400, origin);

    const name = str(body.name, 120);
    const description = str(body.description, 3000);
    const phone = str(body.phone, 30).replace(/[^\d+ ]/g, "");
    const wilaya = str(body.wilaya, 60);
    const city = str(body.city, 80);
    if (name.length < 2 || description.length < 10 || phone.replace(/\D/g, "").length < 9 || !wilaya) {
        return json({ error: "missing_fields" }, 400, origin);
    }

    // Only accept files we handed out signed URLs for
    const publicBase = supabase.storage.from(BUCKET).getPublicUrl(`${PREFIX}/`).data.publicUrl;
    const ownFile = (v: unknown) => {
        const s = str(v, 600);
        return s.startsWith(publicBase) ? s : null;
    };
    const photo = ownFile(body.photo);
    const gallery = (Array.isArray(body.gallery) ? body.gallery : []).map(ownFile).filter(Boolean).slice(0, MAX_FILES) as string[];
    const cvUrl = ownFile(body.cv);

    // Job seekers and DJs / camera crews must show who they are
    const needsPhoto = category.group === "job" || category.group === "artist";
    if (needsPhoto && !photo) return json({ error: "photo_required" }, 400, origin);
    if (category.group === "artist" && gallery.length === 0 && !safeUrl(body.portfolio_url)) {
        return json({ error: "portfolio_required" }, 400, origin);
    }
    if ((category.group === "rental" || category.group === "service") && !photo && gallery.length === 0) {
        return json({ error: "photo_required" }, 400, origin);
    }

    const ownerId = await getPlatformOwnerId(supabase);
    if (!ownerId) return json({ error: "server_config" }, 500, origin);

    const coords = parseCoords(str(body.maps, 600));
    const price = Number(str(body.price, 20).replace(/[^\d.]/g, "")) || 0;
    const whatsapp = str(body.whatsapp, 30).replace(/\D/g, "") || null;
    const slug = `${slugify(name) || category.id}-${randomUUID().slice(0, 6)}`;
    const images = [photo, ...gallery].filter(Boolean) as string[];

    const { data: venue, error } = await supabase
        .from("venues")
        .insert({
            owner_id: ownerId,
            slug,
            name,
            title: name,
            description,
            category: category.id,
            location: wilaya,
            wilaya,
            city: city || null,
            address: str(body.address, 300) || null,
            latitude: coords?.lat ?? null,
            longitude: coords?.lng ?? null,
            capacity: 0,
            capacity_min: 0,
            capacity_max: 0,
            price,
            price_min: price,
            price_max: price,
            phone,
            whatsapp,
            // CV for job seekers, otherwise the portfolio / shop link
            website: cvUrl || safeUrl(body.portfolio_url),
            instagram_url: safeUrl(body.instagram_url),
            facebook_url: safeUrl(body.facebook_url),
            tiktok_url: safeUrl(body.tiktok_url),
            amenities: [],
            offers: [],
            images,
            status: "pending",
        })
        .select("id")
        .single();

    if (error || !venue) {
        console.error("public listing insert failed", error);
        return json({ error: "insert_failed" }, 500, origin);
    }

    // Tell every admin there is something to review
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    if (admins?.length) {
        await supabase.from("notifications").insert(
            admins.map((a: { id: string }) => ({
                recipient_id: a.id,
                title: "طلب جديد من الموقع",
                message: `${category.label.ar} — ${name} (${phone}). Demande à valider dans Annonces.`,
                type: "info",
            }))
        );
    }

    return json({ ok: true, id: venue.id }, 200, origin);
}
