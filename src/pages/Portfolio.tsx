import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ZoomIn } from "lucide-react";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/data/schema";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import bedroomBefore from "@/assets/new-bedroom-before.jpg";
import bedroomAfter from "@/assets/new-bedroom-after.png";
import livingBefore from "@/assets/living-room-before.jpg";
import livingAfter from "@/assets/living-room-after.png";
import diningBefore from "@/assets/dining-room-before.jpg";
import diningAfter from "@/assets/dining-room-after.png";
import portfolioLivingBefore from "@/assets/portfolio-living-before.jpg";
import portfolioLivingAfter from "@/assets/portfolio-living-after.png";
import studyBefore from "@/assets/study-before.jpg";
import studyAfter from "@/assets/study-after.png";
import exteriorDay from "@/assets/exterior-day.jpg";
import exteriorDusk from "@/assets/exterior-dusk.png";
import declutterBefore from "@/assets/declutter-before.jpg";
import declutterAfter from "@/assets/declutter-after.png";
import bathroomBefore from "@/assets/bathroom-before.jpg";
import bathroomAfter from "@/assets/bathroom-after.png";
import paintBefore from "@/assets/paint-before.png";
import paintAfter from "@/assets/paint-after.png";
import apartmentBefore from "@/assets/apartment-before.jpg";
import apartmentAfter from "@/assets/apartment-after.png";

const Portfolio = () => {
  const [selectedImage, setSelectedImage] = useState<{ title: string; image: string; type: 'before' | 'after' } | null>(null);

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
      title: "Living Room Transformation",
      description: "Transforming an empty living space into a warm, inviting area that helps buyers envision their ideal home",
      before: livingBefore,
      after: livingAfter,
    },
    {
      title: "Dining Room Transformation",
      description: "Transforming a bare dining space into an elegant entertaining area that helps buyers imagine hosting memorable gatherings",
      before: diningBefore,
      after: diningAfter,
    },
    {
      title: "Day to Dusk Transformation",
      description: "Dramatic exterior enhancement that transforms ordinary daytime photos into stunning twilight scenes with emotional appeal",
      before: exteriorDay,
      after: exteriorDusk,
    },
    {
      title: "De-Clutter Transformation",
      description: "Sometimes the clients forget or don't think to move items for before the photographer arrives. We can handle it with our De-Clutter option!",
      before: declutterBefore,
      after: declutterAfter,
    },
    {
      title: "Bathroom Transformation",
      description: "Adding tasteful decor touches transforms a plain bathroom into a spa-like retreat that appeals to buyers",
      before: bathroomBefore,
      after: bathroomAfter,
    },
    {
      title: "Paint Transformation",
      description: "Do you ever advise your clients to repaint a room or even the entire house? Want to show them what it would look like? Now you can! We can even match specific paint color codes!",
      before: paintBefore,
      after: paintAfter,
    },
    {
      title: "Apartment Staging Transformation",
      description: "Help apartment managers lease vacant units faster with professional staging. Transform empty apartments into move-in ready spaces that attract quality tenants and command higher rents, reducing vacancy periods for property management companies.",
      before: apartmentBefore,
      after: apartmentAfter,
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
        <section className="py-12 bg-gradient-to-b from-background to-muted/30">
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
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage={portfolioLivingBefore}
                afterImage={portfolioLivingAfter}
                beforeAlt="Empty living room before staging"
                afterAlt="Beautifully staged living room"
              />
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Living Room Transformation</h3>
                <p className="text-muted-foreground">
                  Transforming an empty living space into a warm, inviting area that helps buyers envision their ideal home
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Study/Office Transformation */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <BeforeAfterSlider
                beforeImage={studyBefore}
                afterImage={studyAfter}
                beforeAlt="Empty study before staging"
                afterAlt="Beautifully staged home office"
              />
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Home Office Transformation</h3>
                <p className="text-muted-foreground mb-6">
                  Converting an empty room into a functional and inspiring home office that showcases the potential of every space
                </p>
                <Link to="/place-order">
                  <Button size="lg" className="bg-accent hover:bg-accent/90">
                    Place Staging Order
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Day to Dusk Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Beyond Interior Staging</h2>
                <p className="text-lg text-muted-foreground">
                  Maximize curb appeal with our stunning day to dusk photo enhancements
                </p>
              </div>
              <BeforeAfterSlider
                beforeImage={transformations[3].before}
                afterImage={transformations[3].after}
                beforeAlt="Daytime exterior photo"
                afterAlt="Dusk exterior photo with lighting"
              />
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold mb-3">{transformations[3].title}</h3>
                <p className="text-muted-foreground">
                  {transformations[3].description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* De-Clutter Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Digital De-Cluttering</h2>
                <p className="text-lg text-muted-foreground">
                  Perfect for when clients forget to tidy up before the photographer arrives
                </p>
              </div>
              <BeforeAfterSlider
                beforeImage={transformations[4].before}
                afterImage={transformations[4].after}
                beforeAlt="Cluttered laundry room"
                afterAlt="De-cluttered laundry room"
              />
              <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold mb-3">{transformations[4].title}</h3>
                <p className="text-muted-foreground">
                  {transformations[4].description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bathroom Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3">{transformations[5].title}</h3>
                <p className="text-muted-foreground">
                  {transformations[5].description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="group rounded-lg overflow-hidden relative cursor-pointer border border-border"
                  onClick={() => setSelectedImage({ title: transformations[5].title, image: transformations[5].before, type: 'before' })}
                >
                  <img 
                    src={transformations[5].before} 
                    alt="Plain bathroom before staging"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-full text-sm font-medium">
                    Before
                  </div>
                </div>
                <div 
                  className="group rounded-lg overflow-hidden relative cursor-pointer border border-border"
                  onClick={() => setSelectedImage({ title: transformations[5].title, image: transformations[5].after, type: 'after' })}
                >
                  <img 
                    src={transformations[5].after} 
                    alt="Styled bathroom after staging"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-full text-sm font-medium">
                    After
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Paint Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3">{transformations[6].title}</h3>
                <p className="text-muted-foreground">
                  {transformations[6].description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="group rounded-lg overflow-hidden relative cursor-pointer border border-border"
                  onClick={() => setSelectedImage({ title: transformations[6].title, image: transformations[6].before, type: 'before' })}
                >
                  <img 
                    src={transformations[6].before} 
                    alt="Living room with neutral paint"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-full text-sm font-medium">
                    Before
                  </div>
                </div>
                <div 
                  className="group rounded-lg overflow-hidden relative cursor-pointer border border-border"
                  onClick={() => setSelectedImage({ title: transformations[6].title, image: transformations[6].after, type: 'after' })}
                >
                  <img 
                    src={transformations[6].after} 
                    alt="Living room with blue paint transformation"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-full text-sm font-medium">
                    After
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Apartment Staging Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3">{transformations[7].title}</h3>
                <p className="text-muted-foreground">
                  {transformations[7].description}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="group rounded-lg overflow-hidden relative cursor-pointer border border-border"
                  onClick={() => setSelectedImage({ title: transformations[7].title, image: transformations[7].before, type: 'before' })}
                >
                  <img 
                    src={transformations[7].before} 
                    alt="Empty apartment living room"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-full text-sm font-medium">
                    Before
                  </div>
                </div>
                <div 
                  className="group rounded-lg overflow-hidden relative cursor-pointer border border-border"
                  onClick={() => setSelectedImage({ title: transformations[7].title, image: transformations[7].after, type: 'after' })}
                >
                  <img 
                    src={transformations[7].after} 
                    alt="Staged apartment living room"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                      <ZoomIn className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 rounded-full text-sm font-medium">
                    After
                  </div>
                </div>
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
              <div className="flex justify-center">
                <Link to="/pricing">
                  <Button size="lg" className="bg-accent hover:bg-accent/90">
                    Get Started Today
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedImage?.title} - {selectedImage?.type === 'before' ? 'Before' : 'After'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            <img
              src={selectedImage?.image}
              alt={`${selectedImage?.title} ${selectedImage?.type}`}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Portfolio;
