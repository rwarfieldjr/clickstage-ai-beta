import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

export default function PlaceOrderContact() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    propertyAddress: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Please sign in to place an order");
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('id', currentUser.id)
        .single();

      if (profile) {
        const nameParts = profile.name?.split(' ') || ['', ''];
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: profile.email || currentUser.email || '',
          phone: profile.phone || '',
          propertyAddress: ''
        });
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }

    if (!formData.lastName.trim()) {
      toast.error("Please enter your last name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!formData.propertyAddress.trim()) {
      toast.error("Please enter the property address");
      return;
    }

    sessionStorage.setItem('orderContactData', JSON.stringify(formData));

    navigate('/place-order/style');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Place Order - Contact Information | ClickStage Pro"
        description="Enter your contact information to begin your virtual staging order"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Contact Information</CardTitle>
              <CardDescription>
                Step 1 of 4 - Enter your contact details for this order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Property Address *</Label>
                  <Input
                    id="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                    placeholder="123 Main St, City, State 12345"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Continue to Select Style
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
