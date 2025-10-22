import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface CreditDetail {
  amount: number;
  expires_at: string | null;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export interface CreditSummary {
  total: number;
  expiring_soon: number;
  expired: number;
  details: CreditDetail[];
}

export const useCredits = (user: User | null) => {
  const [credits, setCredits] = useState<number>(0);
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    if (!user) {
      setCredits(0);
      setCreditSummary(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch total credits from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      
      const totalCredits = profileData?.credits || 0;
      setCredits(totalCredits);

      // Fetch credit transactions with expiration details
      const { data: transactions, error: transactionsError } = await supabase
        .from("credits_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (transactionsError) throw transactionsError;

      // Calculate expiring and expired credits
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      let expiringSoon = 0;
      let expired = 0;

      transactions?.forEach((transaction) => {
        if (transaction.expires_at) {
          const expiryDate = new Date(transaction.expires_at);
          
          if (expiryDate <= now) {
            // Credits already expired
            expired += Math.abs(transaction.amount);
          } else if (expiryDate <= thirtyDaysFromNow && transaction.amount > 0) {
            // Credits expiring within 30 days
            expiringSoon += transaction.amount;
          }
        }
      });

      setCreditSummary({
        total: totalCredits,
        expiring_soon: expiringSoon,
        expired: expired,
        details: transactions || [],
      });

    } catch (error) {
      console.error("Error fetching credits:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch credits");
      setCredits(0);
      setCreditSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  return { 
    credits, 
    creditSummary,
    loading, 
    error, 
    refetchCredits: fetchCredits 
  };
};
