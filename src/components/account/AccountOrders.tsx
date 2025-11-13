import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Order {
  id: string;
  original_image_url: string;
  staged_image_url: string | null;
  staging_style: string;
  status: string;
  property_address: string;
  created_at: string;
}

interface AccountOrdersProps {
  user: any;
}

export default function AccountOrders({ user }: AccountOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
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
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  const viewImage = (url: string) => {
    window.open(url, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No orders yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Start your first virtual staging project today
        </p>
        <Button onClick={() => window.location.href = "/upload"} className="bg-blue-600 hover:bg-blue-700">
          Create New Order
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Your Orders
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          View and download your original and staged photos
        </p>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0 w-full lg:w-64 space-y-4">
                  <div>
                    <img
                      src={order.original_image_url}
                      alt="Original"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                      Original Photo
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewImage(order.original_image_url)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(order.original_image_url, `original-${order.id}.jpg`)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {order.staged_image_url && (
                    <div>
                      <img
                        src={order.staged_image_url}
                        alt="Staged"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                        Staged Photo
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewImage(order.staged_image_url!)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadImage(order.staged_image_url!, `staged-${order.id}.jpg`)}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Property Address
                      </p>
                      <p className="text-base text-slate-900 dark:text-slate-100">
                        {order.property_address || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Staging Style
                      </p>
                      <p className="text-base text-slate-900 dark:text-slate-100">
                        {order.staging_style}
                      </p>
                    </div>

                    {order.status === "pending" && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          Your order is being processed. Staged photos will be ready within 24 hours.
                        </p>
                      </div>
                    )}

                    {order.status === "completed" && order.staged_image_url && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-900 dark:text-green-100">
                          ✓ Your staged photos are ready! Download them above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
