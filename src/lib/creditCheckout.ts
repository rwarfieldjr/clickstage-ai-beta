// @version: stable-credits-1.1 | Unified credit table applied | Do not auto-modify

import { getCredits, deductCredits } from "./credits";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutResult {
  method: "credits" | "stripe";
  status: "success" | "insufficient_credits";
}

/**
 * Processes checkout using credits if available
 * @param userEmail - The user's email address
 * @param photoCount - Number of photos/credits needed
 * @returns Promise with checkout result indicating if credits were used or Stripe is needed
 */
export async function processCreditOrStripeCheckout(
  userEmail: string | undefined,
  photoCount: number
): Promise<CheckoutResult> {
  console.log("[creditCheckout] Starting checkout process", { userEmail, photoCount });

  try {
    // Check if user is signed in
    if (!userEmail) {
      console.log("[creditCheckout] No user email provided");
      throw new Error("Please sign in to continue");
    }

    // Get current credits
    console.log("[creditCheckout] Fetching credits for user:", userEmail);
    const credits = await getCredits(userEmail);
    console.log("[creditCheckout] User has", credits, "credits, needs", photoCount);

    // Check if user has enough credits
    if (credits >= photoCount) {
      console.log("[creditCheckout] Sufficient credits available - deducting credits");
      await deductCredits(userEmail, photoCount);
      console.log("[creditCheckout] Successfully deducted", photoCount, "credits");
      return { method: "credits", status: "success" };
    } else {
      console.log("[creditCheckout] Insufficient credits - Stripe payment needed");
      return { method: "stripe", status: "insufficient_credits" };
    }
  } catch (error: any) {
    console.error("[creditCheckout] Error during credit checkout:", error);
    
    // Fire-and-forget client-side error notification (no await; don't block UX)
    supabase.functions.invoke('notify-alert', {
      body: {
        subject: "Credit Checkout Error",
        details: {
          error: error.message || String(error),
          stack: error.stack,
          path: window.location.pathname,
          hostname: window.location.hostname,
          userEmail,
          photoCount,
        }
      }
    }).catch(() => {}); // Silently fail - don't block user flow
    
    throw error; // Re-throw to allow caller to handle
  }
}
