-- The map picker (venue create/edit), the admin venue page and the public venue page
-- all read/write venues.latitude / venues.longitude, but the columns were never added.
-- Without them every venue insert/update fails with:
--   "Could not find the 'latitude' column of 'venues' in the schema cache"
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS longitude double precision;

-- Refresh the API schema cache right away
NOTIFY pgrst, 'reload schema';
