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

              <div className="mt-8 pt-6 border-t border-border">
                <h2 className="text-xl font-semibold mb-4">Message Types</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Order confirmations and status updates</li>
                  <li>Account notifications and security alerts</li>
                  <li>Appointment reminders</li>
                  <li>Promotional offers and special discounts (if opted in)</li>
                </ul>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
                <p>
                  You have the right to opt out of marketing messages at any time while still 
                  receiving important transactional messages about your orders. You can manage 
                  your preferences in your account settings or by replying STOP to any message.
                </p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground mb-4">
                Questions about our SMS policy?
              </p>
              <Link to="/contact">
                <span className="text-accent hover:underline font-medium">
                  Contact our support team
                </span>
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SMSPolicy;
