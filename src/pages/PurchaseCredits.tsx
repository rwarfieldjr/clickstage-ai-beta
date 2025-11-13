import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Turnstile } from "@marsidev/react-turnstile";
import { ENV } from "@/config/environment";
import { SEO } from "@/components/SEO";
import { PRICING_TIERS } from "@/config/pricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PurchaseCredits() {
  const navigate = useNavigate();
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [verifiedBundles, setVerifiedBundles] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const handlePurchaseClick = async (bundleId: string) => {
    if (verifiedBundles.has(bundleId)) {
      await createCheckoutSession(bundleId);
    } else {
      setSelectedBundle(bundleId);
    }
  };

  const createCheckoutSession = async (bundleId: string) => {
    setProcessing(true);
    try {
      const bundle = PRICING_TIERS.find(b => b.id === bundleId);
      if (!bundle) {
        throw new Error('Bundle not found');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to purchase credits');
        navigate('/auth');
        return;
      }

      const response = await fetch(`${ENV.supabase.url}/functions/v1/create-credit-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: bundle.priceId,
          credits: bundle.credits,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTurnstileSuccess = async (token: string) => {
    if (selectedBundle) {
      setVerifiedBundles(prev => new Set([...prev, selectedBundle]));
      await createCheckoutSession(selectedBundle);
      setSelectedBundle(null);
    }
  };

  const handleTurnstileError = () => {
    setSelectedBundle(null);
    toast.error('Verification failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Purchase Credits - ClickStage Pro"
        description="Purchase photo credit bundles securely with Stripe. Choose from 1 to 100 credits with flexible pricing options."
      />
      <Navbar />

      <main className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                  Purchase Credits
                </h1>
              </div>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Select a bundle to add more credits to your account
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                All credits come with professional staging and 24-hour delivery
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {PRICING_TIERS.map((tier) => (
                <div key={tier.id} className="flex flex-col">
                  <Card className={`hover:shadow-xl transition-all duration-300 flex-1 relative overflow-hidden ${
                    tier.popular
                      ? 'border-blue-600 shadow-lg ring-2 ring-blue-600/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}>
                    {tier.popular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-blue-600 text-white rounded-none rounded-bl-lg px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            {tier.displayName}
                          </CardTitle>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-4xl font-bold text-blue-600">
                              {tier.price}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {tier.perPhoto}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {tier.savings && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {tier.savings}
                        </Badge>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {tier.description}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            Professional, MLS-compliant results
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            24-hour delivery guarantee
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {tier.expiration}
                          </span>
                        </div>
                        {tier.competitive && (
                          <div className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {tier.competitive}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handlePurchaseClick(tier.id)}
                        disabled={selectedBundle === tier.id || processing}
                        className={`w-full h-12 text-base font-semibold ${
                          tier.popular
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {processing ? "Processing..." : selectedBundle === tier.id ? "Verifying..." : "Purchase"}
                      </Button>
                    </CardContent>
                  </Card>

                  {selectedBundle === tier.id && (
                    <div className="mt-4 p-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-800 shadow-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 text-center font-medium">
                        Complete security verification to purchase credits:
                      </p>
                      <div className="flex justify-center">
                        <Turnstile
                          siteKey={ENV.turnstile.siteKey}
                          onSuccess={handleTurnstileSuccess}
                          onError={handleTurnstileError}
                          options={{
                            theme: "light",
                            size: "normal",
                            appearance: "always",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-3">
                    Secure Payment
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    All transactions are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-green-900 dark:text-green-100 mb-3">
                    Credits Never Expire
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your credits remain in your account until you use them. Stage photos whenever you need, with no time pressure or expiration dates.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-4 text-center">
                    How It Works
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                        1
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Choose Bundle
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Select the credit package that fits your needs
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                        2
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Secure Checkout
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Complete payment safely through Stripe
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                        3
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Start Staging
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Credits appear instantly in your account
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
