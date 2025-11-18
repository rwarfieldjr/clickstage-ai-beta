export async function uploadToServer(files: File[], orderId: string) {
  console.log("[UPLOAD-TO-SERVER] Starting upload to Supabase...");
  console.log("[UPLOAD-TO-SERVER] Order ID:", orderId);
  console.log("[UPLOAD-TO-SERVER] Files to upload:", files.length);

  const form = new FormData();
  form.append("orderId", orderId);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[UPLOAD-TO-SERVER] Adding file ${i + 1}:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });
    form.append("files", file);
  }

  console.log("[UPLOAD-TO-SERVER] Sending upload request to /api/upload...");
  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  console.log("[UPLOAD-TO-SERVER] Upload response status:", res.status);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[UPLOAD-TO-SERVER] ❌ Upload failed:", err);
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  console.log("[UPLOAD-TO-SERVER] ✓ Upload successful. URLs received:", data.urls);
  return data.urls as string[];
}
