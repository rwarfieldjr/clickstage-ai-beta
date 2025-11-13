import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Upload, DollarSign, Mail, Image, HelpCircle, LayoutGrid, Users, UserCircle, Menu, X, User as UserIcon, Coins } from "lucide-react";
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
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCredits(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCredits(session.user.id);
      } else {
        setCredits(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCredits = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setCredits(data.credits || 0);
    } else {
      setCredits(0);
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("credits-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_credits",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && "credits" in payload.new) {
            setCredits((payload.new as any).credits || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
              className="h-20 w-auto dark:brightness-0 dark:invert transition-all duration-300"
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
                          to="/purchase-credits"
                          className="flex items-center gap-3 text-base font-medium text-primary hover:text-accent transition-smooth py-2 px-3 bg-primary/10 rounded-md mb-2"
                          onClick={handleNavClick}
                        >
                          <Coins className="w-5 h-5" />
                          {credits} Credits
                        </Link>
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
                  <Link to="/purchase-credits" className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">{credits} Credits</span>
                  </Link>
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