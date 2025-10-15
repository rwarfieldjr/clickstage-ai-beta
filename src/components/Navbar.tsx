import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Upload, DollarSign, Mail, Image, HelpCircle, LayoutGrid, Users, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { theme } = useTheme();

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

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-1">
            <img 
              src={theme === 'dark' ? logoDark : logoLight} 
              alt="ClickStage Pro" 
              className="h-12 w-auto"
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
            <ThemeToggle />
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
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="bg-accent hover:bg-accent/90">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;