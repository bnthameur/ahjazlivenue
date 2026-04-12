-- =====================================================
-- Event Venue Marketplace - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- ===========================================
-- 1. PROFILES (extends auth.users with roles)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('user', 'owner', 'admin')) DEFAULT 'owner',
    approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    business_name TEXT,
    business_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 2. LOCATIONS (Wilayas of Algeria)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    wilaya_code INT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. VENUE CATEGORIES
-- ===========================================
CREATE TABLE IF NOT EXISTS public.venue_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 4. VENUES (Main listing table)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.venue_categories(id),
    location_id UUID REFERENCES public.locations(id),
    address TEXT,
    
    -- Capacity & Pricing
    capacity_min INT,
    capacity_max INT,
    price_range_min DECIMAL(12,2),
    price_range_max DECIMAL(12,2),
    currency TEXT DEFAULT 'DZD',
    
    -- Contact Information
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    
    -- Social Media Links
    facebook_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    
    -- Features/Amenities (JSON array)
    amenities JSONB DEFAULT '[]'::jsonb,
    
    -- Status & Approval
    status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')) DEFAULT 'pending',
    rejection_reason TEXT,
    
    -- Stats
    views_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- ===========================================
-- 5. VENUE MEDIA (Images & Videos)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.venue_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    
    media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    display_order INT DEFAULT 0,
    is_cover BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 6. CONTACT INQUIRIES
-- ===========================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Info
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- Inquiry Details
    event_date DATE,
    event_type TEXT,
    guest_count INT,
    message TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('new', 'read', 'replied', 'closed')) DEFAULT 'new',
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 7. SUBSCRIPTION PLANS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    name_ar TEXT,
    name_fr TEXT,
    price_monthly DECIMAL(12,2),
    price_yearly DECIMAL(12,2),
    duration_months INT DEFAULT 1,
    max_venues INT DEFAULT 1,
    max_images_per_venue INT DEFAULT 5,
    max_videos_per_venue INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 8. USER SUBSCRIPTIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'trial')) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 9. PAYMENT RECEIPTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receipt_url TEXT,
    payment_method TEXT,
    amount DECIMAL(12,2),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 10. PLATFORM SETTINGS (key-value config)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 11. ADMIN ACTIVITY LOGS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'user', 'venue'
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_venues_owner ON public.venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_status ON public.venues(status);
CREATE INDEX IF NOT EXISTS idx_venues_category ON public.venues(category_id);
CREATE INDEX IF NOT EXISTS idx_venues_location ON public.venues(location_id);
CREATE INDEX IF NOT EXISTS idx_venue_media_venue ON public.venue_media(venue_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_venue ON public.contact_inquiries(venue_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_owner ON public.contact_inquiries(owner_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_user ON public.payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_status ON public.payment_receipts(status);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES: PROFILES
-- ===========================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert own profile (on signup)
CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin can update all profiles (for approval)
CREATE POLICY "Admin can update all profiles" ON public.profiles 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: LOCATIONS & CATEGORIES (Public read)
-- ===========================================
CREATE POLICY "Anyone can view locations" ON public.locations 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view categories" ON public.venue_categories 
    FOR SELECT USING (is_active = true);

-- Admin can manage locations/categories
CREATE POLICY "Admin can manage locations" ON public.locations 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can manage categories" ON public.venue_categories 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: VENUES
-- ===========================================
-- Public can view approved venues
CREATE POLICY "Public can view approved venues" ON public.venues 
    FOR SELECT USING (status = 'approved');

-- Owners can view their own venues
CREATE POLICY "Owners can view own venues" ON public.venues 
    FOR SELECT USING (auth.uid() = owner_id);

-- Owners can create venues (if approved)
CREATE POLICY "Owners can create venues" ON public.venues 
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approval_status = 'approved')
    );

-- Owners can update own venues
CREATE POLICY "Owners can update own venues" ON public.venues 
    FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete own venues
CREATE POLICY "Owners can delete own venues" ON public.venues 
    FOR DELETE USING (auth.uid() = owner_id);

-- Admin can view all venues
CREATE POLICY "Admin can view all venues" ON public.venues 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin can update all venues (for approval)
CREATE POLICY "Admin can update all venues" ON public.venues 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: VENUE MEDIA
-- ===========================================
-- Public can view media for approved venues
CREATE POLICY "Public can view approved venue media" ON public.venue_media 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.venues WHERE venues.id = venue_id AND venues.status = 'approved')
    );

-- Owners can manage media for their venues
CREATE POLICY "Owners can manage own venue media" ON public.venue_media 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.venues WHERE venues.id = venue_id AND venues.owner_id = auth.uid())
    );

-- ===========================================
-- RLS POLICIES: CONTACT INQUIRIES
-- ===========================================
-- Owners can view inquiries for their venues
CREATE POLICY "Owners can view own inquiries" ON public.contact_inquiries 
    FOR SELECT USING (auth.uid() = owner_id);

-- Owners can update inquiry status
CREATE POLICY "Owners can update own inquiries" ON public.contact_inquiries 
    FOR UPDATE USING (auth.uid() = owner_id);

-- Public can create inquiries
CREATE POLICY "Public can create inquiries" ON public.contact_inquiries 
    FOR INSERT WITH CHECK (true);

-- ===========================================
-- RLS POLICIES: ADMIN LOGS
-- ===========================================
CREATE POLICY "Admin can view logs" ON public.admin_logs 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can create logs" ON public.admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: SUBSCRIPTION PLANS
-- ===========================================
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage plans" ON public.subscription_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: USER SUBSCRIPTIONS
-- ===========================================
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all subscriptions" ON public.user_subscriptions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can manage subscriptions" ON public.user_subscriptions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: PAYMENT RECEIPTS
-- ===========================================
CREATE POLICY "Users can view own receipts" ON public.payment_receipts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts" ON public.payment_receipts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all receipts" ON public.payment_receipts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admin can update receipts" ON public.payment_receipts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- RLS POLICIES: PLATFORM SETTINGS
-- ===========================================
CREATE POLICY "Authenticated users can read settings" ON public.platform_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, approval_status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
        'pending'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.contact_inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate slug function
CREATE OR REPLACE FUNCTION generate_venue_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM public.venues WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_venue_slug_insert
    BEFORE INSERT ON public.venues
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION generate_venue_slug();

CREATE TRIGGER generate_venue_slug_update
    BEFORE UPDATE OF name ON public.venues
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name)
    EXECUTE FUNCTION generate_venue_slug();

-- ===========================================
-- SEED DATA: VENUE CATEGORIES
-- ===========================================
INSERT INTO public.venue_categories (name, name_ar, icon, description)
VALUES 
    ('Wedding Hall', 'قاعة الأفراح', '💒', 'Elegant halls for wedding ceremonies and receptions'),
    ('Event Salon', 'صالون المناسبات', '🎉', 'Multi-purpose salons for various events'),
    ('Conference Room', 'قاعة المؤتمرات', '🏢', 'Professional spaces for meetings and conferences'),
    ('Garden/Outdoor', 'حديقة', '🌳', 'Beautiful outdoor venues for open-air events'),
    ('Villa', 'فيلا', '🏡', 'Private villas for exclusive gatherings'),
    ('Hotel Ballroom', 'قاعة الفندق', '🏨', 'Luxurious hotel ballrooms for grand events'),
    ('Restaurant', 'مطعم', '🍽️', 'Restaurants with private event spaces'),
    ('Rooftop', 'سطح', '🌃', 'Rooftop venues with stunning views')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- SEED DATA: LOCATIONS (Algerian Wilayas)
-- ===========================================
INSERT INTO public.locations (name, name_ar, wilaya_code)
VALUES 
    ('Adrar', 'أدرار', 1),
    ('Chlef', 'الشلف', 2),
    ('Laghouat', 'الأغواط', 3),
    ('Oum El Bouaghi', 'أم البواقي', 4),
    ('Batna', 'باتنة', 5),
    ('Béjaïa', 'بجاية', 6),
    ('Biskra', 'بسكرة', 7),
    ('Béchar', 'بشار', 8),
    ('Blida', 'البليدة', 9),
    ('Bouira', 'البويرة', 10),
    ('Tamanrasset', 'تمنراست', 11),
    ('Tébessa', 'تبسة', 12),
    ('Tlemcen', 'تلمسان', 13),
    ('Tiaret', 'تيارت', 14),
    ('Tizi Ouzou', 'تيزي وزو', 15),
    ('Algiers', 'الجزائر', 16),
    ('Djelfa', 'الجلفة', 17),
    ('Jijel', 'جيجل', 18),
    ('Sétif', 'سطيف', 19),
    ('Saïda', 'سعيدة', 20),
    ('Skikda', 'سكيكدة', 21),
    ('Sidi Bel Abbès', 'سيدي بلعباس', 22),
    ('Annaba', 'عنابة', 23),
    ('Guelma', 'قالمة', 24),
    ('Constantine', 'قسنطينة', 25),
    ('Médéa', 'المدية', 26),
    ('Mostaganem', 'مستغانم', 27),
    ('M''Sila', 'المسيلة', 28),
    ('Mascara', 'معسكر', 29),
    ('Ouargla', 'ورقلة', 30),
    ('Oran', 'وهران', 31),
    ('El Bayadh', 'البيض', 32),
    ('Illizi', 'إليزي', 33),
    ('Bordj Bou Arréridj', 'برج بوعريريج', 34),
    ('Boumerdès', 'بومرداس', 35),
    ('El Tarf', 'الطارف', 36),
    ('Tindouf', 'تندوف', 37),
    ('Tissemsilt', 'تيسمسيلت', 38),
    ('El Oued', 'الوادي', 39),
    ('Khenchela', 'خنشلة', 40),
    ('Souk Ahras', 'سوق أهراس', 41),
    ('Tipaza', 'تيبازة', 42),
    ('Mila', 'ميلة', 43),
    ('Aïn Defla', 'عين الدفلى', 44),
    ('Naama', 'النعامة', 45),
    ('Aïn Témouchent', 'عين تموشنت', 46),
    ('Ghardaïa', 'غرداية', 47),
    ('Relizane', 'غليزان', 48),
    ('El M''Ghair', 'المغير', 49),
    ('El Meniaa', 'المنيعة', 50),
    ('Ouled Djellal', 'أولاد جلال', 51),
    ('Bordj Baji Mokhtar', 'برج باجي مختار', 52),
    ('Béni Abbès', 'بني عباس', 53),
    ('Timimoun', 'تيميمون', 54),
    ('Touggourt', 'تقرت', 55),
    ('Djanet', 'جانت', 56),
    ('In Salah', 'عين صالح', 57),
    ('In Guezzam', 'عين قزام', 58)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 8. STORAGE (Buckets & Policies)
-- ===========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('venue-images', 'venue-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy: Give public access to venue images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'venue-images' );

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'venue-images' AND auth.role() = 'authenticated' );

