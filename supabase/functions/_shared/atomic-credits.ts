import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { logSystemEvent } from './log-system-event.ts';

/**
 * Atomically updates user credits with full audit trail and error handling
 * @param supabase - Supabase client with service role
 * @param email - User email
 * @param delta - Credit change (positive for add, negative for deduct)
 * @param reason - Reason for credit change
 * @param orderId - Optional order ID
 * @param stripePaymentId - Optional Stripe payment ID
 * @returns Result object with success status and balance info
 */
export async function updateUserCreditsAtomic(
  supabase: SupabaseClient,
  email: string,
  delta: number,
  reason: string,
  orderId?: string,
  stripePaymentId?: string
): Promise<{
  success: boolean;
  error?: string;
  previousBalance?: number;
  newBalance?: number;
  delta?: number;
}> {
  console.log(`[atomic-credits] Updating credits for ${email}: delta=${delta}, reason=${reason}`);

  try {
    const { data, error } = await supabase.rpc('update_user_credits_atomic', {
      p_email: email,
      p_delta: delta,
      p_reason: reason,
      p_order_id: orderId || null,
      p_stripe_payment_id: stripePaymentId || null
    });

    if (error) {
      console.error('[atomic-credits] Database error:', error);
      await logSystemEvent(
        'Credit update failed - database error',
        'error',
        undefined,
        undefined,
        { email, delta, error: error.message }
      );
      return {
        success: false,
        error: error.message
      };
    }

    const result = data as any;

    if (!result.success) {
      console.warn('[atomic-credits] Insufficient credits:', result);
      await logSystemEvent(
        'Credit update failed - insufficient balance',
        'warn',
        undefined,
        undefined,
        { email, delta, current: result.current, requested: result.requested }
      );
      return {
        success: false,
        error: result.error || 'Insufficient credits'
      };
    }

    console.log(`[atomic-credits] ✓ Credits updated successfully:`, result);
    await logSystemEvent(
      'Credits updated successfully',
      'info',
      undefined,
      undefined,
      { email, delta, previous: result.previous_balance, new: result.new_balance }
    );

    return {
      success: true,
      previousBalance: result.previous_balance,
      newBalance: result.new_balance,
      delta: result.delta
    };
  } catch (e) {
    console.error('[atomic-credits] Exception:', e);
    await logSystemEvent(
      'Credit update failed - exception',
      'critical',
      undefined,
      undefined,
      { email, delta, error: String(e) }
    );
    return {
      success: false,
      error: 'Internal error updating credits'
    };
  }
}

/**
 * Acquires a checkout lock to prevent race conditions
 * @param supabase - Supabase client with service role
 * @param email - User email
 * @param lockDurationSeconds - Lock duration (default 300s = 5min)
 * @returns true if lock acquired, false if already locked
 */
export async function acquireCheckoutLock(
  supabase: SupabaseClient,
  email: string,
  lockDurationSeconds: number = 300
): Promise<boolean> {
  console.log(`[atomic-credits] Acquiring checkout lock for ${email}`);

  try {
    const { data, error } = await supabase.rpc('acquire_checkout_lock', {
      p_email: email,
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
  }
}

/**
 * Releases a checkout lock
 * @param supabase - Supabase client with service role
 * @param email - User email
 */
export async function releaseCheckoutLock(
  supabase: SupabaseClient,
  email: string
): Promise<void> {
  console.log(`[atomic-credits] Releasing checkout lock for ${email}`);

  try {
    const { error } = await supabase.rpc('release_checkout_lock', {
      p_email: email
    });

    if (error) {
      console.error('[atomic-credits] Lock release error:', error);
    } else {
      console.log('[atomic-credits] Lock released successfully');
    }
  } catch (e) {
    console.error('[atomic-credits] Lock release exception:', e);
  }
}
