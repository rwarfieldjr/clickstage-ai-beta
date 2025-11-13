import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, ImageIcon, CreditCard, Activity, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Mail, Database,
  ExternalLink, RefreshCw
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  totalCreditsSold: number;
  totalCreditsConsumed: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentUploads: any[];
  recentCompletions: any[];
  recentErrors: any[];
  recentPayments: any[];
}

export default function AdminDashboardNew() {
  const { user, isAdmin, isLoading } = useRequireAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin, isLoading]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        usersCount,
        creditsData,
        ordersData,
        recentOrdersData,
        recentPaymentsData,
        auditData
      ] = await Promise.all([
        // Total users
        supabase.from("profiles").select("*", { count: "exact", head: true }),

        // Credits data
        supabase.from("credit_transactions").select("amount, transaction_type, balance_after"),

        // Orders data
        supabase.from("orders").select("*, profiles!orders_user_id_fkey(name, email)", { count: "exact" }),

        // Recent orders (last 10)
        supabase
          .from("orders")
          .select("*, profiles!orders_user_id_fkey(name, email)")
          .order("created_at", { ascending: false })
          .limit(10),

        // Recent payments
        supabase
          .from("payments")
          .select("*, profiles!inner(name, email)")
          .order("created_at", { ascending: false })
          .limit(10),

        // Recent audit logs (errors/warnings)
        supabase
          .from("audit_log")
          .select("*")
          .or("event_type.eq.error,event_type.eq.warning")
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      // Calculate credit stats
      const creditsSold = creditsData.data
        ?.filter(t => t.transaction_type === "purchase")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      const creditsConsumed = creditsData.data
        ?.filter(t => t.transaction_type === "deduction")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      // Filter orders by status
      const pending = ordersData.data?.filter(o => o.status === "pending" || o.status === "in_progress") || [];
      const completed = ordersData.data?.filter(o => o.status === "completed") || [];

      // Recent uploads (pending/in_progress orders)
      const recentUploads = ordersData.data
        ?.filter(o => o.status === "pending" || o.status === "in_progress")
        .slice(0, 5) || [];

      // Recent completions
      const recentCompletions = ordersData.data
        ?.filter(o => o.status === "completed")
        .slice(0, 5) || [];

      setStats({
        totalUsers: usersCount.count || 0,
        totalCreditsSold: creditsSold,
        totalCreditsConsumed: creditsConsumed,
        totalOrders: ordersData.count || 0,
        pendingOrders: pending.length,
        completedOrders: completed.length,
        recentUploads,
        recentCompletions,
        recentErrors: auditData.data || [],
        recentPayments: recentPaymentsData.data || []
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">ClickStagePro Management Console</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={fetchDashboardStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/users")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/orders")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ImageIcon className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.pendingOrders || 0} pending · {stats?.completedOrders || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Sold</CardTitle>
              <CreditCard className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalCreditsSold || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total credits purchased
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalCreditsConsumed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalCreditsSold && stats?.totalCreditsConsumed
                  ? `${Math.round((stats.totalCreditsConsumed / stats.totalCreditsSold) * 100)}% utilization`
                  : 'No data'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Uploads
              </CardTitle>
              <CardDescription>Latest pending orders</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentUploads && stats.recentUploads.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentUploads.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{order.profiles?.name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">{order.staging_style}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {order.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent uploads</p>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/admin/orders")}>
                View All Orders <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Completions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Recently Completed
              </CardTitle>
              <CardDescription>Latest finished stagings</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentCompletions && stats.recentCompletions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentCompletions.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{order.profiles?.name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">{order.staging_style}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="mb-1 bg-green-500">
                          Completed
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No completed orders yet</p>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/admin/orders")}>
                View All Orders <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments & Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                Recent Payments
              </CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.profiles?.name || 'Unknown'}</TableCell>
                        <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{payment.credits_purchased}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent payments</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Errors/Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Recent Errors & Logs
              </CardTitle>
              <CardDescription>System alerts and issues</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentErrors && stats.recentErrors.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentErrors.map((log: any) => (
                    <div key={log.id} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-red-900 dark:text-red-100">
                            {log.event_type.toUpperCase()}
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            {JSON.stringify(log.details).substring(0, 100)}...
                          </p>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent errors - all systems operational</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20" onClick={() => navigate("/admin/users")}>
                <Users className="mr-2 h-5 w-5" />
                Manage Users
              </Button>
              <Button variant="outline" className="h-20" onClick={() => navigate("/admin/orders")}>
                <ImageIcon className="mr-2 h-5 w-5" />
                View Orders
              </Button>
              <Button variant="outline" className="h-20" onClick={() => navigate("/admin/images")}>
                <Database className="mr-2 h-5 w-5" />
                Image Library
              </Button>
              <Button variant="outline" className="h-20" onClick={() => navigate("/admin/tests")}>
                <Activity className="mr-2 h-5 w-5" />
                Run Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}