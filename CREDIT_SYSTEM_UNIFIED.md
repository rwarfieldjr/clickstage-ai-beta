# Credit System Unification - Complete ✅

**Status:** PRODUCTION READY  
**Date:** 2025-11-04  
**Version:** 2.0 - Unified user_id-based system

---

## ✅ System Architecture

### Unified Credit Tables
1. **`user_credits`** (PRIMARY) - User credit balances
   - Indexed by: `user_id`, `updated_at`
   - Single source of truth for current balances
   - All operations route through `update_user_credits_atomic` RPC

2. **`credit_ledger`** (AUDIT) - Immutable transaction log
   - Indexed by: `user_id`, `created_at`, `order_id`, composite `(user_id, created_at)`
   - Complete audit trail of all credit changes
   - Tracks: delta, balance_after, reason, order_id

3. **`processed_stripe_sessions`** (DEDUPLICATION) - Payment tracking
   - Indexed by: `session_id`, `user_id`, `payment_intent_id`
   - Prevents duplicate credit additions from webhooks

### Archived Tables (READ-ONLY)
- `user_credits_archived_20251104` - Old email-based system (archived 2025-11-04)
- `credits_transactions_old` - Old transaction system (deprecated)

---

## ✅ Edge Functions - All Unified

### Credit Operations
| Function | Status | Purpose |
|----------|--------|---------|
| `stripe-webhook` | ✅ UNIFIED | Adds credits on payment completion |
| `verify-payment` | ✅ UNIFIED | Manual payment verification |
| `process-credit-order` | ✅ UNIFIED | Processes credit purchases |
| `add-credits` | ✅ UNIFIED | Admin credit additions |
| `sync-credits` | ✅ UNIFIED | Syncs Stripe sessions to credits |
| `repair-checkouts` | ✅ UNIFIED | Repairs stuck orders with credit ledger |
| `_shared/atomic-credits.ts` | ✅ UNIFIED | Core atomic credit update logic |

### Other Functions
- `handle-new-order` - No credit operations (email notifications only)
- `send-order-notification` - No credit operations
- `checkout-selftest` - Health check (reads user_credits for testing)
- `check-expiring-credits` - ⚠️ DEPRECATED (uses old credits_transactions table - new system has no expiration)

---

## ✅ Client-Side Code - All Unified

### Credit Utilities
| File | Status | Purpose |
|------|--------|---------|
| `src/lib/updateUserCreditsAtomic.ts` | ✅ UNIFIED | Client-safe atomic updates via RPC |
| `src/lib/credits.ts` | ✅ UNIFIED | Basic credit operations (getCredits, deductCredits) |
| `src/hooks/use-credits.tsx` | ✅ UNIFIED | React hook for credit balance & history |

### Pages Using Credits
- `src/pages/Dashboard.tsx` - Displays credits from unified system
- `src/pages/Upload.tsx` - Deducts credits using atomic RPC
- `src/pages/AccountSettings.tsx` - Shows credit history from credit_ledger

---

## ✅ Database Functions

### Core RPC
```sql
update_user_credits_atomic(p_user_id, p_delta, p_reason, p_order_id)
```
- Returns: `{ok: boolean, balance: integer, message: text}`
- Atomic: Locks row to prevent race conditions
- Validates: Prevents negative balances
- Audits: Writes to credit_ledger automatically

### Helper Functions (NEW)
```sql
get_user_credit_balance(p_user_id UUID) → INTEGER
get_user_credit_history(p_user_id UUID, p_limit INT) → TABLE
```

---

## ✅ Verification Checklist

### Database ✅
- [x] `user_credits` indexed by user_id
- [x] `credit_ledger` indexed by user_id, created_at, order_id
- [x] All old tables archived with deprecation comments
- [x] No orphaned credit records (verified by migration)
- [x] RLS policies secure both tables

### Edge Functions ✅
- [x] All Stripe webhooks use `user_id` system
- [x] No references to `email` in credit operations
- [x] All credit adds/deducts use `update_user_credits_atomic` RPC
- [x] Comprehensive logging added (user_id, action, balance)
- [x] Duplicate prevention via `processed_stripe_sessions`

### Client Code ✅
- [x] All credit reads from `user_credits` table
- [x] All credit writes via `update_user_credits_atomic` RPC
- [x] React hooks use unified system
- [x] No email-based credit lookups

### Security ✅
- [x] RPC uses authenticated user for deductions
- [x] Only service role can add credits
- [x] Immutable audit trail in `credit_ledger`
- [x] Duplicate webhook events blocked

---

## 🔒 Security Features

1. **Race Condition Prevention**
   - Database-level row locking in RPC function
   - Prevents concurrent credit modifications
   - No need for application-level locks

2. **Duplicate Payment Prevention**
   - `stripe_event_log` table prevents duplicate webhook processing
   - `processed_stripe_sessions` prevents manual re-processing
   - Unique constraints on both tables

3. **Audit Trail**
   - Every credit change recorded in immutable `credit_ledger`
   - Tracks: user_id, delta, balance_after, reason, order_id, timestamp
   - Cannot be modified after creation (INSERT only)

4. **Authorization**
   - Credit deductions: User can only deduct their own credits
   - Credit additions: Only admin/service role
   - RLS policies enforce access control

---

## 📊 Testing Verification

### Test Scenario: $45 (5 credits) purchase → use 3 → verify 2 remaining

**Expected Flow:**
1. User purchases 5-credit bundle ($45)
2. Stripe webhook adds 5 credits via `update_user_credits_atomic`
3. Entry in `credit_ledger`: `{delta: +5, balance_after: 5}`
4. User uploads 3 photos
5. System deducts 3 credits via `update_user_credits_atomic`
6. Entry in `credit_ledger`: `{delta: -3, balance_after: 2}`
7. Dashboard shows: **2 credits remaining** ✅

**Database Verification:**
```sql
-- Check current balance
SELECT credits FROM user_credits WHERE user_id = '<user_id>';
-- Should return: 2

-- Check transaction history
SELECT delta, balance_after, reason FROM credit_ledger 
WHERE user_id = '<user_id>' 
ORDER BY created_at DESC;
-- Should show: -3 (usage), +5 (purchase)
```

---

## 🚨 Deprecated Components

### Do NOT Use
- ❌ `user_credits_archived_20251104` table
- ❌ `credits_transactions_old` table
- ❌ Any email-based credit lookups
- ❌ `check-expiring-credits` edge function (new system has no expiration)

### Migration Required If You See
- Email parameter in credit functions
- References to `credits_transactions` table
- References to `user_credits_old` table
- Credit expiration logic

---

## 📝 Future Maintenance

### Adding Credits (Admin)
```typescript
// Use edge function with service role
const { data } = await supabaseAdmin.rpc('update_user_credits_atomic', {
  p_user_id: userId,
  p_delta: amount,
  p_reason: 'manual_adjustment',
  p_order_id: null
});
```

### Deducting Credits (User)
```typescript
// Client-side (authenticated user only)
import { updateUserCreditsAtomic } from '@/lib/updateUserCreditsAtomic';

const result = await updateUserCreditsAtomic(
  user.id,
  -1,
  'usage',
  orderId
);
```

### Querying Balance
```typescript
import { getCredits } from '@/lib/credits';
const balance = await getCredits(userId);
```

### Querying History
```typescript
import { getCreditLedger } from '@/lib/updateUserCreditsAtomic';
const history = await getCreditLedger(userId, 50);
```

---

## ✅ Production Readiness

- **Database**: Fully indexed and optimized
- **Edge Functions**: All unified and tested
- **Client Code**: All using atomic RPC
- **Security**: RLS policies, audit trail, duplicate prevention
- **Performance**: Indexed lookups, atomic operations
- **Monitoring**: Comprehensive logging in all functions

**Status: READY FOR PRODUCTION** 🚀

---

## 📞 Support

If you encounter credit discrepancies:
1. Check `credit_ledger` for transaction history
2. Verify `processed_stripe_sessions` for payment status
3. Check edge function logs for any errors
4. Manual adjustment via `update_user_credits_atomic` RPC with service role

All credit operations are logged with user_id, action type, and resulting balance.
