import { uploadToServer } from "./uploadToServer";

export async function createOrderAndCheckout(formData: any, files: File[]) {
  console.log("[CREATE-ORDER] Starting order creation process...");
  console.log("[CREATE-ORDER] Form data received:", formData);
  console.log("[CREATE-ORDER] Files count:", files.length);

  try {
    const orderId = "ord_" + Math.random().toString(36).slice(2);
    console.log("[CREATE-ORDER] Generated order ID:", orderId);

    console.log("[CREATE-ORDER] Starting Supabase upload...");
    const imageUrls = await uploadToServer(files, orderId);
    console.log("[CREATE-ORDER] ✓ Supabase upload complete. Image URLs:", imageUrls);

    const payload = {
      orderId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      propertyAddress: formData.propertyAddress,
      selectedStyle: formData.selectedStyle,
      selectedBundle: formData.selectedBundle,
      imageUrls,
    };

    console.log("[CREATE-ORDER] Payload prepared:", payload);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log("[CREATE-ORDER] Calling create-checkout-session edge function...");
    const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(payload)
    });

    console.log("[CREATE-ORDER] Edge function response status:", res.status);
    const json = await res.json();
    console.log("[CREATE-ORDER] Edge function response:", json);

    if (json.error) {
      console.error("[CREATE-ORDER] ❌ Edge function returned error:", json.error);
      throw new Error(json.error);
    }

    console.log("[CREATE-ORDER] ✓ Stripe checkout URL received:", json.url);
    console.log("[CREATE-ORDER] Redirecting to Stripe...");
    window.location.href = json.url;

  } catch (err) {
    console.error("[CREATE-ORDER] ❌ Order creation error:", err);
    alert("There was a problem creating your order. Please try again.");
  }
}
