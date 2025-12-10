import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Download, Trash2, Upload, Calendar, Check } from "lucide-react";
import JSZip from "jszip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import ImageDropzone from "@/components/ImageDropzone";

interface OrderDetail {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  staging_style: string;
  original_image_url: string;
  staged_image_url: string | null;
  user_id: string;
  profiles: {
    name: string;
    email: string;
    phone: string | null;
  };
}

interface OrderImage {
  id: string;
  image_url: string;
  file_name: string;
  image_type: string;
  file_size: number;
  created_at: string;
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { isAdmin, loading, requireAdmin } = useAdmin();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [originalImages, setOriginalImages] = useState<OrderImage[]>([]);
  const [stagedImages, setStagedImages] = useState<OrderImage[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [shareLink, setShareLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    requireAdmin();
  }, [isAdmin, loading]);

  useEffect(() => {
    if (isAdmin && id) {
      fetchOrder();
    }
  }, [isAdmin, id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles (
            name,
            email,
            phone
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);

      // Fetch order images
      const { data: images, error: imagesError } = await supabase
        .from("order_images")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true });

      if (imagesError) throw imagesError;

      const original = images?.filter((img) => img.image_type === "original") || [];
      const staged = images?.filter((img) => img.image_type === "staged") || [];

      setOriginalImages(original);
      setStagedImages(staged);

      // Generate signed URLs
      const urls: Record<string, string> = {};
      for (const img of images || []) {
        const bucket = img.image_type === "original" ? "original-images" : "staged";
        const path = img.image_url.includes("storage/v1/object/public/")
          ? img.image_url.split(`storage/v1/object/public/${bucket}/`)[1]
          : img.image_url;

        if (path) {
          const { data: signedData } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);

          if (signedData?.signedUrl) {
            urls[img.id] = signedData.signedUrl;
          }
        }
      }
      setSignedUrls(urls);

      // Check for existing share link
      const { data: linkData } = await supabase
        .from("shareable_links")
        .select("token")
        .eq("order_id", id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (linkData) {
        setShareLink(`${window.location.origin}/gallery/${linkData.token}`);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  const toggleOrderStatus = async () => {
    if (!order) return;

    try {
      const newStatus = order.status === "pending" ? "completed" : "pending";

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      toast.success(`Order marked as ${newStatus}`);
      await fetchOrder();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleUploadStagedImages = async (files: File[]) => {
    if (!order) return;

    try {
      toast.loading(`Uploading ${files.length} staged image(s)...`);

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const fileName = `${order.user_id}/${order.id}/staged-${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("staged")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("staged")
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from("order_images")
          .insert({
            order_id: order.id,
            image_type: "staged",
            image_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
          });

        if (insertError) throw insertError;
      }

      toast.dismiss();
      toast.success(`Uploaded ${files.length} staged image(s)`);
      
      // Auto-generate share link if none exists
      if (!shareLink) {
        await generateShareLink();
      }
      
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error uploading staged images:", error);
      toast.error("Failed to upload images");
    }
  };

  const handleDownloadAllOriginal = async () => {
    if (originalImages.length === 0) return;

    try {
      toast.loading("Preparing download...");

      const zip = new JSZip();
      const folder = zip.folder(`${order?.order_number || order?.id}-original`);

      for (let i = 0; i < originalImages.length; i++) {
        const img = originalImages[i];
        const url = signedUrls[img.id];

        if (url) {
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            folder?.file(`${i + 1}-${img.file_name}`, blob);
          } catch (error) {
            console.error(`Failed to fetch image ${img.file_name}:`, error);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${order?.order_number || order?.id}-original-images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.dismiss();
      toast.success("Download complete!");
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast.dismiss();
      toast.error("Failed to create download");
    }
  };

  const handleDeleteImage = async (imageId: string, imageType: string, imageUrl: string) => {
    if (!confirm(`Delete this ${imageType} image?`)) return;

    try {
      const bucket = imageType === "original" ? "original-images" : "staged";
      const path = imageUrl.includes("storage/v1/object/public/")
        ? imageUrl.split(`storage/v1/object/public/${bucket}/`)[1]
        : imageUrl;

      if (path) {
        await supabase.storage.from(bucket).remove([path]);
      }

      await supabase.from("order_images").delete().eq("id", imageId);

      toast.success("Image deleted");
      await fetchOrder();
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const generateShareLink = async () => {
    if (!order) return;

    try {
      const token = crypto.randomUUID();

      const { error } = await supabase
        .from("shareable_links")
        .insert({
          order_id: order.id,
          token,
        });

      if (error) throw error;

      const link = `${window.location.origin}/gallery/${token}`;
      setShareLink(link);
      return link;
    } catch (error: any) {
      console.error("Error generating share link:", error);
      return null;
    }
  };

  const copyShareLink = async () => {
    let link = shareLink;
    
    if (!link) {
      link = await generateShareLink() || "";
    }
    
    if (link) {
      navigator.clipboard.writeText(link);
      setLinkCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin || !order) {
    return null;
  }

  const latestStagedUpload = stagedImages.length > 0 
    ? new Date(stagedImages[stagedImages.length - 1].created_at).toLocaleString()
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        {/* Order Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{order.order_number || order.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <Badge 
            variant={order.status === "completed" ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 text-sm px-4 py-1"
            onClick={toggleOrderStatus}
          >
            {order.status}
          </Badge>
        </div>

        {/* Customer Info Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.profiles.name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.profiles.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{order.profiles.phone || "Not provided"}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Style Requested</p>
              <p className="font-medium capitalize">{order.staging_style}</p>
            </div>
          </CardContent>
        </Card>

        {/* Share Link - Prominent Section */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-medium">Customer Gallery Link</p>
                <p className="text-sm text-muted-foreground">
                  {shareLink ? "Copy this link to include in the Staging Complete email" : "Upload staged images to generate a link"}
                </p>
              </div>
              <Button 
                onClick={copyShareLink}
                disabled={stagedImages.length === 0 && !shareLink}
                className="shrink-0"
              >
                {linkCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
            {shareLink && (
              <div className="mt-3 p-2 bg-background rounded border text-sm font-mono break-all">
                {shareLink}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Original Images */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Submitted Images ({originalImages.length})
              </CardTitle>
              {originalImages.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleDownloadAllOriginal}>
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {originalImages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No images submitted</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {originalImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {signedUrls[img.id] && (
                        <img
                          src={signedUrls[img.id]}
                          alt={img.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = signedUrls[img.id];
                          link.download = img.file_name;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(img.id, img.image_type, img.image_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staged Images */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Staged Images ({stagedImages.length})
                </CardTitle>
                {latestStagedUpload && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last upload: {latestStagedUpload}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageDropzone
              onFilesSelected={handleUploadStagedImages}
              multiple={true}
            />

            {stagedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {stagedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {signedUrls[img.id] && (
                        <img
                          src={signedUrls[img.id]}
                          alt={img.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(img.id, img.image_type, img.image_url)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
