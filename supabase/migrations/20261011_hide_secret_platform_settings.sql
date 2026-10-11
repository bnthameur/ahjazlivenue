-- Security fix: platform_settings holds secrets (e.g. slickpay_api_key) next to public
-- values (CCP details, social links, free_mode). Previously any signed-in user could
-- read every row straight from the Supabase API. After this migration:
--   * admins can read everything
--   * everyone else can only read non-secret keys
-- Writes are unchanged (still admin-only via the existing "manage" policy).

-- Drop every existing SELECT policy on the table, whatever it was named.
DO $$
DECLARE
    p record;
BEGIN
    FOR p IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'platform_settings'
          AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.platform_settings', p.policyname);
    END LOOP;
END $$;

CREATE POLICY "Admins can read all settings" ON public.platform_settings
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Anyone can read non-secret settings" ON public.platform_settings
    FOR SELECT USING (
        key NOT ILIKE '%api_key%'
        AND key NOT ILIKE '%secret%'
        AND key NOT ILIKE '%token%'
        AND key NOT ILIKE '%password%'
    );
