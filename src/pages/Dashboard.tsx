import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { format } from "date-fns";

interface Order {
  id: string;
  original_image_url: string;
  staged_image_url: string | null;
  staging_style: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Your Orders</CardTitle>
              <CardDescription>
                View and manage all your staging orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    You don't have any orders yet
                  </p>
                  <a
                    href="/upload"
                    className="text-accent hover:underline font-medium"
                  >
                    Upload your first photo →
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Original</TableHead>
                        <TableHead>Staged</TableHead>
                        <TableHead>Style</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <img
                              src={order.original_image_url}
                              alt="Original"
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </TableCell>
                          <TableCell>
                            {order.staged_image_url ? (
                              <img
                                src={order.staged_image_url}
                                alt="Staged"
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                                Pending
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            {order.staging_style}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;