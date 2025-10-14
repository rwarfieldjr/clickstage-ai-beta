import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Upload, Palette, Download, CheckCircle, Clock, Users, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBackground from "@/assets/hero-background-new.png";
import livingBefore from "@/assets/hero-before-new.png";
import livingAfter from "@/assets/hero-after.png";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="bg-cover bg-center" style={{ backgroundImage: `url(${livingBefore})` }}></div>
          <div className="bg-cover bg-center" style={{ backgroundImage: `url(${livingAfter})` }}></div>
        </div>
        <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300/30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 mt-8">
              <span className="text-sm md:text-base text-white/90">Advanced AI Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Transform Empty Properties with AI Virtual Staging
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              Powered by the latest AI breakthroughs in image generation - creating photorealistic staging that helps homes sell faster.
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
                <div className="text-4xl md:text-5xl font-bold mb-2">24hrs</div>
                <div className="text-white/80 text-sm md:text-base">Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose AI Virtual Staging */}
      <section className="py-20 bg-gradient-to-b from-primary to-primary/95">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">
              Why Choose AI Virtual Staging?
            </h2>
            <p className="text-center text-white/70 mb-12 text-lg">
              Transform empty properties into buyer's dreams with cutting-edge technology
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Sell 73% Faster</h3>
                <p className="text-white/70 text-sm">
                  Staged homes sell significantly faster than empty properties
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Rush Delivery Available</h3>
                <p className="text-white/70 text-sm">
                  Get your professionally staged photos back quickly with our rush service
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Expert Designers</h3>
                <p className="text-white/70 text-sm">
                  Our team of interior designers creates stunning, market-ready spaces
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-smooth">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Premium Quality</h3>
                <p className="text-white/70 text-sm">
                  Photorealistic staging that looks indistinguishable from real furniture
                </p>
              </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl overflow-hidden shadow-custom-lg">
                <img 
                  src={livingBefore} 
                  alt="Empty living room before staging" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden shadow-custom-lg">
                <img 
                  src={livingAfter} 
                  alt="Beautifully staged living room" 
                  className="w-full h-full object-cover"
                />
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-custom-md border-0 gradient-card">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Upload Photos</h3>
                <p className="text-muted-foreground">
                  Upload your property photos in JPEG or PNG format. Drag and drop for easy uploading.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-custom-md border-0 gradient-card">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Choose Style</h3>
                <p className="text-muted-foreground">
                  Select from Modern, Farmhouse, Coastal, Luxury, and more staging styles.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-custom-md border-0 gradient-card">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Get Results</h3>
                <p className="text-muted-foreground">
                  Receive your professionally staged images by email and in your dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">
              Why Choose ClickStagePro?
            </h2>
            <div className="space-y-6">
              {[
                "Professional AI staging technology",
                "Multiple style options to match your vision",
                "Fast turnaround time",
                "High-resolution output",
                "Secure file handling",
                "Easy-to-use dashboard",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>
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