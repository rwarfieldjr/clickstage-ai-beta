import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRequireUser } from "@/hooks/useRequireUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, ExternalLink } from "lucide-react";

interface StagingOrder {
  id: string;
  user_id: string;
  bundle_selected: string;
  staging_style: string | null;
  address_of_property: string;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OriginalPhoto {
  id: string;
  file_path: string;
  file_name: string;
  uploaded_at: string;
}

interface StagedPhoto {
  id: string;
  file_path: string;
  file_name: string;
  uploaded_at: string;
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useRequireUser();
  const [order, setOrder] = useState<StagingOrder | null>(null);
  const [originalPhotos, setOriginalPhotos] = useState<OriginalPhoto[]>([]);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!user || !orderId) return;

      try {
        const { data: orderData, error: orderError } = await supabase
          .from("staging_orders")
          .select("*")
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        const { data: originalData, error: originalError } = await supabase
          .from("staging_original_photos")
          .select("*")
          .eq("order_id", orderId)
          .order("uploaded_at", { ascending: true });

        if (originalError) throw originalError;
        setOriginalPhotos(originalData || []);

        const { data: stagedData, error: stagedError } = await supabase
          .from("staging_staged_photos")
          .select("*")
          .eq("order_id", orderId)
          .order("uploaded_at", { ascending: true });

        if (stagedError) throw stagedError;
        setStagedPhotos(stagedData || []);
      } catch (error) {
        console.error("Error loading order:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadOrder();
    }
  }, [user, orderId]);

  const downloadImage = async (filePath: string, fileName: string, bucket: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const getImageUrl = (filePath: string, bucket: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg mb-4">Order not found</p>
        <Button onClick={() => navigate("/account/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/account/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{order.id.slice(0, 13)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property Address</p>
                  <p className="font-medium">{order.address_of_property}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bundle</p>
                  <p className="font-medium capitalize">{order.bundle_selected}</p>
                </div>
                {order.staging_style && (
                  <div>
                    <p className="text-sm text-muted-foreground">Style</p>
                    <p className="font-medium capitalize">{order.staging_style}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {order.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Original Photos ({originalPhotos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {originalPhotos.length === 0 ? (
                <p className="text-gray-500 text-sm">No original photos</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {originalPhotos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                      <div className="aspect-video bg-muted">
                        <img
                          src={getImageUrl(photo.file_path, "staging-originals")}
                          alt={photo.file_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm font-medium truncate">{photo.file_name}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadImage(photo.file_path, photo.file_name, "staging-originals")
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={getImageUrl(photo.file_path, "staging-originals")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staged Photos ({stagedPhotos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {stagedPhotos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">No staged photos yet</p>
                  <p className="text-gray-400 text-xs">
                    Your staged photos will appear here once they're ready
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {stagedPhotos.map((photo) => (
                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                      <div className="aspect-video bg-muted">
                        <img
                          src={getImageUrl(photo.file_path, "staging-staged")}
                          alt={photo.file_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm font-medium truncate">{photo.file_name}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              downloadImage(photo.file_path, photo.file_name, "staging-staged")
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={getImageUrl(photo.file_path, "staging-staged")}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
