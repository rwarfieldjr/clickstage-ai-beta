import { supabase } from "@/integrations/supabase/client";

/**
 * CLIENT-SAFE: Atomically updates user credits with full audit trail
 * 
 * This function uses the authenticated user's session to call the RPC function.
 * The database function has its own authorization logic and will only allow:
 * - Users to deduct their own credits (negative delta)
 * - Admins or service role to add credits (positive delta)
 * 
 * For admin operations (adding credits), use an edge function instead.
 * 
 * @param userId - User UUID (must match authenticated user for deductions)
 * @param delta - Credit change (positive for add, negative for deduct)
 * @param reason - Reason for credit change
 * @param orderId - Optional order ID for tracking
 * @returns Result with success status, new balance, and optional error message
 * 
 * @example
 * // Deduct credits (client-side, authenticated user only)
 * const result = await updateUserCreditsAtomic(currentUser.id, -5, 'usage', orderId);
 * 
 * @example
 * // For adding credits, use an edge function with service role
 * // Don't call this directly from client for credit additions
 */
export async function updateUserCreditsAtomic(
  userId: string,
  delta: number,
  reason: string,
  orderId?: string
): Promise<{ ok: boolean; balance?: number; message?: string }> {
  try {
    // Use the authenticated user's client (respects RLS)
    const { data, error } = await supabase.rpc("update_user_credits_atomic", {
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason,
      p_order_id: orderId ?? null,
    });

    if (error) {
      console.error('[updateUserCreditsAtomic] RPC error:', error);
      return { ok: false, message: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;
    
    if (!row) {
      return { ok: false, message: 'No data returned from credit update' };
    }

    console.log('[updateUserCreditsAtomic] Success:', { 
      ok: row.ok, 
      balance: row.balance, 
      delta 
    });

    return { 
      ok: !!row.ok, 
      balance: row.balance ?? undefined, 
      message: row.message ?? undefined 
    };
  } catch (e) {
    console.error('[updateUserCreditsAtomic] Exception:', e);
    return { 
      ok: false, 
      message: e instanceof Error ? e.message : 'Unknown error' 
    };
  }
}

/**
 * Get current user's credit balance
 * @returns Current credit balance or null if not found
 */
export async function getUserCredits(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getUserCredits] Error:', error);
      return null;
    }

    return data?.credits ?? 0;
  } catch (e) {
    console.error('[getUserCredits] Exception:', e);
    return null;
  }
}

/**
 * Get user's credit transaction history
 * @param userId - User UUID
 * @param limit - Number of transactions to fetch (default 50)
 * @returns Array of ledger entries
 */
export async function getCreditLedger(
  userId: string, 
  limit: number = 50
): Promise<Array<{
  id: string;
  delta: number;
  balance_after: number;
  reason: string;
  order_id: string | null;
  created_at: string;
}>> {
  try {
    const { data, error } = await supabase
      .from('credit_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getCreditLedger] Error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('[getCreditLedger] Exception:', e);
    return [];
  }
}
