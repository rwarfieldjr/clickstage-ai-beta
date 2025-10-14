import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Upload, Palette, Download, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <span className="text-base md:text-lg text-white/90">Advanced AI Technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Transform Empty Properties with AI Virtual Staging
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              Powered by the latest AI breakthroughs in image generation - creating photorealistic staging that helps homes sell faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
                  View Pricing
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
                <div className="text-4xl md:text-5xl font-bold mb-2">24-48h</div>
                <div className="text-white/80 text-sm md:text-base">Delivery</div>
              </div>
            </div>
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