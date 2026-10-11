ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS offers jsonb DEFAULT '[]'::jsonb;
