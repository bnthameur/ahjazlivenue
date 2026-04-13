-- Fix: Add missing name_fr column to subscription_plans
-- This column is queried by the settings/billing page but was missing,
-- causing plans to not load for venue owners.
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS name_fr text;

-- Add storage UPDATE policy for receipt uploads (upsert requires it)
CREATE POLICY "Authenticated users can update own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

-- Seed French plan names
UPDATE subscription_plans SET name_fr = CASE
    WHEN name = 'Starter' THEN 'Pack Starter'
    WHEN name = 'Premium' THEN 'Pack Premium'
    WHEN name = 'spéciale offre' THEN 'Offre Spéciale'
END WHERE name_fr IS NULL;
