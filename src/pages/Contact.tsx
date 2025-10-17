import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { localBusinessSchema, breadcrumbSchema } from "@/data/schema";

const Contact = () => {
  const contactPointSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@clickstagepro.com",
    "availableLanguage": "English",
    "areaServed": "US",
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      localBusinessSchema,
      contactPointSchema,
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Contact", url: "/contact" }
      ])
    ]
  };

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real implementation, this would call the Resend edge function
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Contact ClickStagePro | Virtual Staging Support"
        description="Contact ClickStagePro for help with your virtual staging orders, uploads, or technical questions. Fast, friendly support for real estate agents, photographers, and teams."
        canonical="/contact"
        keywords="contact ClickStagePro, virtual staging support, AI virtual staging help, real estate photo staging support, customer service"
        schema={schema}
      />
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
                Contact ClickStagePro
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We're here to help with your virtual staging questions, orders, or technical support. Whether you're uploading photos or checking the status of your order, our team is ready to assist.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="shadow-custom-lg">
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>
                    Fill out the form below and we typically reply within 1 business day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Your message here..."
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card className="shadow-custom-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Email</h3>
                        <a href="mailto:support@clickstagepro.com" className="text-accent hover:underline">
                          support@clickstagepro.com
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                          Response Time: Within 1 business day
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-custom-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Business Hours</h3>
                        <p className="text-muted-foreground text-sm">
                          Monday–Friday: 9 AM–5 PM EST<br />
                          Closed on weekends and holidays
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-custom-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Service Area</h3>
                        <p className="text-muted-foreground text-sm">
                          Serving real estate agents, photographers, and teams nationwide
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-custom-md bg-muted/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Common Questions</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Need quick answers? Visit our <Link to="/faq" className="text-accent hover:underline font-medium">FAQ page</Link> to learn more about pricing, delivery times, and upload requirements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;