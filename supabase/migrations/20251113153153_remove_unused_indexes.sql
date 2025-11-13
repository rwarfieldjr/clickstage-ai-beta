/*
  # Remove Unused Indexes
  
  1. **Index Analysis**
    Based on codebase analysis, removing indexes that are not used by any queries:
    
    **Removed (Not Used):**
    - idx_profiles_email: Profiles queried by id, not email
    - idx_profiles_created_at: No queries order profiles by created_at
    - idx_audit_log_user_id: Minimal audit log queries, FK index sufficient
    - idx_audit_log_event_type: Event type filtering not used
    - idx_audit_log_created_at: No ordering by created_at in queries
    - idx_credit_transactions_user_id: FK index handles user_id lookups
    - idx_credit_transactions_created_at: No ordering by created_at in queries
    
    **Kept (Actively Used):**
    - idx_orders_status: Used for status filtering in AdminOrders
    - idx_orders_created_at: Used for ordering in Dashboard and AdminOrders
    - idx_payments_user_id: Added for FK performance, useful for joins
    
  2. **Performance Impact**
    - Removing unused indexes reduces storage overhead
    - Improves INSERT/UPDATE performance (fewer indexes to maintain)
    - Keeps only indexes that provide query performance benefits
    
  3. **Future Considerations**
    If new queries need these indexes, they can be re-added
*/

-- =====================================================
-- REMOVE UNUSED PROFILES INDEXES
-- =====================================================

-- Remove email index (profiles are queried by id, not email)
DROP INDEX IF EXISTS public.idx_profiles_email;

-- Remove created_at index (no queries order profiles by created_at)
DROP INDEX IF EXISTS public.idx_profiles_created_at;

COMMENT ON TABLE public.profiles IS 
  'User profile information. Primary key (id) is automatically indexed. Email lookups use auth.users table.';

-- =====================================================
-- REMOVE UNUSED AUDIT_LOG INDEXES
-- =====================================================

-- Remove user_id index (FK index is sufficient for the minimal queries)
DROP INDEX IF EXISTS public.idx_audit_log_user_id;

-- Remove event_type index (not used in queries)
DROP INDEX IF EXISTS public.idx_audit_log_event_type;

-- Remove created_at index (no ordering by created_at)
DROP INDEX IF EXISTS public.idx_audit_log_created_at;

COMMENT ON TABLE public.audit_log IS 
  'Audit log for tracking user actions. Queries are minimal and use RLS filtering. FK indexes handle lookups efficiently.';

-- =====================================================
-- REMOVE UNUSED CREDIT_TRANSACTIONS INDEXES
-- =====================================================

-- Remove user_id index (FK index handles user_id lookups)
DROP INDEX IF EXISTS public.idx_credit_transactions_user_id;

-- Remove created_at index (no ordering by created_at in queries)
DROP INDEX IF EXISTS public.idx_credit_transactions_created_at;

COMMENT ON TABLE public.credit_transactions IS 
  'Credit transaction history. Foreign key indexes provide sufficient performance for user_id lookups.';

-- =====================================================
-- CONFIRM KEPT INDEXES
-- =====================================================

-- These indexes are actively used and should be kept:
-- - idx_orders_status (used for filtering orders by status)
-- - idx_orders_created_at (used for ordering orders chronologically)
-- - idx_payments_user_id (foreign key performance for joins)

COMMENT ON INDEX public.idx_orders_status IS 
  'Used for filtering orders by status in admin dashboard and order management.';

COMMENT ON INDEX public.idx_orders_created_at IS 
  'Used for ordering orders chronologically in Dashboard, AdminOrders, and AdminUserDetail pages.';

-- Verify payments user_id index exists (we just added it)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

COMMENT ON INDEX public.idx_payments_user_id IS 
  'Foreign key index for optimizing joins and user payment lookups.';
