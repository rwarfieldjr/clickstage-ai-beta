import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      setError(true);
      setLoading(false);
      return;
    }

    // Wait for the webhook to process (give it a few seconds)
    const checkOrder = async () => {
      try {
        // Wait 3 seconds for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try to get the order number from the database
        const { data, error } = await supabase
          .from("orders")
          .select("order_number")
          .eq("stripe_payment_id", sessionId)
          .single();

        if (error || !data) {
          // Order not created yet, might be guest checkout
          // Just show success without order number
          setOrderNumber("");
        } else {
          setOrderNumber(data.order_number);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    checkOrder();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-accent" />
            <p className="text-lg text-muted-foreground">Processing your order...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                We couldn't find your order. Please contact support if you've been charged.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} className="w-full">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-custom-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-3xl mb-2">Payment Successful!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your order
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {orderNumber && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
                  <p className="text-sm text-muted-foreground mb-2">Order Number</p>
                  <p className="text-2xl font-bold text-accent">{orderNumber}</p>
                </div>
              )}

              <div className="bg-muted/50 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">What Happens Next?</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <p className="text-sm">
                      <strong>Check Your Email:</strong> We've sent you a confirmation email with instructions to set up your account and access your photos.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <p className="text-sm">
                      <strong>Create Your Account:</strong> Click the link in the email to set your password and access your dashboard.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <p className="text-sm">
                      <strong>We'll Process Your Photos:</strong> Our team will create stunning virtually staged images within 24-48 hours.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <p className="text-sm">
                      <strong>Download Your Images:</strong> Access your completed photos from your account dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link to="/">Return Home</Link>
                </Button>
                <Button 
                  asChild
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  <Link to="/auth/signup">Set Up Account Now</Link>
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Questions? <a href="/contact" className="text-accent hover:underline">Contact our support team</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Success;