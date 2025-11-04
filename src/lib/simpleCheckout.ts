// ✅ Checkout logic locked on 2025-11-04 — stable production version
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
 * @param turnstileToken - Optional Turnstile CAPTCHA token for security verification
 * @returns Promise with checkout URL or error
 */
export async function createSimpleCheckout(
  priceId: string, 
  turnstileToken?: string
): Promise<SimpleCheckoutResult> {
  // PRODUCTION-SAFE LOGGING - Always logs for debugging
  const checkoutLog = {
    step: 'START',
    priceId,
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PROD ? 'production' : 'development',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
  };
  console.log('[CHECKOUT] Starting checkout flow', checkoutLog);

  try {
    // Step 1: Validate price ID format
    console.log('[CHECKOUT] Step 1: Validating priceId', { priceId });
    
    if (!priceId || !priceId.startsWith('price_')) {
      console.error('[CHECKOUT] ❌ Invalid price ID format', { priceId });
      return {
        success: false,
        error: "Invalid price ID format",
      };
    }
    console.log('[CHECKOUT] ✅ Price ID format valid');

    // Step 2: Check Supabase client configuration
    console.log('[CHECKOUT] Step 2: Checking Supabase configuration');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[CHECKOUT] ❌ Missing Supabase configuration', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return {
        success: false,
        error: "Checkout service not configured. Please contact support.",
      };
    }
    console.log('[CHECKOUT] ✅ Supabase configuration present');

    // Step 3: Call the edge function
    console.log('[CHECKOUT] Step 3: Invoking create-simple-checkout edge function', {
      priceId,
      hasTurnstileToken: !!turnstileToken,
      timestamp: new Date().toISOString(),
    });

    const invokeStart = performance.now();
    const { data, error } = await supabase.functions.invoke('create-simple-checkout', {
      body: { priceId, turnstileToken: turnstileToken || '' },
    });
    const invokeEnd = performance.now();
    const invokeDuration = Math.round(invokeEnd - invokeStart);

    console.log('[CHECKOUT] Edge function response received', {
      duration: `${invokeDuration}ms`,
      hasError: !!error,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : null,
    });

    if (error) {
      console.error('[CHECKOUT] ❌ Edge function error', {
        message: error.message,
        status: error.status,
        error: error,
      });
      
      // Provide user-friendly error message based on status code
      let userMessage = "Unable to start checkout. Please try again.";
      if (error.status === 429) {
        userMessage = "Too many checkout attempts. Please wait a few minutes and try again.";
      } else if (error.status >= 500) {
        userMessage = "Checkout service temporarily unavailable. Please try again in a moment.";
      } else if (error.status === 400) {
        userMessage = "Invalid checkout request. Please refresh the page and try again.";
      }
      
      return {
        success: false,
        error: userMessage,
      };
    }

    // Step 4: Validate response data
    console.log('[CHECKOUT] Step 4: Validating response data', {
      hasData: !!data,
      dataType: typeof data,
      data: data,
    });

    if (!data) {
      console.error('[CHECKOUT] ❌ No data returned from edge function');
      return {
        success: false,
        error: "No response from checkout service",
      };
    }

    // Handle the new response format
    if (data.success === false) {
      console.error('[CHECKOUT] ❌ Checkout failed (success=false)', {
        error: data.error,
        data: data,
      });
      return {
        success: false,
        error: data.error || "Checkout creation failed",
      };
    }

    // Step 5: Validate checkout URL
    console.log('[CHECKOUT] Step 5: Validating checkout URL', {
      hasUrl: !!data.url,
      urlPrefix: data.url?.substring(0, 30),
    });

    if (!data.url) {
      console.error('[CHECKOUT] ❌ No checkout URL in response', { data });
      return {
        success: false,
        error: "No checkout URL received",
      };
    }

    // Validate URL format
    if (!data.url.startsWith('https://')) {
      console.error('[CHECKOUT] ❌ Invalid checkout URL format', {
        url: data.url,
      });
      return {
        success: false,
        error: "Invalid checkout URL format",
      };
    }

    console.log('[CHECKOUT] ✅ Checkout session created successfully', {
      sessionId: data.sessionId,
      url: data.url.substring(0, 50) + '...',
      totalDuration: `${invokeDuration}ms`,
    });

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId,
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    
    console.error('[CHECKOUT] ❌ Unexpected exception', {
      error: errorMessage,
      stack: errorStack,
      type: typeof err,
      err: err,
    });
    
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Open simple checkout in current window
 * Convenience function that handles the redirect automatically
 * @param priceId - Stripe Price ID
 * @param turnstileToken - Optional Turnstile CAPTCHA token
 */
export async function openSimpleCheckout(priceId: string, turnstileToken?: string): Promise<void> {
  console.log('[CHECKOUT] openSimpleCheckout called', {
    priceId,
    hasTurnstileToken: !!turnstileToken,
    timestamp: new Date().toISOString(),
    location: window.location.href,
  });

  const result = await createSimpleCheckout(priceId, turnstileToken);
  
  console.log('[CHECKOUT] createSimpleCheckout result', {
    success: result.success,
    hasUrl: !!result.url,
    error: result.error,
  });

  if (result.success && result.url) {
    console.log('[CHECKOUT] ✅ Redirecting to Stripe checkout', {
      url: result.url.substring(0, 50) + '...',
      currentLocation: window.location.href,
    });
    
    // Add a small delay to ensure logs are captured
    await new Promise(resolve => setTimeout(resolve, 100));
    
    window.location.href = result.url;
  } else {
    const errorMsg = result.error || "Unable to start checkout. Please try again.";
    console.error('[CHECKOUT] ❌ Cannot redirect - checkout failed', {
      error: errorMsg,
      result: result,
    });
    throw new Error(errorMsg);
  }
}

/**
 * Open simple checkout in new tab/window
 * Allows user to complete payment without losing current page state
 * @param priceId - Stripe Price ID
 * @param turnstileToken - Optional Turnstile CAPTCHA token
 */
export async function openSimpleCheckoutNewTab(priceId: string, turnstileToken?: string): Promise<Window | null> {
  const result = await createSimpleCheckout(priceId, turnstileToken);
  
  if (result.success && result.url) {
    return window.open(result.url, '_blank');
  } else {
    throw new Error(result.error || "Unable to start checkout. Please try again.");
  }
}
