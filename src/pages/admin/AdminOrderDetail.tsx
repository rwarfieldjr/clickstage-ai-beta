import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Link as LinkIcon, Copy } from "lucide-react";
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

      // Generate signed URLs for images
      if (data.original_image_url) {
        const originalPath = data.original_image_url.includes('storage/v1/object/public/')
          ? data.original_image_url.split('storage/v1/object/public/original-images/')[1]
          : data.original_image_url;
        
        if (originalPath) {
          const { data: signedData } = await supabase.storage
            .from('original-images')
            .createSignedUrl(originalPath, 3600);
          
          if (signedData?.signedUrl) {
            setSignedOriginalUrl(signedData.signedUrl);
          }
        }
      }

      if (data.staged_image_url) {
        const stagedPath = data.staged_image_url.includes('storage/v1/object/public/')
          ? data.staged_image_url.split('storage/v1/object/public/staged/')[1]
          : data.staged_image_url;
        
        if (stagedPath) {
          const { data: signedData } = await supabase.storage
            .from('staged')
            .createSignedUrl(stagedPath, 3600);
          
          if (signedData?.signedUrl) {
            setSignedStagedUrl(signedData.signedUrl);
          }
        }
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

  const handleUploadOriginal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${order.user_id}/${order.id}/original.${fileExt}`;

    try {
      toast.loading("Uploading original image...");
      
      const { error: uploadError } = await supabase.storage
        .from('original-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('original-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ original_image_url: publicUrl })
        .eq("id", order.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Original image uploaded successfully");
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error uploading original image:", error);
      toast.error("Failed to upload original image");
    }
  };

  const handleUploadStaged = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order || !e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${order.user_id}/${order.id}/staged.${fileExt}`;

    try {
      toast.loading("Uploading staged image...");
      
      const { error: uploadError } = await supabase.storage
        .from('staged')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('staged')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ staged_image_url: publicUrl })
        .eq("id", order.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Staged image uploaded successfully");
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error uploading staged image:", error);
      toast.error("Failed to upload staged image");
    }
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
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

  const handleDeleteOriginal = async () => {
    if (!order || !order.original_image_url) return;

    if (!confirm("Are you sure you want to delete the original image?")) return;

    try {
      toast.loading("Deleting original image...");

      const originalPath = order.original_image_url.includes('storage/v1/object/public/')
        ? order.original_image_url.split('storage/v1/object/public/original-images/')[1]
        : order.original_image_url;

      if (originalPath) {
        const { error: deleteError } = await supabase.storage
          .from('original-images')
          .remove([originalPath]);

        if (deleteError) throw deleteError;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({ original_image_url: null })
        .eq("id", order.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Original image deleted successfully");
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting original image:", error);
      toast.error("Failed to delete original image");
    }
  };

  const handleDeleteStaged = async () => {
    if (!order || !order.staged_image_url) return;

    if (!confirm("Are you sure you want to delete the staged image?")) return;

    try {
      toast.loading("Deleting staged image...");

      const stagedPath = order.staged_image_url.includes('storage/v1/object/public/')
        ? order.staged_image_url.split('storage/v1/object/public/staged/')[1]
        : order.staged_image_url;

      if (stagedPath) {
        const { error: deleteError } = await supabase.storage
          .from('staged')
          .remove([stagedPath]);

        if (deleteError) throw deleteError;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({ staged_image_url: null })
        .eq("id", order.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success("Staged image deleted successfully");
      await fetchOrder();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting staged image:", error);
      toast.error("Failed to delete staged image");
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              {signedOriginalUrl ? (
                <>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={signedOriginalUrl}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownloadImage(signedOriginalUrl, `original-${order.id}.jpg`)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={signedOriginalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full
                      </a>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteOriginal}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Loading image...</p>
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="upload-original" className="block mb-2 text-sm font-medium">
                  Upload Original Image
                </label>
                <div className="flex gap-2">
                  <Input
                    id="upload-original"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadOriginal}
                    className="flex-1"
                  />
                  <Button variant="secondary" asChild>
                    <label htmlFor="upload-original" className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staged Image</CardTitle>
            </CardHeader>
            <CardContent>
              {signedStagedUrl ? (
                <>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={signedStagedUrl}
                      alt="Staged"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownloadImage(signedStagedUrl, `staged-${order.id}.jpg`)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={signedStagedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full
                      </a>
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteStaged}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </>
              ) : order.staged_image_url ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Loading image...</p>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">No staged image available</p>
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="upload-staged" className="block mb-2 text-sm font-medium">
                  Upload Staged Image
                </label>
                <div className="flex gap-2">
                  <Input
                    id="upload-staged"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadStaged}
                    className="flex-1"
                  />
                  <Button variant="secondary" asChild>
                    <label htmlFor="upload-staged" className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
