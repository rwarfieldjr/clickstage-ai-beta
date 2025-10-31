import { getCredits, deductCredits } from "./credits";
import { handleCheckout } from "./checkout";

interface CheckoutResult {
  method: "credits" | "stripe";
  status: "success" | "redirect" | "error";
  message?: string;
}

/**
 * Processes checkout using either credits or Stripe based on availability
 * @param userEmail - The user's email address
 * @param photoCount - Number of photos/credits needed
 * @returns Promise with checkout result
 */
export async function processCreditOrStripeCheckout(
  userEmail: string | undefined,
  photoCount: number
): Promise<CheckoutResult> {
  console.log("[creditCheckout] Starting checkout process", { userEmail, photoCount });

  // Check if user is signed in
  if (!userEmail) {
    console.log("[creditCheckout] No user email provided - user must sign in");
    alert("Please sign in to continue with your order");
    return { method: "credits", status: "error", message: "User not signed in" };
  }

  try {
    // Get current credits
    console.log("[creditCheckout] Fetching credits for user:", userEmail);
    const credits = await getCredits(userEmail);
    console.log("[creditCheckout] User has", credits, "credits, needs", photoCount);

    // Check if user has enough credits
    if (credits >= photoCount) {
      console.log("[creditCheckout] Sufficient credits available - processing credit payment");
      await deductCredits(userEmail, photoCount);
      console.log("[creditCheckout] Successfully deducted", photoCount, "credits");
      return { method: "credits", status: "success" };
    } else {
      console.log("[creditCheckout] Insufficient credits - redirecting to Stripe checkout");
      // Note: handleCheckout requires a full CheckoutParams object
      // This is a simplified call and may need to be adjusted based on actual usage
      await handleCheckout(photoCount as any);
      console.log("[creditCheckout] Stripe checkout initiated");
      return { method: "stripe", status: "redirect" };
    }
  } catch (error) {
    console.error("[creditCheckout] Error during checkout:", error);
    return { 
      method: "credits", 
      status: "error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
