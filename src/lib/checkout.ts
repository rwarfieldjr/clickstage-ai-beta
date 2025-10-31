// @version: stable-credits-1.0 | Do not auto-modify | Core token system for ClickStagePro

import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavigateFunction } from "react-router-dom";

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

  // Check if uploaded photos exceed selected bundle limit
  const bundle = bundles.find(b => b.id === selectedBundle);
  if (bundle && files.length > bundle.photos) {
    toast.error(`You have uploaded ${files.length} photos but selected the ${bundle.name} package. Please remove ${files.length - bundle.photos} photo${files.length - bundle.photos > 1 ? 's' : ''} or select a larger package.`);
    return;
  }

  setLoading(true);

  try {
    // Handle credit payment
    if (paymentMethod === "credits" && user) {
      // Check if user has enough credits
      if (credits < files.length) {
        toast.error(`Insufficient credits. You need ${files.length} credits but only have ${credits}.`);
        setLoading(false);
        return;
      }

      // Upload files to storage
      toast.loading("Uploading photos...");
      const sessionId = crypto.randomUUID();
      
      // Get client name for filename
      const clientName = userProfile?.name || 'client';
      const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
      
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${sessionId}/${sanitizedName}_photo${index + 1}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("original-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        return fileName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      toast.dismiss();

      // Find the selected bundle to get the correct credit amount
      const bundle = bundles.find(b => b.id === selectedBundle);
      if (!bundle) {
        throw new Error("Selected bundle not found");
      }

      // Process order with credits - deduct the bundle's photo count as credits
      const { data, error } = await supabase.functions.invoke('process-credit-order', {
        body: {
          files: uploadedFiles,
          stagingStyle: stagingStyle,
          photosCount: bundle.photos,
          sessionId: sessionId,
          stagingNotes: stagingNotes,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Order placed successfully using ${data.creditsUsed} credits!`);
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
    
    // Get contact info to use in filename
    const contactData = localStorage.getItem('orderContactInfo');
    let clientName = 'guest';
    if (contactData) {
      const parsedData = JSON.parse(contactData);
      const fullName = `${parsedData.firstName || ''}_${parsedData.lastName || ''}`.trim();
      clientName = fullName || 'guest';
    } else if (userProfile?.name) {
      clientName = userProfile.name;
    }
    const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
    
    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split(".").pop();
      const fileName = user 
        ? `${user.id}/${sessionId}/${sanitizedName}_photo${index + 1}.${fileExt}`
        : `guest/${sessionId}/${sanitizedName}_photo${index + 1}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("original-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from("original-images")
        .getPublicUrl(fileName);

      return publicUrl;
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
    };

    if (orderData) {
      const parsedData = JSON.parse(orderData);
      contactInfo = {
        email: parsedData.email || user?.email || '',
        firstName: parsedData.firstName || '',
        lastName: parsedData.lastName || '',
        phoneNumber: parsedData.phoneNumber || '',
      };
    }

    // Create checkout session with all metadata
    toast.loading("Creating checkout session...");
    const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId: bundle.priceId,
        contactInfo: contactInfo,
        files: uploadedFiles,
        stagingStyle: stagingStyle,
        photosCount: bundle.photos, // Use bundle.photos for correct credit amount
        sessionId: sessionId,
      },
    });

    toast.dismiss();

    if (checkoutError) throw checkoutError;

    if (checkoutData?.url) {
      toast.success("Opening payment page...");
      window.open(checkoutData.url, '_blank');
    } else {
      throw new Error("No checkout URL received");
    }
  } catch (error: any) {
    console.error("Checkout error:", error);
    toast.error(error.message || "Failed to process checkout");
  } finally {
    setLoading(false);
  }
}
