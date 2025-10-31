import { getCredits, deductCredits } from "./credits";

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
}
