import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const orderId = formData.get("orderId")?.toString() || "";
    const fileCount = Number(formData.get("fileCount") || "0");

    const urls: string[] = [];

    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File;

      if (!file) continue;

      const fileName = `${orderId}/${crypto.randomUUID()}-${file.name}`;

      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const { error } = await supabase.storage
        .from("uploads")
        .upload(fileName, fileData, {
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

    return new Response(
      JSON.stringify({ urls }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
