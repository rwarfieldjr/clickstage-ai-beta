-- Fix security linter warnings for archived table (2025-11-04)
-- The archived table doesn't need policies since it's read-only and will be dropped

-- Drop any existing policies on the archived table (they're no longer needed)
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_credits_archived_20251104'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_credits_archived_20251104', pol.policyname);
  END LOOP;
END $$;

-- Re-enable RLS (even though table is archived, keeps linter happy)
ALTER TABLE public.user_credits_archived_20251104 ENABLE ROW LEVEL SECURITY;

-- Add a restrictive policy that blocks all access (table is archived)
CREATE POLICY "archived_table_no_access" 
  ON public.user_credits_archived_20251104
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

COMMENT ON POLICY "archived_table_no_access" ON public.user_credits_archived_20251104 IS
  'Blocks all access to archived table. Safe to drop after 2025-12-04.';