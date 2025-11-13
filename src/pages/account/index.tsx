import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CreditCard, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AccountDashboard() {
  const { user, loading } = useRequireUser();
  const [credits, setCredits] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .maybeSingle();

      setCredits(profile?.credits ?? 0);

      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setOrderCount(count ?? 0);
    }

    if (user) {
      loadStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 space-y-6">
        <div className="bg-white shadow-xl rounded-2xl p-10">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            Welcome back, {user?.email}
          </h1>

          <p className="text-gray-700">
            Use the menu to the left to manage your profile, view your orders, or
            check your credits.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Credits</p>
                  <p className="text-2xl font-bold text-gray-900">{credits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
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
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
