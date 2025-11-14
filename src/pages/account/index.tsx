import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, CreditCard, Clock, Image, Upload, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function AccountDashboard() {
  const { user, loading } = useRequireUser();
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    async function loadStats() {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, first_name")
        .eq("id", user.id)
        .maybeSingle();

      setCredits(profile?.credits ?? 0);
      setFirstName(profile?.first_name || user.user_metadata?.name?.split(" ")[0] || "");

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
            Welcome back, {firstName || user?.email?.split("@")[0]}!
          </h1>

          <p className="text-gray-700">
            Use the menu to the left to manage your profile, view your orders, or
            check your credits.
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
                    <Image className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Image Portal</h2>
                </div>
                <p className="text-white/90 text-base mb-6 max-w-2xl">
                  Upload, organize, and manage all your original and staged photos in one place
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Upload className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white">Upload Photos</h3>
                    </div>
                    <p className="text-white/80 text-sm">
                      Drag and drop your original listing photos
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Image className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white">Manage Images</h3>
                    </div>
                    <p className="text-white/80 text-sm">
                      Download, rename, and organize your staged photos
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/account/images')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-white/90 font-semibold text-base px-6 py-6 h-auto shadow-lg hover:shadow-xl transition-all"
                >
                  Open Image Portal
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
