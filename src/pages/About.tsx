import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, DollarSign, Users, Award, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { localBusinessSchema, breadcrumbSchema } from "@/data/schema";

const About = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      localBusinessSchema,
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "About", url: "/about" }
      ])
    ]
  };

  const values = [
    {
      icon: Users,
      title: "Accessible",
      description: "Professional staging for every agent and every budget",
    },
    {
      icon: DollarSign,
      title: "Affordable",
      description: "Competitive pricing without sacrificing quality",
    },
    {
      icon: Award,
      title: "Experienced",
      description: "Built on 20+ years of real estate expertise",
    },
    {
      icon: MapPin,
      title: "Local",
      description: "Proudly based in Greenville, SC",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="About ClickStage Pro - Virtual Staging by Real Estate Professionals"
        description="Founded by a real estate agent in Greenville, SC. Learn about our mission to make professional virtual staging accessible and affordable for all agents."
        canonical="/about"
        keywords="about virtual staging, ClickStage Pro, virtual staging company, Greenville SC virtual staging, real estate technology"
        schema={schema}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About ClickStagePro
            </h1>
            <p className="text-xl md:text-2xl text-white/90">
              Built by a real estate agent, for real estate agents.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                ClickStagePro was built by a real estate agent, for real estate agents.
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                With more than two decades of experience selling homes, we've seen firsthand what the data proves: staging sells homes faster and for more money. The problem? Traditional staging has always been expensive, slow, and out of reach for most agents and their clients.
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                That's why we created ClickStagePro. Based in Greenville, SC, our mission is simple—make professional staging accessible to every agent, for every listing.
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                Large staging companies typically charge two or three times more — yet deliver a lower-quality product. But with today's technology, there's no reason staging should be a luxury. Our virtual staging solutions give agents a powerful, affordable tool to compete at the highest level—without breaking the budget.
              </p>
              
              <p className="text-lg text-foreground/80 leading-relaxed">
                We believe every property deserves to look its best online. With ClickStagePro, that's now fully attainable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
                Our Values
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything we do is guided by our commitment to real estate professionals and their success.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="shadow-custom-md border-0 gradient-card">
                    <CardContent className="pt-6 text-center">
                      <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">{value.title}</h3>
                      <p className="text-foreground/70">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Ready to Transform Your Listings?
            </h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Join thousands of agents who trust ClickStagePro to make their properties stand out online.
            </p>
            <div className="flex justify-center">
              <Link to="/place-order">
                <Button size="lg" className="text-lg px-8 bg-accent hover:bg-accent/90">
                  Place Staging Order
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
