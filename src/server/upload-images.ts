import { supabase } from "../lib/supabase";
import { randomUUID } from "crypto";

export default async function uploadImages(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const formData = await req.formData();
    const orderId = formData.get("orderId");
    const fileCount = Number(formData.get("fileCount"));

    const urls: string[] = [];

    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File;

      if (!file) continue;

      const fileName = `${orderId}/${randomUUID()}-${file.name}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(fileName, buffer, {
          contentType: file.type,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      const { data: publicUrl } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      urls.push(publicUrl.publicUrl);
    }

    return res.json({ urls });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
