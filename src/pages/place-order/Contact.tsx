import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Loader2, ArrowLeft } from "lucide-react";
import { getPricingTierById } from "@/config/pricing";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress: string;
}

export default function PlaceOrderContact() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<string>("");
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    propertyAddress: ""
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Please sign in to place an order");
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      const bundleParam = searchParams.get('bundle') || sessionStorage.getItem('orderBundle');
      if (!bundleParam) {
        toast.error("Please select a bundle from the pricing page");
        navigate('/pricing');
        return;
      }

      const tier = getPricingTierById(bundleParam);
      if (!tier) {
        toast.error("Invalid bundle selection");
        navigate('/pricing');
        return;
      }

      setSelectedBundle(tier.displayName);
      sessionStorage.setItem('orderBundle', bundleParam);

      const savedContactData = sessionStorage.getItem('orderContactData');
      if (savedContactData) {
        setFormData(JSON.parse(savedContactData));
      } else {
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
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate, searchParams]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<ContactFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Phone number must be at least 10 digits";
    }

    if (!formData.propertyAddress.trim()) {
      newErrors.propertyAddress = "Property address is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile save error:', profileError);
        toast.error('Failed to save contact information');
        setLoading(false);
        return;
      }

      const bundleId = sessionStorage.getItem('orderBundle');

      const { data: orderData, error: orderError } = await supabase
        .from('staging_orders')
        .insert({
          user_id: user.id,
          bundle_selected: bundleId || '',
          address_of_property: formData.propertyAddress,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        toast.error('Failed to create order');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('orderContactData', JSON.stringify(formData));
      sessionStorage.setItem('currentOrderId', orderData.id);

      navigate('/place-order/style');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Contact Information</CardTitle>
              <CardDescription>
                Step 1 of 4 - Enter your contact details for this order
              </CardDescription>
              {selectedBundle && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected Bundle: <span className="font-bold text-foreground">{selectedBundle}</span>
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                      }}
                      placeholder="John"
                      required
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-600">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                      }}
                      placeholder="Doe"
                      required
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="john@example.com"
                    required
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="(555) 123-4567"
                    required
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Address of Property to Be Staged *</Label>
                  <Input
                    id="propertyAddress"
                    name="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={(e) => {
                      setFormData({ ...formData, propertyAddress: e.target.value });
                      if (errors.propertyAddress) setErrors({ ...errors, propertyAddress: undefined });
                    }}
                    placeholder="123 Main St, City, State 12345"
                    required
                    className={errors.propertyAddress ? "border-red-500" : ""}
                  />
                  {errors.propertyAddress && (
                    <p className="text-xs text-red-600">{errors.propertyAddress}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2F74FF] text-white font-semibold py-4 rounded-xl hover:bg-[#1F5BD4] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Select Style
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
