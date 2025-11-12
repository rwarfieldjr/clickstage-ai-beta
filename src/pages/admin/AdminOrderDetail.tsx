import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Link as LinkIcon, Copy, Download, ExternalLink, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import ImageDropzone from "@/components/ImageDropzone";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderDetail {
  id: string;
  created_at: string;
  status: string;
  staging_style: string;
  original_image_url: string;
  staged_image_url: string | null;
  credits_used: number | null;
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
  const [showEmailDialog, setShowEmailDialog] = useState(false);
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
        .single();

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

      toast.success(`Order status updated to ${newStatus}`);
      await fetchOrder();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleUploadImages = async (files: File[], type: "original" | "staged") => {
    if (!order) return;

    try {
      toast.loading(`Uploading ${files.length} ${type} image(s)...`);

      const bucket = type === "original" ? "original-images" : "staged";
      const uploadedImages = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const timestamp = Date.now();
        const fileName = `${order.user_id}/${order.id}/${type}-${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        // Save to order_images table
        const { error: insertError } = await supabase
          .from("order_images")
          .insert({
            order_id: order.id,
            image_type: type,
            image_url: publicUrl,
            file_name: file.name,
            file_size: file.size,
          });

        if (insertError) throw insertError;
        uploadedImages.push(publicUrl);
      }

      toast.dismiss();
      toast.success(`Successfully uploaded ${files.length} ${type} image(s)`);
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
      console.error(`Error uploading ${type} images:`, error);
      toast.error(`Failed to upload ${type} images`);
    }
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDeleteImage = async (imageId: string, imageType: string, imageUrl: string) => {
    if (!confirm(`Are you sure you want to delete this ${imageType} image?`)) return;

    try {
      toast.loading("Deleting image...");

      const bucket = imageType === "original" ? "original-images" : "staged";
      const path = imageUrl.includes("storage/v1/object/public/")
        ? imageUrl.split(`storage/v1/object/public/${bucket}/`)[1]
        : imageUrl;

      if (path) {
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (deleteError) throw deleteError;
      }

      const { error: dbError } = await supabase
        .from("order_images")
        .delete()
        .eq("id", imageId);

      if (dbError) throw dbError;

      toast.dismiss();
      toast.success("Image deleted successfully");
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
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
      toast.success("Share link generated!");
    } catch (error: any) {
      console.error("Error generating share link:", error);
      toast.error("Failed to generate share link");
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const sendCompletionEmail = async () => {
    if (!order || !shareLink) {
      toast.error("Please generate a share link first");
      return;
    }

    try {
      const token = shareLink.split("/gallery/")[1];

      const { error } = await supabase.functions.invoke("send-staging-complete-email", {
        body: {
          orderId: order.id,
          shareToken: token,
        },
      });

      if (error) throw error;

      toast.success("Completion email sent to client!");
      setShowEmailDialog(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin || !order) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={toggleOrderStatus}
                  >
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Style</p>
                  <p className="font-medium capitalize">{order.staging_style}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits Used</p>
                  <p className="font-medium">{order.credits_used || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.profiles.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{order.profiles.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{order.profiles.phone || "N/A"}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/admin/users/${order.user_id}`)}
              >
                View User Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Original Images ({originalImages.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageDropzone
                onFilesSelected={(files) => handleUploadImages(files, "original")}
                multiple={true}
              />

              <div className="grid grid-cols-1 gap-4 mt-4">
                {originalImages.map((img) => (
                  <div key={img.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted">
                      {signedUrls[img.id] && (
                        <img
                          src={signedUrls[img.id]}
                          alt={img.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium truncate">{img.file_name}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadImage(signedUrls[img.id], img.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={signedUrls[img.id]} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteImage(img.id, img.image_type, img.image_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Staged Images ({stagedImages.length})</CardTitle>
              <div className="flex gap-2">
                {!shareLink && stagedImages.length > 0 && (
                  <Button size="sm" variant="outline" onClick={generateShareLink}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Generate Link
                  </Button>
                )}
                {stagedImages.length > 0 && (
                  <Button size="sm" onClick={() => setShowEmailDialog(true)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Client
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareLink && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Share Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-background border rounded"
                    />
                    <Button size="sm" variant="outline" onClick={copyShareLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <ImageDropzone
                onFilesSelected={(files) => handleUploadImages(files, "staged")}
                multiple={true}
              />

              <div className="grid grid-cols-1 gap-4 mt-4">
                {stagedImages.map((img) => (
                  <div key={img.id} className="border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted">
                      {signedUrls[img.id] && (
                        <img
                          src={signedUrls[img.id]}
                          alt={img.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium truncate">{img.file_name}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadImage(signedUrls[img.id], img.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={signedUrls[img.id]} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteImage(img.id, img.image_type, img.image_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Staging Complete Email</AlertDialogTitle>
            <AlertDialogDescription>
              This will send an email to {order.profiles.email} with a link to view and download
              their staged images. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendCompletionEmail}>Send Email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
