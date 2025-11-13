import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";

interface Order {
  id: string;
  status: string;
  created_at: string;
  original_url: string | null;
  staged_url: string | null;
  style: string | null;
}

export default function OrdersPage() {
  const { user, loading: userLoading } = useRequireUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      load();
    }
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 bg-white shadow-xl rounded-2xl p-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">View and download your staged photos</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No orders yet.</p>
            <p className="text-gray-500 mt-2">Your staged photos will appear here once you place an order.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Order #{order.id.slice(0, 8)}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {order.style && (
                    <p className="text-sm text-gray-600 mb-4">
                      Style: <span className="font-medium">{order.style}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {order.original_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(order.original_url!, "_blank")}
                      >
                        <Download className="w-4 h-4" />
                        Download Original
                      </Button>
                    )}

                    {order.staged_url && (
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open(order.staged_url!, "_blank")}
                      >
                        <Download className="w-4 h-4" />
                        Download Staged
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
