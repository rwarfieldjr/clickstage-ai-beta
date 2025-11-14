import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Image } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const [orderId] = useState(searchParams.get('orderId'));

  useEffect(() => {
    if (!orderId) {
      console.warn("No order ID found in URL");
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Order Placed Successfully - ClickStage Pro"
        description="Your virtual staging order has been placed successfully"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-custom-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-2">Order Placed Successfully!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for choosing ClickStage Pro
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {orderId && (
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="text-lg font-mono font-semibold text-accent">
                    {orderId.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}

              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">What happens next?</h3>
                  <ul className="space-y-2 text-muted-foreground text-left max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>You'll receive an email confirmation with your order details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Our team will process your photos within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>You'll be notified when your staged photos are ready</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Download your photos from your account dashboard</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Need help? Contact us at{" "}
                    <a
                      href="mailto:support@clickstagepro.com"
                      className="text-accent hover:underline"
                    >
                      support@clickstagepro.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/account/images" className="block">
                  <Button className="w-full bg-accent hover:bg-accent/90" size="lg">
                    <Image className="w-4 h-4 mr-2" />
                    View My Images
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
