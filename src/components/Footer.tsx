import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">ClickStagePro</h3>
            <p className="text-sm text-muted-foreground">
              Transform your real estate photos with AI staging technology.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-accent transition-smooth">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-muted-foreground hover:text-accent transition-smooth">
                  Upload
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-accent transition-smooth">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-accent transition-smooth">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Contact Us</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              orders@clickstagepro.com
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ClickStagePro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;