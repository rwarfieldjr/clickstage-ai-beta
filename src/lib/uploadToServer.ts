export async function uploadToServer(files: File[], orderId: string) {
  console.log("[UPLOAD-TO-SERVER] Starting upload to Supabase...");
  console.log("[UPLOAD-TO-SERVER] Order ID:", orderId);
  console.log("[UPLOAD-TO-SERVER] Files to upload:", files.length);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[UPLOAD-TO-SERVER] ❌ Missing Supabase credentials");
    throw new Error("Supabase configuration missing");
  }

  const form = new FormData();
  form.append("orderId", orderId);
  form.append("fileCount", files.length.toString());

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[UPLOAD-TO-SERVER] Adding file ${i + 1}:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });
    form.append(`file_${i}`, file);
  }

  const uploadUrl = `${supabaseUrl}/functions/v1/upload-images`;
  console.log("[UPLOAD-TO-SERVER] Sending upload request to:", uploadUrl);

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: form,
  });

  console.log("[UPLOAD-TO-SERVER] Upload response status:", res.status);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[UPLOAD-TO-SERVER] ❌ Upload failed:", err);
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  console.log("[UPLOAD-TO-SERVER] ✓ Upload successful. Response:", data);

  // The upload-images function returns { urls: [...] }
  return data.urls as string[];
}
