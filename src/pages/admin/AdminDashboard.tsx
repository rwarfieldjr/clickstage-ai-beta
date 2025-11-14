import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Clock, Package, Settings, ArrowRight } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pausedUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalImages: number;
  creditsIssued: number;
  creditsUsed: number;
}

export default function AdminDashboard() {
  useRequireAdmin();
  const { isAdmin, loading } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [usersResult, ordersResult, ledgerResult] = await Promise.all([
        supabase.from("profiles").select("status", { count: "exact" }),
        supabase.from("orders").select("*", { count: "exact" }),
        supabase.from("credit_ledger").select("delta, reason"),
      ]);

      const activeUsers = usersResult.data?.filter((u) => u.status === "active").length || 0;
      const pausedUsers = usersResult.data?.filter((u) => u.status === "paused").length || 0;

      const pendingOrders = ordersResult.data?.filter((o) => o.status === "pending").length || 0;
      const completedOrders = ordersResult.data?.filter((o) => o.status === "completed").length || 0;

      const creditsIssued = ledgerResult.data?.reduce((sum, t) => 
        t.reason === "purchase" && t.delta > 0 ? sum + t.delta : sum, 0) || 0;
      const creditsUsed = ledgerResult.data?.reduce((sum, t) => 
        t.reason === "usage" && t.delta < 0 ? sum + Math.abs(t.delta) : sum, 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        activeUsers,
        pausedUsers,
        totalOrders: ordersResult.count || 0,
        pendingOrders,
        completedOrders,
        totalImages: ordersResult.data?.length || 0,
        creditsIssued,
        creditsUsed,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 space-y-6">
        <div className="bg-white shadow-xl rounded-2xl p-10">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            Welcome back, Admin!
          </h1>
          <p className="text-gray-700">
            Use the menu to the left to manage users, orders, credits, and system settings.
          </p>
        </div>

        <Card className="shadow-xl border-0 overflow-hidden relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-32 -mr-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mb-24 -ml-24" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Admin Tools</h2>
                </div>
                <p className="text-white/90 text-base mb-6 max-w-2xl">
                  Manage users, orders, credits, and system settings from a centralized dashboard
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white">Users</h3>
                    </div>
                    <p className="text-white/80 text-sm">
                      Manage accounts and permissions
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white">Orders</h3>
                    </div>
                    <p className="text-white/80 text-sm">
                      Track and manage all orders
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white">Credits</h3>
                    </div>
                    <p className="text-white/80 text-sm">
                      Monitor credit usage and history
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/admin/users')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90 font-semibold text-base px-6 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
                >
                  Manage Users
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg rounded-2xl cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate("/admin/users")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg rounded-2xl cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate("/admin/orders")}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-2xl font-bold text-gray-900">Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
