import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Upload, Palette, Download, CheckCircle, Clock, Users, Award, RefreshCw, Package, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { SEO } from "@/components/SEO";
import { organizationSchema, serviceSchema } from "@/data/schema";
import heroBackground from "@/assets/hero-background-new.png";
import livingBefore from "@/assets/hero-before-new.png";
import livingAfter from "@/assets/hero-after.png";
import livingBefore2 from "@/assets/living-room-before-2.jpg";
import livingAfter2 from "@/assets/living-room-after-2.png";

const Home = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [organizationSchema, serviceSchema]
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Virtual Staging Services for Real Estate Agents & Photographers"
        description="Transform listing photos with AI-powered virtual staging. Perfect for real estate agents and photographers. Upload → Stage → Sell faster with ClickStage Pro."
        canonical="/"
        keywords="virtual staging, virtual staging services, AI virtual staging, virtual staging for real estate, virtual staging for photographers, real estate photo enhancement"
        schema={schema}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="bg-cover bg-center" style={{ backgroundImage: `url(${livingBefore})` }}></div>
          <div className="bg-cover bg-center" style={{ backgroundImage: `url(${livingAfter})` }}></div>
        </div>
        <div className="absolute inset-y-0 left-1/2 w-1.5 bg-white/40 -translate-x-1/2"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 mt-8">
              <span className="text-sm md:text-base text-white/90">Advanced AI Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Virtual Staging That Sells Homes Faster
            </h1>
            <h2 className="text-2xl md:text-3xl mb-6 text-white/90">
              For Agents • For Photographers • For Teams
            </h2>
            <p className="text-lg md:text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              AI-powered virtual staging designed for real estate professionals. Upload your listing photos and get photorealistic staged images in 24 hours. MLS-compliant and proven to sell homes faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">73%</div>
                <div className="text-white/80 text-sm md:text-base">Faster Sales</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">15%</div>
                <div className="text-white/80 text-sm md:text-base">Higher Offers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">24hr</div>
                <div className="text-white/80 text-sm md:text-base">Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose AI Virtual Staging */}
      <section className="py-20 bg-primary/5 dark:bg-gradient-to-b dark:from-primary dark:to-primary/95">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary dark:text-white">
              Why Choose AI Virtual Staging?
            </h2>
            <p className="text-center text-muted-foreground dark:text-white/70 mb-12 text-lg">
              Transform empty properties into buyer's dreams with cutting-edge technology
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-xl p-6 text-center hover:shadow-lg dark:hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-accent dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-white">Sell 73% Faster</h3>
                <p className="text-muted-foreground dark:text-white/70 text-sm">
                  Staged homes sell significantly faster than empty properties
                </p>
              </div>

              <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-xl p-6 text-center hover:shadow-lg dark:hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-accent dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-white">Rush Delivery Available</h3>
                <p className="text-muted-foreground dark:text-white/70 text-sm">
                  Get your professionally staged photos back quickly with our rush service
                </p>
              </div>

              <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-xl p-6 text-center hover:shadow-lg dark:hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-white">Expert Designers</h3>
                <p className="text-muted-foreground dark:text-white/70 text-sm">
                  Our team of interior designers creates stunning, market-ready spaces
                </p>
              </div>

              <div className="bg-white dark:bg-white/5 backdrop-blur-sm border border-border dark:border-white/10 rounded-xl p-6 text-center hover:shadow-lg dark:hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-accent dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-white">Premium Quality</h3>
                <p className="text-muted-foreground dark:text-white/70 text-sm">
                  Photorealistic staging that looks indistinguishable from real furniture
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Highlight Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted dark:from-background dark:to-background/95">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Staging at <span className="text-primary">Unbeatable Prices</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10">
              Pricing as low as <span className="text-primary font-semibold">$7.00 per Staged Photo</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg" className="text-lg px-8">
                  View All Pricing Plans
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Get Started Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* See the Transformation */}
      <section className="py-20 bg-gradient-to-b from-primary/95 to-primary/90">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              See the Transformation
            </h2>
            <p className="text-white/70 mb-12 text-lg max-w-3xl mx-auto">
              See the dramatic transformation as we turn empty rooms into beautiful, staged spaces that sell faster
            </p>
            
            <div className="space-y-8 mb-8">
              <BeforeAfterSlider
                beforeImage={livingBefore}
                afterImage={livingAfter}
                beforeAlt="Empty living room before staging"
                afterAlt="Beautifully staged living room"
              />
              
              <BeforeAfterSlider
                beforeImage={livingBefore2}
                afterImage={livingAfter2}
                beforeAlt="Empty living room with fireplace before staging"
                afterAlt="Beautifully staged living room with fireplace"
              />
            </div>
            
            <Link to="/portfolio">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                View More Examples
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="shadow-custom-md border-0 gradient-card bg-white dark:bg-white">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">1. Choose Your Bundle</h3>
                <p className="text-gray-600">
                  Select the package that fits your needs, from single photos to bulk orders.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-custom-md border-0 gradient-card bg-white dark:bg-white">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">2. Upload Your Photos</h3>
                <p className="text-gray-600">
                  Upload your property photos in JPEG or PNG format. Drag and drop for easy uploading.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-custom-md border-0 gradient-card bg-white dark:bg-white">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">3. Choose Your Style</h3>
                <p className="text-gray-600">
                  Select from Modern, Farmhouse, Coastal, Luxury, and more staging styles.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-custom-md border-0 gradient-card bg-white dark:bg-white">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">4. Place Order</h3>
                <p className="text-gray-600">
                  Complete your order and receive your professionally staged images within 24 hours.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Ready to Transform Your Photos?
            </h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Get started with ClickStagePro today and see the difference AI staging can make.
            </p>
            <Link to="/pricing">
              <Button size="lg" className="text-lg px-8 bg-accent hover:bg-accent/90">
                View Pricing Plans
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;