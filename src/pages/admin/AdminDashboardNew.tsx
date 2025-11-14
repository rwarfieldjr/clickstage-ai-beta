import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CreditCard,
  Image,
  Settings,
  LogOut,
  Database,
  Activity,
  Package,
  UserCog,
  Shield,
  HardDrive,
  Clock,
  ArrowRight,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalCreditsSold: number;
  storageUsed: string;
  todaysOrders: number;
  pendingJobs: number;
}

export default function AdminDashboardNew() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useRequireAdmin();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalCreditsSold: 0,
    storageUsed: "0 GB",
    todaysOrders: 0,
    pendingJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin, isLoading]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch order count
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Fetch today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Fetch pending jobs
      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch total credits sold from credit_history
      const { data: creditHistory } = await supabase
        .from("credit_history")
        .select("credits_added")
        .eq("action_type", "purchase");

      const totalCredits = creditHistory?.reduce(
        (sum, record) => sum + (record.credits_added || 0),
        0
      ) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalOrders: orderCount || 0,
        totalCreditsSold: totalCredits,
        storageUsed: "0 GB",
        todaysOrders: todayCount || 0,
        pendingJobs: pendingCount || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Admin Dashboard - ClickStage Pro"
        description="Admin control center for managing users, orders, and system operations"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, Admin!
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mt-2">
              Use the tools below to manage the entire ClickStagePro platform.
            </p>
          </div>

          {/* Admin Control Center - Star Feature */}
          <Card className="shadow-custom-lg mb-6 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-32 -mr-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mb-24 -ml-24" />
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl text-white">Admin Control Center</CardTitle>
              </div>
              <CardDescription className="text-white/90 text-base">
                Manage users, orders, credits, images, and system health in one centralized location
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-white" />
                    <h3 className="font-semibold text-white text-lg">User Manager</h3>
                  </div>
                  <p className="text-white/80 text-sm">
                    View, edit, and manage all registered users
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-5 h-5 text-white" />
                    <h3 className="font-semibold text-white text-lg">Order Manager</h3>
                  </div>
                  <p className="text-white/80 text-sm">
                    Monitor and process all staging orders
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/admin/images')}
                size="lg"
                className="w-full md:w-auto bg-white text-blue-600 hover:bg-white/90 font-semibold text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
              >
                Open Admin Image Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <MetricCard
              icon={<Users className="w-6 h-6" />}
              label="Total Users"
              value={loading ? "..." : stats.totalUsers.toString()}
              bgColor="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <MetricCard
              icon={<Package className="w-6 h-6" />}
              label="Total Orders"
              value={loading ? "..." : stats.totalOrders.toString()}
              bgColor="bg-green-100 dark:bg-green-900/30"
              iconColor="text-green-600 dark:text-green-400"
            />
            <MetricCard
              icon={<CreditCard className="w-6 h-6" />}
              label="Total Credits Sold"
              value={loading ? "..." : stats.totalCreditsSold.toString()}
              bgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
            />
            <MetricCard
              icon={<HardDrive className="w-6 h-6" />}
              label="Storage Used"
              value={stats.storageUsed}
              bgColor="bg-orange-100 dark:bg-orange-900/30"
              iconColor="text-orange-600 dark:text-orange-400"
            />
            <MetricCard
              icon={<Clock className="w-6 h-6" />}
              label="Today's Orders"
              value={loading ? "..." : stats.todaysOrders.toString()}
              bgColor="bg-cyan-100 dark:bg-cyan-900/30"
              iconColor="text-cyan-600 dark:text-cyan-400"
            />
            <MetricCard
              icon={<Activity className="w-6 h-6" />}
              label="Pending Jobs"
              value={loading ? "..." : stats.pendingJobs.toString()}
              bgColor="bg-red-100 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
            />
          </div>

          {/* Quick Actions */}
          <Card className="shadow-custom-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Actions</CardTitle>
              <CardDescription>
                Commonly used administrative tools and functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ActionCard
                  icon={<CreditCard className="w-5 h-5" />}
                  label="Add Credits to User"
                  to="/admin/credits"
                />
                <ActionCard
                  icon={<UserCog className="w-5 h-5" />}
                  label="Adjust User Account"
                  to="/admin/users"
                />
                <ActionCard
                  icon={<FileText className="w-5 h-5" />}
                  label="View System Logs"
                  to="/admin/tests"
                />
                <ActionCard
                  icon={<Trash2 className="w-5 h-5" />}
                  label="Clean Up Orphaned Files"
                  to="/admin/storage-cleanup"
                />
                <ActionCard
                  icon={<ExternalLink className="w-5 h-5" />}
                  label="Open Supabase"
                  href="https://app.supabase.com"
                  external
                />
                <ActionCard
                  icon={<Image className="w-5 h-5" />}
                  label="Storage Browser"
                  to="/admin/images"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
  iconColor: string;
}

function MetricCard({ icon, label, value, bgColor, iconColor }: MetricCardProps) {
  return (
    <Card className="shadow-custom-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 ${bgColor} rounded-xl ${iconColor}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
}

function ActionCard({ icon, label, to, href, external }: ActionCardProps) {
  const className = "bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-slate-900 dark:text-slate-100 hover:border-blue-500 dark:hover:border-blue-400";

  if (external && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </a>
    );
  }

  return (
    <Link to={to || "#"} className={className}>
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
