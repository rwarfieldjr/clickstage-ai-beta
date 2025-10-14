import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSelectPlan = (planName: string) => {
    if (!user) {
      toast.error("Please login to purchase a plan");
      navigate("/auth");
      return;
    }
    // Stripe integration will be added here
    toast.info(`${planName} plan selected. Stripe integration coming soon!`);
  };

  const pricingTiers = [
    {
      name: "Starter",
      price: "$24.95",
      credits: 5,
      features: [
        "5 staging credits",
        "All staging styles",
        "High-resolution output",
        "Email delivery",
        "Dashboard access",
      ],
    },
    {
      name: "Pro",
      price: "$49.95",
      credits: 15,
      features: [
        "15 staging credits",
        "All staging styles",
        "High-resolution output",
        "Priority email delivery",
        "Dashboard access",
        "Save 33% vs pay-as-you-go",
      ],
      popular: true,
    },
    {
      name: "Premium",
      price: "$99.95",
      credits: 35,
      features: [
        "35 staging credits",
        "All staging styles",
        "High-resolution output",
        "Priority email delivery",
        "Dashboard access",
        "Save 43% vs pay-as-you-go",
        "Bulk upload support",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground">
                Choose the plan that fits your needs
              </p>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`shadow-custom-lg border-2 transition-smooth hover:scale-105 ${
                    tier.popular ? "border-accent" : "border-border"
                  }`}
                >
                  {tier.popular && (
                    <div className="bg-accent text-white text-center py-2 rounded-t-xl font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className="text-3xl font-bold text-primary mt-2">
                      {tier.price}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground">{tier.credits} credits</p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full mb-6 bg-accent hover:bg-accent/90"
                      size="lg"
                      onClick={() => handleSelectPlan(tier.name)}
                    >
                      Get Started
                    </Button>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pay As You Go */}
            <Card className="shadow-custom-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Pay As You Go</CardTitle>
                <CardDescription className="text-3xl font-bold text-primary mt-2">
                  $10 per image
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-muted-foreground">
                  Perfect for one-time projects or testing our service. No commitment required.
                </p>
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                  onClick={() => handleSelectPlan("Pay As You Go")}
                >
                  Upload Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;