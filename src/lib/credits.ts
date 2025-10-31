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
  const current = await getCredits(email);
  if (current < amount) throw new Error("Not enough credits");
  const newTotal = current - amount;
  const { error } = await supabase
    .from("user_credits")
    .update({ credits: newTotal })
    .eq("email", email);
  if (error) throw error;
  return newTotal;
}

export async function hasEnoughCredits(email: string, required: number) {
  const current = await getCredits(email);
  return current >= required;
}

// @version: stable-credits-1.0 | Do not auto-modify | Last updated by Rob Warfield
