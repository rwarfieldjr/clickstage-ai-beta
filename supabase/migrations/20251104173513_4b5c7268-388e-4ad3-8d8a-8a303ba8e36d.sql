-- ✅ Critical Migration: Consolidate credit system to user_id-based table (2025-11-04)
-- This fixes the split-brain issue where purchases added to one table and dashboard read from another

-- Step 1: Migrate any remaining credits from old (email-based) to new (user_id-based) system
INSERT INTO public.user_credits (user_id, credits, updated_at)
SELECT 
  p.id as user_id,
  uco.credits,
  GREATEST(uco.updated_at, NOW()) as updated_at
FROM public.user_credits_old uco
JOIN public.profiles p ON p.email = uco.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_credits uc 
  WHERE uc.user_id = p.id
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  credits = GREATEST(public.user_credits.credits, EXCLUDED.credits),
  updated_at = NOW();

-- Step 2: Create audit log of the migration
INSERT INTO public.system_logs (event, severity, payload, path)
SELECT 
  'credit_migration_old_to_new',
  'info',
  jsonb_build_object(
    'email', uco.email,
    'user_id', p.id,
    'credits_migrated', uco.credits,
    'migration_date', NOW()
  ),
  '/migration/credit-consolidation'
FROM public.user_credits_old uco
JOIN public.profiles p ON p.email = uco.email;

-- Step 3: Rename old table for archival (keep for 30 days, then drop)
ALTER TABLE IF EXISTS public.user_credits_old RENAME TO user_credits_archived_20251104;

-- Step 4: Remove old RLS policies from archived table
ALTER TABLE public.user_credits_archived_20251104 DISABLE ROW LEVEL SECURITY;

-- Step 5: Comment the archived table with deletion instructions
COMMENT ON TABLE public.user_credits_archived_20251104 IS 
  'ARCHIVED 2025-11-04: Old email-based credit system. Safe to drop after 2025-12-04. All data migrated to user_credits table.';