import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface CreditDetail {
  delta: number;
  balance_after: number;
  reason: string;
  order_id: string | null;
  created_at: string;
}

export interface CreditSummary {
  total: number;
  recent_purchases: number;
  recent_usage: number;
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
      
      // Fetch total credits from user_credits table using user_id
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", user.id)
        .maybeSingle();

      if (creditsError) throw creditsError;
      
      const totalCredits = creditsData?.credits || 0;
      setCredits(totalCredits);

      // Fetch credit ledger (transaction history)
      const { data: ledger, error: ledgerError } = await supabase
        .from("credit_ledger")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ledgerError) throw ledgerError;

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let recentPurchases = 0;
      let recentUsage = 0;

      ledger?.forEach((entry) => {
        const entryDate = new Date(entry.created_at);
        if (entryDate >= thirtyDaysAgo) {
          if (entry.delta > 0) {
            recentPurchases += entry.delta;
          } else {
            recentUsage += Math.abs(entry.delta);
          }
        }
      });

      setCreditSummary({
        total: totalCredits,
        recent_purchases: recentPurchases,
        recent_usage: recentUsage,
        details: ledger || [],
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
