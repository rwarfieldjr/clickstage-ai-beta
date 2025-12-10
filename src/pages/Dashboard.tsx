import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { Download, Copy, ExternalLink, Image, Check, Archive } from "lucide-react";
import JSZip from "jszip";

interface Order {
  id: string;
  order_number: string;
  original_image_url: string;
  staged_image_url: string | null;
  staging_style: string;
  status: string;
  created_at: string;
}

interface OrderImage {
  id: string;
  image_url: string;
  file_name: string;
  image_type: string;
}

interface OrderWithDetails extends Order {
  signedOriginalUrl?: string;
  signedStagedUrl?: string;
  stagedImages: OrderImage[];
  signedStagedUrls: Record<string, string>;
  shareLink?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchOrders(session.user.id);
      }
    });
  }, [navigate]);

  const fetchOrders = async (userId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all order images and share links in parallel
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const orderWithDetails: OrderWithDetails = {
            ...order,
            stagedImages: [],
            signedStagedUrls: {},
          };

          // Get staged images from order_images table
          const { data: orderImages } = await supabase
            .from("order_images")
            .select("*")
            .eq("order_id", order.id)
            .eq("image_type", "staged");

          orderWithDetails.stagedImages = orderImages || [];

          // Get share link if exists
          const { data: linkData } = await supabase
            .from("shareable_links")
            .select("token, expires_at")
            .eq("order_id", order.id)
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

          if (linkData) {
            orderWithDetails.shareLink = `${window.location.origin}/gallery/${linkData.token}`;
          }

          // Generate signed URLs for staged images
          for (const img of orderWithDetails.stagedImages) {
            const path = img.image_url.includes("storage/v1/object/public/")
              ? img.image_url.split("storage/v1/object/public/staged/")[1]
              : img.image_url;

            if (path) {
              const { data: signedData } = await supabase.storage
                .from("staged")
                .createSignedUrl(path, 3600);

              if (signedData?.signedUrl) {
                orderWithDetails.signedStagedUrls[img.id] = signedData.signedUrl;
              }
            }
          }

          // Get signed URL for original image (first image preview)
          if (order.original_image_url) {
            const originalPath = order.original_image_url.includes("storage/v1/object/public/")
              ? order.original_image_url.split("storage/v1/object/public/original-images/")[1]
              : order.original_image_url;

            if (originalPath) {
              const { data: signedData } = await supabase.storage
                .from("original-images")
                .createSignedUrl(originalPath, 3600);

              if (signedData?.signedUrl) {
                orderWithDetails.signedOriginalUrl = signedData.signedUrl;
              }
            }
          }

          return orderWithDetails;
        })
      );

      setOrders(ordersWithDetails);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (order: OrderWithDetails) => {
    try {
      let linkToCopy = order.shareLink;

      // If no share link exists, create one
      if (!linkToCopy) {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error: insertError } = await supabase.from("shareable_links").insert({
          order_id: order.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

        if (insertError) throw insertError;

        linkToCopy = `${window.location.origin}/gallery/${token}`;

        // Update the order in state with new link
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, shareLink: linkToCopy } : o
          )
        );
      }

      await navigator.clipboard.writeText(linkToCopy);
      setCopiedOrderId(order.id);
      toast.success("Link copied to clipboard!");

      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadImage = async (url: string, fileName: string) => {
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
      toast.success("Image downloaded");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDownloadAll = async (order: OrderWithDetails) => {
    if (order.stagedImages.length === 0) return;

    setDownloadingOrderId(order.id);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`${order.order_number}-staged`);

      for (let i = 0; i < order.stagedImages.length; i++) {
        const img = order.stagedImages[i];
        const url = order.signedStagedUrls[img.id];

        if (url) {
          const response = await fetch(url);
          const blob = await response.blob();
          folder?.file(`${i + 1}-${img.file_name}`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${order.order_number}-staged.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("All images downloaded!");
    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error("Failed to download images");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      pending: { variant: "secondary", label: "Processing" },
      in_progress: { variant: "default", label: "In Progress" },
      completed: { variant: "default", label: "Ready" },
    };

    const { variant, label } = config[status] || { variant: "default", label: status };

    return (
      <Badge variant={variant} className={status === "completed" ? "bg-green-600 hover:bg-green-700" : ""}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Your Orders</h1>
            <p className="text-muted-foreground mt-1">
              View your staged images and download or share them with others
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={() => user && fetchOrders(user.id)}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Image className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first photo to get started with virtual staging
                </p>
                <Button onClick={() => navigate("/upload")}>Upload Photos</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-3">
                          {order.order_number}
                          {getStatusBadge(order.status)}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(order.created_at), "MMMM d, yyyy")} · {order.staging_style}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {order.status === "completed" && order.stagedImages.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(order)}
                            >
                              {copiedOrderId === order.id ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {copiedOrderId === order.id ? "Copied!" : "Copy Link"}
                            </Button>
                            {order.stagedImages.length > 1 && (
                              <Button
                                size="sm"
                                onClick={() => handleDownloadAll(order)}
                                disabled={downloadingOrderId === order.id}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                {downloadingOrderId === order.id ? "Downloading..." : "Download All"}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {order.status === "completed" && order.stagedImages.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {order.stagedImages.map((img) => (
                          <div key={img.id} className="group relative">
                            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                              {order.signedStagedUrls[img.id] ? (
                                <img
                                  src={order.signedStagedUrls[img.id]}
                                  alt={img.file_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  handleDownloadImage(order.signedStagedUrls[img.id], img.file_name)
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="secondary" asChild>
                                <a
                                  href={order.signedStagedUrls[img.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              {img.file_name}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : order.status === "completed" ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Your staged images will appear here once ready.</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 py-4">
                        <div className="w-24 h-18 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {order.signedOriginalUrl ? (
                            <img
                              src={order.signedOriginalUrl}
                              alt="Original"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Your photos are being staged</p>
                          <p className="text-sm text-muted-foreground">
                            We'll notify you when your images are ready
                          </p>
                        </div>
                      </div>
                    )}

                    {order.shareLink && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Share link:</span>
                          <code className="flex-1 text-xs bg-background px-2 py-1 rounded truncate">
                            {order.shareLink}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(order)}
                          >
                            {copiedOrderId === order.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
