import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getDashboardTiers } from "@/config/pricing";

interface AccountCreditsProps {
  user: any;
}

interface CreditSummary {
  total: number;
  used: number;
  remaining: number;
}

export default function AccountCredits({ user }: AccountCreditsProps) {
  const navigate = useNavigate();
  const [credits, setCredits] = useState<CreditSummary>({
    total: 0,
    used: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const tiers = getDashboardTiers();

  useEffect(() => {
    if (user?.id) {
      loadCredits();
    }
  }, [user]);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      const remaining = data?.credits || 0;

      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const used = ordersCount || 0;
      const total = remaining + used;

      setCredits({
        total,
        used,
        remaining,
      });
    } catch (error: any) {
      console.error("Error loading credits:", error);
      toast.error("Failed to load credits");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (priceId: string) => {
    navigate(`/purchase-credits?price_id=${priceId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Credits & Billing
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your staging credits and purchase more
        </p>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Available Credits
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Each credit allows you to stage one photo
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold text-blue-600">
              {credits.remaining}
            </span>
            <span className="text-2xl text-slate-600 dark:text-slate-400">
              Credits
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {credits.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Used</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {credits.used}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Remaining</p>
              <p className="text-2xl font-bold text-blue-600">
                {credits.remaining}
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate("/purchase-credits")}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Purchase More Credits
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Credit Bundles
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Choose the perfect bundle for your needs. All bundles never expire.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular
                  ? "border-blue-600 shadow-lg"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                </div>
              )}

              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {tier.name}
                  </h4>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                      ${tier.price}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {tier.credits} credits
                  </p>
                  {tier.perImageCost && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      ${tier.perImageCost.toFixed(2)} per image
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(tier.priceId)}
                  disabled={purchasing}
                  className={`w-full ${
                    tier.popular
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-600 hover:bg-slate-700"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Bundle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          How Credits Work
        </h4>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li>• Each credit allows you to stage one property photo</li>
          <li>• Credits never expire - use them whenever you need</li>
          <li>• All staged photos delivered within 24 hours</li>
          <li>• Professional, MLS-compliant results guaranteed</li>
          <li>• Download original and staged photos anytime</li>
        </ul>
      </div>
    </div>
  );
}
