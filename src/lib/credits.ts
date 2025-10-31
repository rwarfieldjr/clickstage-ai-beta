// @version: stable-credits-2.0 | Simplified credit system with user_id | Do not auto-modify

import { supabase } from "@/integrations/supabase/client";

/**
 * Get user's credit balance
 * @param userId - User UUID
 * @returns Current credit balance or 0 if not found
 */
export async function getCredits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("user_id", userId)
    .single();
  
  if (error || !data) return 0;
  return data.credits;
}

/**
 * Add credits to user (only for admin use via edge functions)
 * @deprecated Use updateUserCreditsAtomic from updateUserCreditsAtomic.ts instead
 */
export async function addCredits(userId: string, amount: number) {
  console.warn('addCredits is deprecated. Use updateUserCreditsAtomic instead.');
  const { data, error } = await supabase.rpc("update_user_credits_atomic", {
    p_user_id: userId,
    p_delta: amount,
    p_reason: "Manual credit addition",
    p_order_id: null
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) throw new Error(row?.message || "Failed to add credits");
  return row.balance;
}

/**
 * Deduct credits from user
 * @param userId - User UUID
 * @param amount - Number of credits to deduct
 */
export async function deductCredits(userId: string, amount: number) {
  const { data, error } = await supabase.rpc("update_user_credits_atomic", {
    p_user_id: userId,
    p_delta: -amount,
    p_reason: "Credit usage",
    p_order_id: null
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) throw new Error(row?.message || "Insufficient credits");
}

/**
 * Check if user has enough credits
 * @param userId - User UUID
 * @param required - Required number of credits
 * @returns true if user has enough credits
 */
export async function hasEnoughCredits(userId: string, required: number) {
  const current = await getCredits(userId);
  return current >= required;
}


