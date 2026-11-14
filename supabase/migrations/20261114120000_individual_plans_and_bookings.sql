-- 1) Plans can target venue owners or individual providers (job seekers, DJs, services, rentals)
ALTER TABLE public.subscription_plans
    ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'venue';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscription_plans_audience_check') THEN
        ALTER TABLE public.subscription_plans
            ADD CONSTRAINT subscription_plans_audience_check CHECK (audience IN ('venue', 'individual'));
    END IF;
END $$;

-- 2) Individual requests (public form) carry their chosen plan, payment proof and an expiry
ALTER TABLE public.venues
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS listing_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS submitted_via TEXT;

-- 3) Venue calendar: owner-blocked days and client booking requests
CREATE TABLE IF NOT EXISTS public.venue_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'declined', 'blocked', 'cancelled')),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    guests INT,
    event_type TEXT,
    message TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS venue_bookings_venue_date_idx ON public.venue_bookings (venue_id, event_date);

-- A day can only be taken once (confirmed booking or owner block)
CREATE UNIQUE INDEX IF NOT EXISTS venue_bookings_one_busy_per_day
    ON public.venue_bookings (venue_id, event_date)
    WHERE status IN ('confirmed', 'blocked');

ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage bookings of their venues" ON public.venue_bookings;
CREATE POLICY "Owners manage bookings of their venues" ON public.venue_bookings
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.venues v WHERE v.id = venue_id AND v.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage all bookings" ON public.venue_bookings;
CREATE POLICY "Admins manage all bookings" ON public.venue_bookings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Public: which days are taken (no customer data exposed)
CREATE OR REPLACE FUNCTION public.get_venue_busy_dates(p_venue_id UUID, p_from DATE, p_to DATE)
RETURNS TABLE (event_date DATE)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT b.event_date
    FROM public.venue_bookings b
    JOIN public.venues v ON v.id = b.venue_id
    WHERE b.venue_id = p_venue_id
      AND v.status = 'published'
      AND b.status IN ('confirmed', 'blocked')
      AND b.event_date BETWEEN p_from AND LEAST(p_to, p_from + 400)
    ORDER BY 1;
$$;

-- Public: ask for a date. Validates, stores a pending request, notifies the owner.
CREATE OR REPLACE FUNCTION public.request_venue_booking(
    p_venue_id UUID,
    p_date DATE,
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT DEFAULT NULL,
    p_guests INT DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_owner UUID;
    v_title TEXT;
    v_id UUID;
    v_phone TEXT := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
BEGIN
    SELECT owner_id, coalesce(title, name) INTO v_owner, v_title
    FROM public.venues WHERE id = p_venue_id AND status = 'published';
    IF v_owner IS NULL THEN RAISE EXCEPTION 'venue_not_found'; END IF;

    IF p_date IS NULL OR p_date < CURRENT_DATE OR p_date > CURRENT_DATE + 730 THEN RAISE EXCEPTION 'invalid_date'; END IF;
    IF length(trim(coalesce(p_name, ''))) < 2 OR length(p_name) > 120 THEN RAISE EXCEPTION 'invalid_name'; END IF;
    IF length(regexp_replace(v_phone, '\D', '', 'g')) < 9 OR length(v_phone) > 20 THEN RAISE EXCEPTION 'invalid_phone'; END IF;

    IF EXISTS (SELECT 1 FROM public.venue_bookings
               WHERE venue_id = p_venue_id AND event_date = p_date AND status IN ('confirmed', 'blocked')) THEN
        RAISE EXCEPTION 'date_unavailable';
    END IF;

    -- Anti-spam: one open request per phone per day per venue, max 5 per phone per hour overall
    IF EXISTS (SELECT 1 FROM public.venue_bookings
               WHERE venue_id = p_venue_id AND event_date = p_date AND customer_phone = v_phone AND status = 'pending') THEN
        RAISE EXCEPTION 'already_requested';
    END IF;
    IF (SELECT count(*) FROM public.venue_bookings
        WHERE customer_phone = v_phone AND created_at > NOW() - INTERVAL '1 hour') >= 5 THEN
        RAISE EXCEPTION 'rate_limited';
    END IF;

    INSERT INTO public.venue_bookings (venue_id, event_date, status, customer_name, customer_phone, customer_email, guests, event_type, message)
    VALUES (
        p_venue_id, p_date, 'pending', trim(p_name), v_phone,
        nullif(left(trim(coalesce(p_email, '')), 200), ''),
        CASE WHEN p_guests BETWEEN 1 AND 100000 THEN p_guests END,
        nullif(left(trim(coalesce(p_event_type, '')), 60), ''),
        nullif(left(trim(coalesce(p_message, '')), 2000), '')
    )
    RETURNING id INTO v_id;

    INSERT INTO public.notifications (recipient_id, title, message, type)
    VALUES (
        v_owner,
        'طلب حجز جديد',
        format('%s — %s : %s (%s). Demande de réservation à confirmer dans Calendrier.', v_title, to_char(p_date, 'DD/MM/YYYY'), trim(p_name), v_phone),
        'info'
    );

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_venue_busy_dates(UUID, DATE, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_venue_booking(UUID, DATE, TEXT, TEXT, TEXT, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_venue_busy_dates(UUID, DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_venue_booking(UUID, DATE, TEXT, TEXT, TEXT, INT, TEXT, TEXT) TO anon, authenticated;
