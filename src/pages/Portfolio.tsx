import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/data/schema";

import bedroomBefore from "@/assets/new-bedroom-before.jpg";
import bedroomAfter from "@/assets/new-bedroom-after.png";
import livingBefore from "@/assets/portfolio-living-before.jpg";
import livingAfter from "@/assets/portfolio-living-after.jpg";
import diningBefore from "@/assets/portfolio-dining-before.jpg";
import diningAfter from "@/assets/portfolio-dining-after.jpg";

const Portfolio = () => {
  const schema = breadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Portfolio", url: "/portfolio" }
  ]);

  const transformations = [
    {
      title: "Master Bedroom Transformation",
      description: "From empty space to luxurious retreat - helping buyers envision their dream bedroom",
      before: bedroomBefore,
      after: bedroomAfter,
    },
    {
      title: "Living Room & Kitchen Transformation",
      description: "Converting an empty open-plan space into a warm, inviting living area that showcases the home's potential",
      before: livingBefore,
      after: livingAfter,
    },
    {
      title: "Dining Room Transformation",
      description: "Transforming a bare dining space into an elegant entertaining area that helps buyers imagine hosting memorable gatherings",
      before: diningBefore,
      after: diningAfter,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Before and After Virtual Staging Portfolio - Real Examples"
        description="See stunning virtual staging transformations. Real before and after examples showing how AI-powered staging helps homes sell faster. Professional results for real estate."
        canonical="/portfolio"
        keywords="virtual staging before and after, virtual staging examples, real estate staging portfolio, staged vs unstaged, virtual staging transformations"
        schema={schema}
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Transformation <span className="text-accent">Portfolio</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                See the dramatic impact of professional virtual staging. These real transformations 
                showcase how empty rooms become buyer magnets that sell faster and for higher prices.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Transformation */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="relative">
                <BeforeAfterSlider
                  beforeImage={transformations[0].before}
                  afterImage={transformations[0].after}
                  beforeAlt="Empty master bedroom"
                  afterAlt="Staged master bedroom"
                />
                <div className="absolute -top-4 -right-4 text-sm text-muted-foreground italic">
                  * Scandinavian style
                </div>
              </div>
              <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold mb-3">{transformations[0].title}</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {transformations[0].description}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link to="/pricing">
                    <Button size="lg" className="bg-accent hover:bg-accent/90">
                      Place Staging Order
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/pricing">
                    <Button size="lg" variant="outline">
                      View Pricing Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Gallery */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Portfolio Gallery</h2>
                <p className="text-lg text-muted-foreground">
                  Explore more stunning transformations showcasing our versatility across different room types and design styles
                </p>
              </div>

              <div className="space-y-16">
                {transformations.slice(1).map((transformation, index) => (
                  <div key={index} className="space-y-6">
                    <BeforeAfterSlider
                      beforeImage={transformation.before}
                      afterImage={transformation.after}
                      beforeAlt={`Empty ${transformation.title.toLowerCase()}`}
                      afterAlt={`Staged ${transformation.title.toLowerCase()}`}
                    />
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-3">{transformation.title}</h3>
                      <p className="text-muted-foreground">
                        {transformation.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-background to-accent/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Transform Your Listings?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of successful agents who are closing deals faster with professional virtual staging
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/pricing">
                  <Button size="lg" className="bg-accent hover:bg-accent/90">
                    Get Started Today
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Portfolio;
