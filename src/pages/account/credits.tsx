import Sidebar from "@/components/account/Sidebar";
import { useRequireUser } from "@/hooks/useRequireUser";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreditsPage() {
  const { user, loading: userLoading } = useRequireUser();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        setCredits(data?.credits ?? 0);
      } catch (error) {
        console.error("Error loading credits:", error);
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

  return (
    <div className="flex gap-8 p-10 min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 space-y-6">
        <div className="bg-white shadow-xl rounded-2xl p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Credits</h1>
            <p className="text-gray-600">Each credit allows you to stage one photo</p>
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-600 rounded-full">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Available Credits
                  </p>
                  <p className="text-sm text-gray-600">
                    Ready to use for staging
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-5xl font-bold text-blue-600">{credits}</p>
                <p className="text-gray-600 mt-2">
                  {credits === 0
                    ? "Purchase credits to start staging"
                    : credits === 1
                    ? "1 photo staging available"
                    : `${credits} photo stagings available`}
                </p>
              </div>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                size="lg"
                onClick={() => navigate("/purchase-credits")}
              >
                <ShoppingCart className="w-5 h-5" />
                Buy More Credits
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How Credits Work</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Each credit allows you to stage one property photo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Credits never expire - use them whenever you need</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>All staged photos delivered within 24 hours</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Professional, MLS-compliant results guaranteed</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Download original and staged photos anytime</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
