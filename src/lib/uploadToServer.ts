export async function uploadToServer(files: File[], orderId: string) {
  const form = new FormData();
  form.append("orderId", orderId);

  for (const file of files) {
    form.append("files", file);
  }

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.urls as string[];
}
