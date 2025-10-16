import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { productSchema, breadcrumbSchema } from "@/data/schema";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Pricing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Pricing", url: "/pricing" }
      ]),
      productSchema(1, 10),
      productSchema(5, 45),
      productSchema(10, 85),
      productSchema(20, 160),
      productSchema(50, 375)
    ]
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSelectPlan = async (planName: string, priceId: string, credits: number) => {
    // Store selected bundle info in localStorage
    localStorage.setItem('selectedBundle', JSON.stringify({
      name: planName,
      priceId: priceId,
      credits: credits,
    }));
    
    // Navigate to place-order page
    navigate('/place-order');
  };

  const pricingTiers = [
    {
      name: "1 Photo",
      price: "$10",
      priceId: "price_1SD8lsIG3TLqP9yabBsx4jyZ",
      credits: 1,
      perPhoto: "$10 per photo",
      description: "Test Drive our service - see the difference",
    },
    {
      name: "5 Photos",
      price: "$45",
      priceId: "price_1SD8nJIG3TLqP9yaGAjd2WdP",
      credits: 5,
      perPhoto: "$9 per photo",
      savings: "Save $5",
      description: "Perfect for a single listing",
    },
    {
      name: "10 Photos",
      price: "$85",
      priceId: "price_1SD8nNIG3TLqP9yazPngAIN0",
      credits: 10,
      perPhoto: "$8.5 per photo",
      savings: "Save $15",
      description: "Great for 2-3 listings",
    },
    {
      name: "20 Photos",
      price: "$160",
      priceId: "price_1SD8nQIG3TLqP9yaBVVV1coG",
      credits: 20,
      perPhoto: "$8 per photo",
      savings: "Save $40",
      description: "Ideal for multiple projects",
      popular: true,
    },
    {
      name: "50 Photos",
      price: "$375",
      priceId: "price_1SD8nTIG3TLqP9yaT0hRMNFq",
      credits: 50,
      perPhoto: "$7.5 per photo",
      savings: "Save $125",
      description: "Perfect for agencies",
    },
    {
      name: "100 Photos",
      price: "$700",
      priceId: "price_1SD8nWIG3TLqP9yaH0D0oIpW",
      credits: 100,
      perPhoto: "$7 per photo",
      savings: "Save $300",
      description: "Maximum value for teams",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Virtual Staging Pricing - Affordable Packages for Real Estate Agents"
        description="Professional virtual staging starting at $10 per photo. Flexible packages for real estate agents and photographers. No expiration, 24-hour turnaround, MLS-compliant."
        canonical="/pricing"
        keywords="virtual staging pricing, affordable virtual staging, virtual staging packages, real estate staging cost, cheap virtual staging"
        schema={schema}
      />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricingTiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={`shadow-custom-lg border-2 transition-smooth hover:scale-105 h-full flex flex-col ${
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
                    <p className="text-sm text-muted-foreground">{tier.perPhoto}</p>
                    {tier.savings && (
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {tier.savings}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 mt-auto"
                      size="lg"
                      onClick={() => handleSelectPlan(tier.name, tier.priceId, tier.credits)}
                    >
                      Select {tier.name} Bundle
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;