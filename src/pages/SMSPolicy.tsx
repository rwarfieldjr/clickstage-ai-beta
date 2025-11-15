import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const SMSPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="SMS Messaging Policy | ClickStagePro"
        description="Learn about ClickStagePro's SMS messaging policy, including consent, opt-out options, and how we protect your phone number."
        canonical="/sms-policy"
      />
      <Navbar />
      
      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <article className="max-w-3xl mx-auto bg-card rounded-lg shadow-custom-lg p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">SMS Messaging Policy</h1>
            
            <div className="space-y-6 text-foreground/90 leading-relaxed">
              <p>
                By providing your phone number, you consent to receive SMS messages from{' '}
                <strong className="text-foreground">ClickStagePro</strong> regarding your orders, 
                account activity, and occasional promotions. Message frequency may vary. 
                Message and data rates may apply.
              </p>

              <p>
                To opt out, reply <strong className="text-foreground">STOP</strong> at any time. 
                For assistance, reply <strong className="text-foreground">HELP</strong> or email us at{' '}
                <a 
                  href="mailto:support@clickstagepro.com" 
                  className="text-accent hover:underline font-medium"
                >
                  support@clickstagepro.com
                </a>.
              </p>

              <p>
                We will never sell, rent, or share your phone number with third parties. 
                For more information, please review our{' '}
                <Link 
                  to="/privacy-policy" 
                  className="text-accent hover:underline font-medium"
                >
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SMSPolicy;
