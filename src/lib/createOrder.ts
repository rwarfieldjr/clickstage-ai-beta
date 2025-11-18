import { uploadToServer } from "./uploadToServer";

export async function createOrderAndCheckout(formData: any, files: File[]) {
  try {
    const orderId = "ord_" + Math.random().toString(36).slice(2);

    const imageUrls = await uploadToServer(files, orderId);

    const payload = {
      orderId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      propertyAddress: formData.propertyAddress,
      selectedStyle: formData.selectedStyle,
      selectedBundle: formData.selectedBundle,
      imageUrls,
    };

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.error) {
      throw new Error(json.error);
    }

    window.location.href = json.url;

  } catch (err) {
    console.error("Order creation error:", err);
    alert("There was a problem creating your order. Please try again.");
  }
}
