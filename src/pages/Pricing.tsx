import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, RefreshCw, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { productSchema, breadcrumbSchema } from "@/data/schema";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PRICING_TIERS } from "@/config/pricing";

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

  const handleSelectPlan = async (credits: number) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate('/auth');
      return;
    }

    navigate('/place-order/contact');
  };

  const pricingTiers = PRICING_TIERS;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Virtual Staging Pricing"
        description="See ClickStagePro's simple virtual staging pricing. Get fast, affordable, and photorealistic results starting as low as $7 per photo. Perfect for real estate agents, photographers, and teams."
        canonical="/pricing"
        keywords="virtual staging pricing, AI virtual staging, real estate photo staging, MLS-compliant staging, virtual staging cost, ClickStagePro pricing"
        schema={schema}
      />
      <Navbar />

      <main className="flex-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary">
                Simple, Affordable Virtual Staging Pricing
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Fast, photorealistic, and MLS-compliant results delivered in 24 hours. Choose the plan that fits your needs.
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
                    <div className="min-h-[5.5rem]">
                      <p className="text-sm text-muted-foreground">{tier.perPhoto}</p>
                      {tier.competitive && (
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {tier.competitive}
                        </p>
                      )}
                      {tier.savings && (
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {tier.savings}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <p className="text-sm text-muted-foreground mt-auto mb-4">{tier.description}</p>
                    {tier.credits <= 10 && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Credits expire 6 months after purchase.
                      </p>
                    )}
                    {tier.credits >= 20 && (
                      <p className="text-xs text-muted-foreground mb-4">
                        Credits expire 12 months after purchase.
                      </p>
                    )}
                    <Button
                      className="w-full bg-accent hover:bg-accent/90"
                      size="lg"
                      onClick={() => handleSelectPlan(tier.credits)}
                    >
                      Buy {tier.credits} Photo Credit{tier.credits > 1 ? 's' : ''}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Our Commitment Section */}
            <section className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Our Commitment to You
                </h2>
                <p className="text-lg text-muted-foreground">
                  We stand behind every photo we stage with industry-leading guarantees
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                <Card className="bg-card border-border">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-3">Unlimited Revisions</h3>
                        <p className="text-muted-foreground mb-6">
                          Not happy with a result? We'll keep refining until it's perfect. No limits, no extra charges.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3 ml-16">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">No revision limits</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">No extra charges</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">Fast turnaround on changes</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="pt-8 pb-8">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-3">100% Satisfaction Guarantee</h3>
                        <p className="text-muted-foreground mb-6">
                          We've got you. Message us within 30 days of purchase and we'll keep revising—free—until you love the results.
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3 ml-16">
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">30-day guarantee window</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">Free unlimited revisions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">Message us through your order</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Support Section */}
            <section className="mt-20">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <HelpCircle className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="text-3xl font-bold">Support & Contact</h2>
                </div>
                
                <Accordion type="single" collapsible className="mb-12">
                  <AccordionItem 
                    value="support" 
                    className="border border-border rounded-lg px-6 bg-card hover:bg-muted/50 transition-colors"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-medium text-lg">How do I contact support?</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      You can reach our support team via email at support@clickstagepro.com, through the contact form on our website, or via live chat during business hours (9 AM - 6 PM EST, Monday-Friday).
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="text-center p-8 bg-muted/50 rounded-lg">
                  <h3 className="text-3xl font-bold mb-4">Still Have Questions?</h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Our support team is here to help. Reach out anytime with questions about pricing, uploads, or design options.
                  </p>
                  <Link to="/contact">
                    <Button size="lg" className="bg-accent hover:bg-accent/90">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;