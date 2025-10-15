import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to ClickStage Pro's homepage to explore our virtual staging services for real estate professionals."
        canonical="/404"
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-secondary/30">
        <div className="text-center px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-primary mb-4">404</h1>
          <p className="text-2xl md:text-3xl font-semibold mb-4">Page Not Found</p>
          <p className="text-lg text-muted-foreground mb-8">
            Sorry, the page you're looking for doesn't exist.
          </p>
          <Link to="/">
            <Button size="lg" className="bg-accent hover:bg-accent/90">
              <Home className="mr-2 w-5 h-5" />
              Return to Home
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
