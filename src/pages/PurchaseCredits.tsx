import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Turnstile } from "@marsidev/react-turnstile";
import { ENV } from "@/config/environment";
import { SEO } from "@/components/SEO";

interface CreditBundle {
  id: string;
  credits: number;
  price: number;
  stripeUrl: string;
}

// Only show the $10 single photo credit option
const bundles: CreditBundle[] = [
  { id: "single", credits: 1, price: 10, stripeUrl: "https://buy.stripe.com/7sY9AU3eU0tn4DkcHCdZ601" },
];

export default function PurchaseCredits() {
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [verifiedBundles, setVerifiedBundles] = useState<Set<string>>(new Set());

  const handlePurchaseClick = (bundleId: string) => {
    if (verifiedBundles.has(bundleId)) {
      // Already verified, proceed to Stripe
      const bundle = bundles.find(b => b.id === bundleId);
      if (bundle) {
        window.open(bundle.stripeUrl, '_blank');
      }
    } else {
      // Show Turnstile for this bundle
      setSelectedBundle(bundleId);
    }
  };

  const handleTurnstileSuccess = (token: string) => {
    if (selectedBundle) {
      setVerifiedBundles(prev => new Set([...prev, selectedBundle]));
      const bundle = bundles.find(b => b.id === selectedBundle);
      if (bundle) {
        window.open(bundle.stripeUrl, '_blank');
      }
      setSelectedBundle(null);
    }
  };

  const handleTurnstileError = () => {
    setSelectedBundle(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Purchase Credits - ClickStage Pro"
        description="Purchase photo credit bundles securely with Stripe. Choose from 5, 10, 20, or 50 credits."
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Purchase Credits</h1>
            <p className="text-lg text-muted-foreground">
              Select a bundle to add more credits to your account.
            </p>
          </div>

          {/* Credit Bundle Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 max-w-md mx-auto">{bundles.map((bundle) => (
              <div key={bundle.id} className="flex flex-col">
                <Card className="hover:shadow-lg transition-shadow flex-1">
                  <CardHeader className="relative">
                    <CreditCard className="absolute top-4 right-4 h-5 w-5 text-primary opacity-50" />
                    <CardTitle className="text-2xl">1 Photo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-primary">
                      ${bundle.price}
                    </div>
                    <Button
                      onClick={() => handlePurchaseClick(bundle.id)}
                      className="w-full"
                      disabled={selectedBundle === bundle.id}
                    >
                      {selectedBundle === bundle.id ? "Verifying..." : "Buy Photo Credits"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Dynamic Turnstile - appears below the clicked bundle */}
                {selectedBundle === bundle.id && (
                  <div className="mt-4 p-4 border rounded-lg bg-card shadow-sm">
                    <p className="text-sm text-muted-foreground mb-3 text-center">
                      Complete security verification to continue
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

          {/* Info Section */}
          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Secure Payment</h3>
            <p className="text-sm text-muted-foreground">
              All transactions are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
