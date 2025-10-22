import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";
import logoMain from "@/assets/logo-primary-optimized.webp";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-4">
              <img 
                src={logoMain} 
                alt="ClickStage Pro - Virtual Staging Powered by AI" 
                className="h-12 w-auto"
                width="142"
                height="48"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your real estate photos with AI staging technology.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>(864) 400-0766</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@clickstagepro.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Greenville, SC</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-accent transition-smooth">
                  About
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-muted-foreground hover:text-accent transition-smooth">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/styles" className="text-muted-foreground hover:text-accent transition-smooth">
                  Styles
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-accent transition-smooth">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-accent transition-smooth">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-smooth">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Account</h4>
            <ul className="space-y-2 text-sm mb-6">
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-accent transition-smooth">
                  Client Login
                </Link>
              </li>
              <li>
                <Link to="/place-order" className="text-muted-foreground hover:text-accent transition-smooth">
                  Place an Order
                </Link>
              </li>
            </ul>

            <h4 className="font-medium mb-4">Connect</h4>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/clickstagepro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-smooth"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="https://www.instagram.com/clickstagepro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-smooth"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://www.linkedin.com/company/clickstage-pro/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-smooth"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ClickStagePro. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link to="/privacy-policy" className="hover:text-accent transition-smooth">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-accent transition-smooth">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;