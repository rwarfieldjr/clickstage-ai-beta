/**
 * SIMPLIFIED CHECKOUT CLIENT
 * 
 * Use this for quick purchases that don't require file uploads or complex flows.
 * Perfect for "Buy Now" buttons on pricing pages.
 * 
 * Example usage:
 * ```tsx
 * import { createSimpleCheckout } from '@/lib/simpleCheckout';
 * 
 * const handleBuyNow = async () => {
 *   const result = await createSimpleCheckout('price_1SD8nJIG3TLqP9yaGAjd2WdP');
 *   if (result.success) {
 *     window.location.href = result.url; // Redirect to Stripe
 *   } else {
 *     toast.error(result.error);
 *   }
 * };
 * ```
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/config/environment";

export interface SimpleCheckoutResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Create a simplified Stripe checkout session
 * 
 * @param priceId - Stripe Price ID (e.g., "price_1SD8nJIG3TLqP9yaGAjd2WdP")
 * @returns Promise with checkout URL or error
 */
export async function createSimpleCheckout(priceId: string): Promise<SimpleCheckoutResult> {
  try {
    logger.info("Creating simple checkout", { priceId });

    // Validate price ID format
    if (!priceId || !priceId.startsWith('price_')) {
      return {
        success: false,
        error: "Invalid price ID format",
      };
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('create-simple-checkout', {
      body: { priceId },
    });

    if (error) {
      logger.error("Edge function error", { error: error.message });
      return {
        success: false,
        error: error.message || "Failed to create checkout session",
      };
    }

    if (!data) {
      logger.error("No data returned from edge function");
      return {
        success: false,
        error: "No response from checkout service",
      };
    }

    // Handle the new response format
    if (data.success === false) {
      logger.warn("Checkout failed", { error: data.error });
      return {
        success: false,
        error: data.error || "Checkout creation failed",
      };
    }

    if (!data.url) {
      logger.error("No checkout URL in response", { data });
      return {
        success: false,
        error: "No checkout URL received",
      };
    }

    logger.info("Checkout session created successfully");

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId,
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Simple checkout exception", { error: errorMessage });
    
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Open simple checkout in current window
 * Convenience function that handles the redirect automatically
 */
export async function openSimpleCheckout(priceId: string): Promise<void> {
  const result = await createSimpleCheckout(priceId);
  
  if (result.success && result.url) {
    window.location.href = result.url;
  } else {
    throw new Error(result.error || "Failed to create checkout");
  }
}

/**
 * Open simple checkout in new tab/window
 * Allows user to complete payment without losing current page state
 */
export async function openSimpleCheckoutNewTab(priceId: string): Promise<Window | null> {
  const result = await createSimpleCheckout(priceId);
  
  if (result.success && result.url) {
    return window.open(result.url, '_blank');
  } else {
    throw new Error(result.error || "Failed to create checkout");
  }
}
