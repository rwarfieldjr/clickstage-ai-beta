// @version: stable-credits-1.1 | Unified credit table applied | Do not auto-modify

import { supabase } from "@/integrations/supabase/client";

export async function getCredits(email: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("email", email)
    .single();
  if (error || !data) return 0;
  return data.credits;
}

export async function addCredits(email: string, amount: number) {
  const current = await getCredits(email);
  const newTotal = current + amount;
  const { error } = await supabase
    .from("user_credits")
    .upsert({ email, credits: newTotal });
  if (error) throw error;
  return newTotal;
}

export async function deductCredits(email: string, amount: number) {
  const { data, error } = await supabase.rpc("deduct_credits_if_available", { 
    email_param: email, 
    amount_param: amount 
  });
  if (error) throw error;
  const result = data as { success: boolean };
  if (result?.success !== true) throw new Error("Insufficient credits");
}

export async function hasEnoughCredits(email: string, required: number) {
  const current = await getCredits(email);
  return current >= required;
}


