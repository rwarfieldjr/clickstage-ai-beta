import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Upload, DollarSign, Mail, Image, HelpCircle, LayoutGrid, Users, UserCircle, Menu, X, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import logoMain from "@/assets/logo-new.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="hidden lg:flex items-center">
            <img 
              src={logoMain} 
              alt="ClickStage Pro - Virtual Staging Powered by AI" 
              className="h-20 w-auto dark:brightness-[2] dark:contrast-125 transition-all duration-300"
              width="238"
              height="80"
              decoding="async"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link to="/about" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth">
              <Users className="w-4 h-4" />
              About
            </Link>
            <Link to="/portfolio" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth">
              <Image className="w-4 h-4" />
              Portfolio
            </Link>
            <Link to="/styles" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth">
              <LayoutGrid className="w-4 h-4" />
              Styles
            </Link>
            <Link to="/pricing" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth">
              <DollarSign className="w-4 h-4" />
              Pricing
            </Link>
            <Link to="/faq" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-smooth">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link 
                    to="/" 
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                    onClick={handleNavClick}
                  >
                    <Home className="w-5 h-5" />
                    Home
                  </Link>
                  <Link 
                    to="/about" 
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                    onClick={handleNavClick}
                  >
                    <Users className="w-5 h-5" />
                    About
                  </Link>
                  <Link 
                    to="/portfolio" 
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                    onClick={handleNavClick}
                  >
                    <Image className="w-5 h-5" />
                    Portfolio
                  </Link>
                  <Link 
                    to="/styles" 
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                    onClick={handleNavClick}
                  >
                    <LayoutGrid className="w-5 h-5" />
                    Styles
                  </Link>
                  <Link 
                    to="/pricing" 
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                    onClick={handleNavClick}
                  >
                    <DollarSign className="w-5 h-5" />
                    Pricing
                  </Link>
                  <Link 
                    to="/faq" 
                    className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                    onClick={handleNavClick}
                  >
                    <HelpCircle className="w-5 h-5" />
                    FAQ
                  </Link>
                  
                  <div className="pt-4 border-t border-border">
                    {user ? (
                      <>
                        <Link 
                          to="/dashboard" 
                          className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                          onClick={handleNavClick}
                        >
                          <LayoutGrid className="w-5 h-5" />
                          Portal
                        </Link>
                        <Link 
                          to="/account" 
                          className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                          onClick={handleNavClick}
                        >
                          <UserCircle className="w-5 h-5" />
                          Account
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link 
                          to="/auth" 
                          className="flex items-center gap-3 text-base font-medium text-foreground hover:text-accent transition-smooth py-2"
                          onClick={handleNavClick}
                        >
                          Login
                        </Link>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <ThemeToggle />
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Portal
                    </Button>
                  </Link>
                  <Link to="/account">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      Account
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="outline" size="icon">
                      <UserIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;