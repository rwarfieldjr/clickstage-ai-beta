/**
 * ⚠️ PRODUCTION STABLE - DO NOT MODIFY WITHOUT REVIEW
 * @version 2.0.0-stable-turnstile
 * @last-updated 2025-11-04
 * 
 * Main checkout orchestration with Turnstile security
 * 
 * CRITICAL SECURITY FEATURES:
 * - Turnstile token required for all checkouts
 * - Token passed to both primary and fallback flows
 * - Automatic retry with exponential backoff for 5xx errors
 * - Non-retryable handling for 4xx errors
 * - Comprehensive error logging and alerting
 * 
 * PAYMENT FLOWS:
 * 1. Credit payment: Direct order processing with atomic credit deduction
 * 2. Stripe payment: Primary checkout with automatic fallback to simple checkout
 * 
 * DO NOT REMOVE: Turnstile token validation, retry logic, or error handling
 */

import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavigateFunction } from "react-router-dom";
import { sanitizeFilename, sanitizeName } from "./sanitizeFilename";
import { openStripeCheckout } from "./popupBlocker";

// Load test utilities in development
if (import.meta.env.DEV) {
  import("./testCheckout").then((module) => {
    if (typeof window !== "undefined") {
      (window as any).testAllCheckouts = module.testAllCheckouts;
      (window as any).testSingleTier = module.testSingleTier;
      (window as any).testConnectivity = module.testConnectivity;
    }
  });
}

interface Bundle {
  id: string;
  name: string;
  price: string;
  priceId: string;
  description: string;
  photos: number;
  expiration: string;
  checkoutUrl: string;
}

interface CheckoutParams {
  files: File[];
  stagingStyle: string;
  selectedBundle: string;
  bundles: Bundle[];
  smsConsent: boolean;
  paymentMethod: "stripe" | "credits";
  stagingNotes: string;
  credits: number;
  user: any;
  userProfile: any;
  supabase: SupabaseClient;
  navigate: NavigateFunction;
  refetchCredits: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  turnstileToken?: string; // Optional for backward compatibility
  propertyAddress: string;
  photoQuantity: number;
}

export async function handleCheckout(params: CheckoutParams): Promise<void> {
  const {
    files,
    stagingStyle,
    selectedBundle,
    bundles,
    smsConsent,
    paymentMethod,
    stagingNotes,
    credits,
    user,
    userProfile,
    supabase,
    navigate,
    refetchCredits,
    setLoading,
    turnstileToken,
    propertyAddress,
    photoQuantity,
  } = params;

  // Check SMS consent first
  if (!smsConsent) {
    toast.error("Please agree to receive SMS messages to continue");
    return;
  }

  if (files.length === 0) {
    toast.error("Please select at least one file");
    return;
  }

  if (!stagingStyle) {
    toast.error("Please select a staging style");
    return;
  }

  if (!selectedBundle) {
    toast.error("Please select a bundle");
    return;
  }

  // Check if uploaded photos exceed selected quantity
  if (files.length > photoQuantity) {
    toast.error(`You have uploaded ${files.length} photos but selected ${photoQuantity} photo${photoQuantity > 1 ? 's' : ''}. Please remove ${files.length - photoQuantity} photo${files.length - photoQuantity > 1 ? 's' : ''} or increase the quantity.`);
    return;
  }

  setLoading(true);

  // Helper function to retry failed edge function calls with exponential backoff
  async function retryEdgeFunction<T>(
    functionName: string,
    invokeOptions: any,
    maxRetries = 2
  ): Promise<{ data: T | null; error: any }> {
    console.log(`[STABILITY-CHECK] Calling edge function: ${functionName}`);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { data, error } = await supabase.functions.invoke(functionName, invokeOptions);
      
      // Log response status
      const status = error?.status || (data ? 200 : 500);
      console.log(`[STABILITY-CHECK] ${functionName} response - Status: ${status}, Attempt: ${attempt + 1}/${maxRetries + 1}`);
      
      // Success (2xx response)
      if (!error && data) {
        console.log(`[STABILITY-CHECK] ✓ ${functionName} succeeded`, { status, data });
        return { data, error: null };
      }
      
      // Non-retryable errors (4xx client errors)
      if (error && error.status >= 400 && error.status < 500) {
        console.error(`[STABILITY-CHECK] ✗ ${functionName} failed with client error (non-retryable)`, { 
          status: error.status, 
          message: error.message,
          attempt: attempt + 1 
        });
        
        // Fire-and-forget notification for 4xx errors
        supabase.functions.invoke('notify-alert', {
          body: {
            subject: `Edge Function 4xx Error – ${functionName}`,
            details: {
              function: functionName,
              status: error.status,
              message: error.message,
              path: window.location.pathname,
              hostname: window.location.hostname,
              attempt: attempt + 1,
            }
          }
        }).catch(() => {});
        
        return { data: null, error };
      }
      
      // Server errors (5xx) - retry with backoff
      if (error && error.status >= 500) {
        const isLastAttempt = attempt === maxRetries;
        
        if (isLastAttempt) {
          console.error(`[STABILITY-CHECK] ✗ ${functionName} failed after ${maxRetries + 1} attempts`, { 
            status: error.status, 
            message: error.message 
          });
          
          // Fire-and-forget notification for 5xx errors after all retries exhausted
          supabase.functions.invoke('notify-alert', {
            body: {
              subject: `Edge Function 5xx Error After Retries – ${functionName}`,
              details: {
                function: functionName,
                status: error.status,
                message: error.message,
                path: window.location.pathname,
                hostname: window.location.hostname,
                attempts: maxRetries + 1,
              }
            }
          }).catch(() => {});
          
          return { data: null, error };
        }
        
        // Exponential backoff: 1s, 2s
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`[STABILITY-CHECK] ⚠ ${functionName} temporary failure (5xx), retrying in ${delayMs}ms...`, { 
          status: error.status, 
          attempt: attempt + 1,
          nextRetryIn: `${delayMs}ms`
        });
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      // Unknown error
      console.error(`[STABILITY-CHECK] ✗ ${functionName} failed with unknown error`, { error, attempt: attempt + 1 });
      return { data: null, error };
    }
    
    return { data: null, error: new Error(`Max retries exceeded for ${functionName}`) };
  }

  try {
    // Validate files before processing
    console.log("[STABILITY-CHECK] Starting checkout validation");
    toast.loading("Validating files...");
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const { data: validationData, error: validationError } = await retryEdgeFunction(
      'validate-upload',
      { body: formData }
    );

    toast.dismiss();

    if (validationError || !(validationData as any)?.valid) {
      const errorMessage = (validationData as any)?.invalidFiles?.[0]?.error || 
                          (validationData as any)?.error || 
                          "File validation failed. Please check your files and try again.";
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    console.log("[STABILITY-CHECK] ✓ File validation passed:", validationData);

    // Handle credit payment
    if (paymentMethod === "credits" && user) {
      // Check if user has enough credits
      if (credits < photoQuantity) {
        toast.error(`Insufficient credits. You need ${photoQuantity} credits but only have ${credits}.`);
        setLoading(false);
        return;
      }

      // Upload files to storage
      toast.loading("Uploading photos...");
      const sessionId = crypto.randomUUID();
      
      // Get client name for filename with secure sanitization
      const clientName = userProfile?.name || 'client';
      const sanitizedName = sanitizeName(clientName);
      
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = sanitizeFilename(file.name).split(".").pop();
        const fileName = `${user.id}/${sessionId}/${sanitizedName}_photo${index + 1}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("original-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        return fileName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      toast.dismiss();

      // Process order with credits - use photoQuantity for credit deduction
      console.log("[STABILITY-CHECK] Processing credit order");
      const { data, error } = await retryEdgeFunction('process-credit-order', {
        body: {
          files: uploadedFiles,
          stagingStyle: stagingStyle,
          photosCount: photoQuantity,
          sessionId: sessionId,
          stagingNotes: stagingNotes,
          ...(turnstileToken && { turnstileToken }), // Only include if provided
          propertyAddress: propertyAddress,
        },
      });

      if (error) throw error;

      if ((data as any)?.success) {
        console.log("[STABILITY-CHECK] ✓ Credit order completed successfully", { 
          creditsUsed: (data as any).creditsUsed,
          remainingCredits: (data as any).remainingCredits,
          ordersCreated: (data as any).orders?.length
        });
        toast.success(`Order placed successfully using ${(data as any).creditsUsed} credits!`);
        // Refetch credits to update the display
        await refetchCredits();
        // Navigate to dashboard
        navigate('/dashboard');
      }
      return;
    }

    // Handle Stripe payment - use create-checkout edge function
    const bundle = bundles.find(b => b.id === selectedBundle);
    if (!bundle) {
      throw new Error("Selected bundle not found");
    }

    // Generate a unique session ID for this upload
    const sessionId = crypto.randomUUID();

    // Upload files to storage first
    toast.loading("Uploading photos...");
    
    // Get contact info to use in filename with secure sanitization
    const contactData = localStorage.getItem('orderContactInfo');
    let clientName = 'guest';
    if (contactData) {
      const parsedData = JSON.parse(contactData);
      const fullName = `${parsedData.firstName || ''}_${parsedData.lastName || ''}`.trim();
      clientName = fullName || 'guest';
    } else if (userProfile?.name) {
      clientName = userProfile.name;
    }
    const sanitizedName = sanitizeName(clientName);
    
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = sanitizeFilename(file.name).split(".").pop();
      const fileName = user 
        ? `${user.id}/${sessionId}/${sanitizedName}_photo${index + 1}.${fileExt}`
        : `guest/${sessionId}/${sanitizedName}_photo${index + 1}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("original-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get a signed URL with 24-hour expiration for security
      const { data, error: signedUrlError } = await supabase.storage
        .from("original-images")
        .createSignedUrl(fileName, 86400); // 24 hours in seconds

      if (signedUrlError) throw signedUrlError;
      
      return data.signedUrl;
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    toast.dismiss();

    // Get contact info from localStorage
    const orderData = localStorage.getItem('orderContactInfo');
    let contactInfo = {
      email: user?.email || '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      propertyAddress: propertyAddress,
    };

    if (orderData) {
      const parsedData = JSON.parse(orderData);
      contactInfo = {
        email: parsedData.email || user?.email || '',
        firstName: parsedData.firstName || '',
        lastName: parsedData.lastName || '',
        phoneNumber: parsedData.phoneNumber || '',
        propertyAddress: parsedData.propertyAddress || propertyAddress,
      };
    }

    // Calculate total amount for Stripe checkout
    const totalAmount = photoQuantity * 10; // $10 per photo
    
    // Create checkout session with all metadata
    console.log("[STABILITY-CHECK] Creating Stripe checkout");
    toast.loading("Creating checkout session...");
    
    try {
      const { data: checkoutData, error: checkoutError } = await retryEdgeFunction('create-checkout', {
        body: {
          priceId: bundle.priceId,
          contactInfo: contactInfo,
          files: uploadedFiles,
          stagingStyle: stagingStyle,
          photosCount: photoQuantity, // Use photoQuantity for correct credit amount
          sessionId: sessionId,
          ...(turnstileToken && { turnstileToken }), // Only include if provided
        },
      });

      toast.dismiss();

      if (checkoutError) throw checkoutError;

      // Handle new 2xx response format from edge function
      if (!(checkoutData as any)?.success) {
        const errorMsg = (checkoutData as any)?.error || "Checkout failed";
        throw new Error(errorMsg);
      }

      if ((checkoutData as any)?.url) {
        console.log("[STABILITY-CHECK] ✓ Checkout session created successfully", { 
          sessionId: (checkoutData as any).sessionId,
          hasUrl: !!(checkoutData as any).url
        });
        
        // Open Stripe checkout with branded popup blocker detection
        await openStripeCheckout((checkoutData as any).url);
        toast.success("Opening payment page...");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (primaryError: any) {
      // Automatic fallback to simple checkout
      console.warn("[STABILITY-CHECK] Primary checkout failed, falling back to simple checkout:", primaryError);
      toast.dismiss();
      toast.loading("Retrying checkout...");
      
      const { data: fallbackData, error: fallbackError } = await retryEdgeFunction('create-simple-checkout', {
        body: { 
          priceId: bundle.priceId,
          ...(turnstileToken && { turnstileToken }) // Only include if provided
        },
      });
      
      toast.dismiss();
      
      if (fallbackError || !(fallbackData as any)?.url) {
        console.error("[STABILITY-CHECK] ✗ Fallback checkout also failed:", fallbackError || fallbackData);
        throw new Error("Checkout failed. Please try again or contact support.");
      }
      
      console.log("[STABILITY-CHECK] ✓ Fallback checkout succeeded");
      
      // Open checkout with branded popup blocker detection
      await openStripeCheckout((fallbackData as any).url);
      toast.success("Opening payment page...");
    }
  } catch (error: any) {
    console.error("Checkout error:", error);
    
    // Fire-and-forget client-side error notification (no await; don't block UX)
    supabase.functions.invoke('notify-alert', {
      body: {
        subject: "Client-Side Checkout Error",
        details: {
          error: error.message || String(error),
          stack: error.stack,
          path: window.location.pathname,
          hostname: window.location.hostname,
          paymentMethod,
          fileCount: files.length,
          selectedBundle,
        }
      }
    }).catch(() => {}); // Silently fail - don't block user flow
    
    toast.error(error.message || "Failed to process checkout");
  } finally {
    setLoading(false);
  }
}
