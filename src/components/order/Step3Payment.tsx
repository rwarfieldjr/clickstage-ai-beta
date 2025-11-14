import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Coins, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Step3PaymentProps {
  creditsRequired: number;
  userCredits: number;
  onBack: () => void;
  onComplete: (orderId: string) => void;
  orderData: {
    contact: any;
    photos: any[];
  };
}

export default function Step3Payment({
  creditsRequired,
  userCredits,
  onBack,
  onComplete,
  orderData,
}: Step3PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'card' | null>(null);

  const hasEnoughCredits = userCredits >= creditsRequired;

  const handleUseCredits = async () => {
    if (!hasEnoughCredits) {
      toast.error("Insufficient credits");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('deduct_credits', {
        user_id: user.id,
        credits_to_deduct: creditsRequired,
        reason: 'order_placement'
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to deduct credits");

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          credits_used: creditsRequired,
          payment_method: 'credits',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast.success("Order placed successfully!");
      onComplete(orderData.id);
    } catch (error: any) {
      console.error("Credit payment error:", error);
      toast.error(error.message || "Failed to process order");
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithCard = async () => {
    setLoading(true);
    setPaymentMethod('card');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-simple-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            credits: creditsRequired,
            returnUrl: `${window.location.origin}/order-success`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();

      if (!checkoutUrl) {
        throw new Error('No checkout URL returned');
      }

      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Card payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Choose Payment Method</h3>
        <p className="text-muted-foreground">
          Select how you'd like to complete your order
        </p>
      </div>

      <div className="grid gap-4">
        <Card
          className={`cursor-pointer transition-all hover:border-accent ${
            hasEnoughCredits ? "border-2" : "opacity-60 cursor-not-allowed"
          } ${paymentMethod === 'credits' ? "border-accent bg-accent/5" : ""}`}
          onClick={() => !loading && hasEnoughCredits && setPaymentMethod('credits')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <Coins className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Use My Credits</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  You have {userCredits} credit{userCredits !== 1 ? 's' : ''} available
                </p>
                {hasEnoughCredits ? (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Enough credits for this order ({creditsRequired} required)
                  </p>
                ) : (
                  <p className="text-sm font-medium text-destructive">
                    Need {creditsRequired - userCredits} more credit{(creditsRequired - userCredits) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-accent border-2 ${
            paymentMethod === 'card' ? "border-accent bg-accent/5" : ""
          }`}
          onClick={() => !loading && setPaymentMethod('card')}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Pay with Credit Card</h4>
                <p className="text-sm text-muted-foreground">
                  Secure payment via Stripe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (paymentMethod === 'credits') {
              handleUseCredits();
            } else if (paymentMethod === 'card') {
              handlePayWithCard();
            } else {
              toast.error("Please select a payment method");
            }
          }}
          className="flex-1 bg-accent hover:bg-accent/90"
          disabled={loading || !paymentMethod || (paymentMethod === 'credits' && !hasEnoughCredits)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Order"
          )}
        </Button>
      </div>
    </div>
  );
}
