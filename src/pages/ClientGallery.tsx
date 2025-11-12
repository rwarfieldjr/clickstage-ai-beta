import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ExternalLink, Archive } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JSZip from "jszip";

interface OrderImage {
  id: string;
  image_url: string;
  file_name: string;
  image_type: string;
}

interface OrderData {
  order_number: string;
  staging_style: string;
  created_at: string;
}

export default function ClientGallery() {
  const { token } = useParams();
  const [images, setImages] = useState<OrderImage[]>([]);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      fetchGalleryData();
    }
  }, [token]);

  const fetchGalleryData = async () => {
    try {
      // Verify token and get order_id
      const { data: linkData, error: linkError } = await supabase
        .from("shareable_links")
        .select("order_id, expires_at")
        .eq("token", token)
        .single();

      if (linkError || !linkData) {
        toast.error("Invalid or expired link");
        setLoading(false);
        return;
      }

      if (new Date(linkData.expires_at) < new Date()) {
        toast.error("This link has expired");
        setLoading(false);
        return;
      }

      // Update access count and last accessed
      const { data: currentData } = await supabase
        .from("shareable_links")
        .select("accessed_count")
        .eq("token", token)
        .single();

      await supabase
        .from("shareable_links")
        .update({
          accessed_count: (currentData?.accessed_count || 0) + 1,
          last_accessed: new Date().toISOString(),
        })
        .eq("token", token);

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("order_number, staging_style, created_at")
        .eq("id", linkData.order_id)
        .single();

      if (orderError || !order) throw orderError;
      setOrderData(order);

      // Get staged images
      const { data: orderImages, error: imagesError } = await supabase
        .from("order_images")
        .select("*")
        .eq("order_id", linkData.order_id)
        .eq("image_type", "staged")
        .order("created_at", { ascending: true });

      if (imagesError) throw imagesError;
      setImages(orderImages || []);

      // Generate signed URLs for all images
      const urls: Record<string, string> = {};
      for (const img of orderImages || []) {
        const path = img.image_url.includes("storage/v1/object/public/")
          ? img.image_url.split("storage/v1/object/public/staged/")[1]
          : img.image_url;

        if (path) {
          const { data: signedData } = await supabase.storage
            .from("staged")
            .createSignedUrl(path, 3600);

          if (signedData?.signedUrl) {
            urls[img.id] = signedData.signedUrl;
          }
        }
      }
      setSignedUrls(urls);
    } catch (error: any) {
      console.error("Error fetching gallery:", error);
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
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

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    try {
      toast.loading(`Preparing ${images.length} images for download...`);

      const zip = new JSZip();
      const folder = zip.folder(`Order-${orderData?.order_number || "images"}`);

      // Fetch all images and add to ZIP
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const url = signedUrls[img.id];
        
        if (url) {
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            
            // Add to ZIP with sequential numbering if files have same name
            const fileName = `${i + 1}-${img.file_name}`;
            folder?.file(fileName, blob);
            
            toast.loading(`Adding image ${i + 1} of ${images.length}...`);
          } catch (error) {
            console.error(`Failed to fetch image ${img.file_name}:`, error);
          }
        }
      }

      toast.loading("Creating ZIP file...");
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      // Download ZIP
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${orderData?.order_number || "staged-images"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.dismiss();
      toast.success("All images downloaded as ZIP!");
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast.dismiss();
      toast.error("Failed to create ZIP file");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your images...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Link Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This gallery link is invalid or has expired.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Staged Images Are Ready!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">{orderData.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Style</p>
                  <p className="font-medium capitalize">{orderData.staging_style}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Images</p>
                  <p className="font-medium">{images.length} staged images</p>
                </div>
              </div>
              {images.length > 1 && (
                <Button onClick={handleDownloadAll} className="w-full" size="lg">
                  <Archive className="mr-2 h-5 w-5" />
                  Download All as ZIP ({images.length} images)
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <Card key={image.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {signedUrls[image.id] ? (
                      <img
                        src={signedUrls[image.id]}
                        alt={image.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium truncate">{image.file_name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload(signedUrls[image.id], image.file_name)
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={signedUrls[image.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {images.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  No staged images available yet. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
