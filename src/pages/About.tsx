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
      icon: DollarSign,
      title: "AI Precision",
      description: "Advanced AI trained on real design principles",
    },
    {
      icon: Award,
      title: "MLS-Compliant",
      description: "Never alter structural elements, only furniture",
    },
    {
      icon: Users,
      title: "Fast Delivery",
      description: "High-resolution images within 24 hours",
    },
    {
      icon: MapPin,
      title: "Affordable",
      description: "Flexible bundles starting at $7 per photo",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="About ClickStagePro | AI Virtual Staging for Real Estate"
        description="ClickStagePro is an AI-powered virtual staging company that helps real estate agents, photographers, and teams create stunning, MLS-compliant photos that sell faster."
        canonical="/about"
        keywords="about ClickStagePro, virtual staging company, AI virtual staging, real estate virtual staging, MLS-compliant staging, ClickStagePro team"
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
              ClickStagePro is an AI-driven virtual staging company that helps real estate agents, photographers, and teams transform listing photos into stunning, MLS-compliant images that sell homes faster.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-primary">Our Mission</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                We make high-quality virtual staging accessible to every real estate professional — affordable, fast, and beautifully realistic. With AI-powered tools and expert design guidance, our goal is to simplify the staging process and elevate property marketing.
              </p>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-8 mt-12 text-primary">Why Choose ClickStagePro</h2>
            <ul className="space-y-4 text-lg text-foreground/80">
              <li><strong>AI Precision:</strong> Every photo is staged using advanced AI trained on real design principles.</li>
              <li><strong>MLS-Compliant Results:</strong> We never alter structural elements — only furniture and décor.</li>
              <li><strong>Fast Turnaround:</strong> Receive finished, high-resolution staged images within 24 hours.</li>
              <li><strong>Affordable Pricing:</strong> Flexible bundles with prices as low as $7 per photo.</li>
              <li><strong>Professional Support:</strong> Real humans available when you need help or design guidance.</li>
            </ul>

            <h2 className="text-3xl md:text-4xl font-bold mb-8 mt-12 text-primary">Our Story</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Founded by real estate professionals who understand the importance of presentation, ClickStagePro combines technology and creativity to deliver consistent, high-quality virtual staging for every listing.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-4">
              We're proud to help agents and photographers across the country present properties beautifully — without the cost or time of physical staging.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/pricing">
                <Button size="lg" className="bg-accent hover:bg-accent/90">
                  View Pricing Plans
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Contact Our Team
                </Button>
              </Link>
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
                What Sets Us Apart
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our commitment to speed, quality, and affordability makes ClickStagePro the trusted choice for real estate professionals.
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
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Start with our affordable pricing plans and see why thousands of agents trust ClickStagePro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                View Pricing Plans
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/upload">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10">
                Upload Your Photos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
