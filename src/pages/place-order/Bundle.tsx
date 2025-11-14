import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PRICING_TIERS } from "@/config/pricing";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

export default function PlaceOrderBundle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const turnstileRef = useRef<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Please sign in to place an order");
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      const contactData = sessionStorage.getItem('orderContactData');
      const style = sessionStorage.getItem('orderStyle');
      const files = sessionStorage.getItem('orderUploadedFiles');

      if (!contactData) {
        toast.error("Please complete contact information first");
        navigate('/place-order/contact');
        return;
      }

      if (!style) {
        toast.error("Please select a staging style first");
        navigate('/place-order/style');
        return;
      }

      if (!files) {
        toast.error("Please upload photos first");
        navigate('/place-order/upload');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleProceedToCheckout = async () => {
    if (!selectedBundle) {
      toast.error("Please select a bundle");
      return;
    }

    if (!smsConsent) {
      toast.error("Please consent to SMS notifications");
      return;
    }

    setProcessing(true);

    try {
      if (turnstileRef.current) {
        turnstileRef.current.execute();
      }
    } catch (error) {
      console.error("Turnstile error:", error);
      toast.error("Security verification failed. Please refresh and try again.");
      setProcessing(false);
    }
  };

  const handleTurnstileSuccess = async (token: string) => {
    setTurnstileToken(token);

    try {
      const tier = PRICING_TIERS.find(t => t.id === selectedBundle);
      if (!tier) {
        throw new Error("Invalid bundle selected");
      }

      const contactData = JSON.parse(sessionStorage.getItem('orderContactData') || '{}');
      const style = sessionStorage.getItem('orderStyle');
      const files = JSON.parse(sessionStorage.getItem('orderUploadedFiles') || '[]');

      const { data, error } = await supabase.functions.invoke('create-simple-checkout', {
        body: {
          priceId: tier.priceId,
          credits: tier.credits,
          customerEmail: contactData.email,
          metadata: {
            userId: user.id,
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            phone: contactData.phone,
            propertyAddress: contactData.propertyAddress,
            stagingStyle: style,
            notes: notes || '',
            smsConsent: smsConsent.toString(),
            photoCount: files.length.toString()
          },
          turnstileToken: token
        }
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error("No checkout URL received");
      }

      sessionStorage.setItem('pendingOrderData', JSON.stringify({
        contactData,
        style,
        files,
        bundle: tier.id,
        notes,
        smsConsent
      }));

      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to create checkout session");
      setProcessing(false);
      setTurnstileToken("");
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  };

  const handleBack = () => {
    navigate('/place-order/upload');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Confirm Your Bundle | ClickStage Pro"
        description="Select your photo credit bundle and complete your order"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
            disabled={processing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Confirm Your Bundle</CardTitle>
              <CardDescription>
                Step 4 of 4 - Select your photo credit bundle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Select Bundle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PRICING_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedBundle(tier.id)}
                        disabled={processing}
                        className={`relative p-6 rounded-lg border-2 transition-all text-left hover:border-blue-500 hover:shadow-md ${
                          selectedBundle === tier.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        } ${tier.popular ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                              POPULAR
                            </span>
                          </div>
                        )}
                        {selectedBundle === tier.id && (
                          <div className="absolute top-4 right-4">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <h4 className="font-bold text-lg">Buy {tier.credits} Photo Credit{tier.credits > 1 ? 's' : ''}</h4>
                          <p className="text-3xl font-bold text-blue-600">{tier.price}</p>
                          <p className="text-sm text-gray-600">{tier.perPhoto}</p>
                          {tier.savings && (
                            <p className="text-sm text-green-600 font-semibold">{tier.savings}</p>
                          )}
                          {tier.competitive && (
                            <p className="text-xs text-gray-500 italic">{tier.competitive}</p>
                          )}
                          <p className="text-sm text-gray-700 mt-2">{tier.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{tier.expiration}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or instructions..."
                    rows={4}
                    disabled={processing}
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="sms-consent"
                    checked={smsConsent}
                    onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                    disabled={processing}
                  />
                  <label
                    htmlFor="sms-consent"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I consent to receive SMS notifications about my order status and updates from ClickStage Pro.
                    Message and data rates may apply. You can opt out at any time.
                  </label>
                </div>

                <div className="hidden">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ''}
                    onSuccess={handleTurnstileSuccess}
                    onError={() => {
                      toast.error("Security verification failed");
                      setProcessing(false);
                    }}
                    options={{
                      size: 'invisible',
                      execution: 'execute',
                    }}
                  />
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full"
                  size="lg"
                  disabled={!selectedBundle || !smsConsent || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  You will be redirected to Stripe to complete your purchase securely.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
