import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, CreditCard, LogOut, Upload, LayoutGrid } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountProfile from "@/components/account/AccountProfile";
import AccountOrders from "@/components/account/AccountOrders";
import AccountCredits from "@/components/account/AccountCredits";

export default function AccountPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const handleNewOrder = () => {
    navigate("/upload");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Account Portal
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your profile, orders, and credits
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleNewOrder}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                New Order
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <Card className="shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="credits" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Credits
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="profile" className="mt-0">
                  <AccountProfile user={user} />
                </TabsContent>

                <TabsContent value="orders" className="mt-0">
                  <AccountOrders user={user} />
                </TabsContent>

                <TabsContent value="credits" className="mt-0">
                  <AccountCredits user={user} />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
