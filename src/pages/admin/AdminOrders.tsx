import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, UploadCloud } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface OrderWithUser {
  id: string;
  created_at: string;
  status: string;
  staging_style: string;
  user_id: string;
  archived: boolean;
  profiles: {
    name: string;
    email: string;
  };
}

export default function AdminOrders() {
  useRequireAdmin();
  const { isAdmin, loading, requireAdmin, shouldRenderAdmin } = useAdmin();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    requireAdmin();
  }, [isAdmin, loading]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, orders, showArchived]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const filterOrders = () => {
    let filtered = orders.filter(order => showArchived ? order.archived : !order.archived);
    
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const toggleOrderStatus = async (orderId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "pending" ? "completed" : "pending";
      
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus}`);
      await fetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    }
  };

  const toggleArchiveStatus = async (orderId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ archived: !isArchived })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(isArchived ? "Order unarchived" : "Order archived");
      await fetchOrders();
    } catch (error: any) {
      console.error("Error archiving order:", error);
      toast.error("Failed to archive order");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <Button onClick={() => navigate("/admin/bulk-upload")}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, user name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(!showArchived)}
              size="sm"
            >
              {showArchived ? "Show Active Orders" : "Show Archived Orders"}
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Style</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{order.profiles?.name}</TableCell>
                  <TableCell>{order.profiles?.email}</TableCell>
                  <TableCell className="capitalize">{order.staging_style}</TableCell>
                  <TableCell>
                    <Badge 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => toggleOrderStatus(order.id, order.status)}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleArchiveStatus(order.id, order.archived)}
                      >
                        {order.archived ? "Unarchive" : "Archive"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
