import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { logSystemEvent } from './log-system-event.ts';

/**
 * Atomically updates user credits with full audit trail and error handling
 * ✅ UPDATED: Now uses user_id instead of email (2025-11-04)
 * @param supabase - Supabase client with service role
 * @param userId - User UUID
 * @param delta - Credit change (positive for add, negative for deduct)
 * @param reason - Reason for credit change
 * @param orderId - Optional order ID
 * @returns Result object with success status and balance info
 */
export async function updateUserCreditsAtomic(
  supabase: SupabaseClient,
  userId: string,
  delta: number,
  reason: string,
  orderId?: string
): Promise<{
  success: boolean;
  error?: string;
  previousBalance?: number;
  newBalance?: number;
  delta?: number;
}> {
  console.log(`[atomic-credits] Updating credits for user ${userId}: delta=${delta}, reason=${reason}`);

  try {
    const { data, error } = await supabase.rpc('update_user_credits_atomic', {
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason,
      p_order_id: orderId || null
    });

    if (error) {
      console.error('[atomic-credits] Database error:', error);
      await logSystemEvent(
        'Credit update failed - database error',
        'error',
        userId,
        undefined,
        { user_id: userId, delta, error: error.message }
      );
      return {
        success: false,
        error: error.message
      };
    }

    // New RPC returns array with single row: [{ok, balance, message}]
    const row = Array.isArray(data) ? data[0] : data;

    if (!row || !row.ok) {
      console.warn('[atomic-credits] Credit update failed:', row);
      await logSystemEvent(
        'Credit update failed',
        'warn',
        userId,
        undefined,
        { user_id: userId, delta, message: row?.message }
      );
      return {
        success: false,
        error: row?.message || 'Credit update failed'
      };
    }

    console.log(`[atomic-credits] ✓ Credits updated successfully:`, row);
    await logSystemEvent(
      'Credits updated successfully',
      'info',
      userId,
      undefined,
      { user_id: userId, delta, balance: row.balance }
    );

    return {
      success: true,
      previousBalance: (row.balance || 0) - delta, // Calculate previous from current
      newBalance: row.balance || 0,
      delta: delta
    };
  } catch (e) {
    console.error('[atomic-credits] Exception:', e);
    await logSystemEvent(
      'Credit update failed - exception',
      'critical',
      userId,
      undefined,
      { user_id: userId, delta, error: String(e) }
    );
    return {
      success: false,
      error: 'Internal error updating credits'
    };
  }
}

/**
 * Acquires a checkout lock to prevent race conditions
 * ✅ DEPRECATED: Checkout locks removed in favor of database-level atomicity (2025-11-04)
 * @param supabase - Supabase client with service role
 * @param userId - User UUID
 * @param lockDurationSeconds - Lock duration (default 300s = 5min)
 * @returns Always returns true (no-op for backward compatibility)
 */
export async function acquireCheckoutLock(
  supabase: SupabaseClient,
  userId: string,
  lockDurationSeconds: number = 300
): Promise<boolean> {
  console.log(`[atomic-credits] Lock mechanism deprecated, returning true for user ${userId}`);
  return true; // No-op: atomicity is now handled by database RPC

  // Legacy code below (kept for reference)
  /* try {
    const { data, error } = await supabase.rpc('acquire_checkout_lock', {
      p_user_id: userId,
      p_lock_duration_seconds: lockDurationSeconds
    });

    if (error) {
      console.error('[atomic-credits] Lock acquisition error:', error);
      return false;
    }

    const acquired = data as boolean;
    console.log(`[atomic-credits] Lock ${acquired ? 'acquired' : 'failed (already locked)'}`);
    return acquired;
  } catch (e) {
    console.error('[atomic-credits] Lock exception:', e);
    return false;
  } */
}

/**
 * Releases a checkout lock
 * ✅ DEPRECATED: No-op for backward compatibility (2025-11-04)
 * @param supabase - Supabase client with service role
 * @param userId - User UUID
 */
export async function releaseCheckoutLock(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  console.log(`[atomic-credits] Lock mechanism deprecated, no-op for user ${userId}`);
  // No-op: atomicity is now handled by database RPC
}
