import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPricingTierByCredits } from "@/config/pricing";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phoneNumber: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  propertyAddress: z.string().trim().min(1, "Property address is required").max(255, "Property address must be less than 255 characters"),
});

type FormData = z.infer<typeof formSchema>;

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBundle, setSelectedBundle] = useState<any>(null);

  useEffect(() => {
    // Get credits from query params (priority)
    const creditsParam = searchParams.get('credits');
    if (creditsParam) {
      const credits = parseInt(creditsParam, 10);
      const tier = getPricingTierByCredits(credits);
      if (tier) {
        setSelectedBundle(tier);
        return;
      }
    }

    // Fallback: Get selected bundle from localStorage
    const bundleData = localStorage.getItem('selectedBundle');
    if (bundleData) {
      setSelectedBundle(JSON.parse(bundleData));
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!selectedBundle) {
      toast.error("No bundle selected. Please go back to pricing.");
      return;
    }

    // Store contact info for next step (upload photos)
    localStorage.setItem('orderContactInfo', JSON.stringify({
      ...data,
      selectedBundle,
    }));
    
    toast.success("Contact information saved!");
    navigate("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-custom-lg">
            <CardHeader>
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <span className="text-sm font-medium text-accent">Contact Info</span>
                </div>
                <div className="w-12 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Upload Photos</span>
                </div>
                <div className="w-12 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Payment</span>
                </div>
              </div>

              <CardTitle className="text-2xl text-center">Place Staging Order</CardTitle>
              <CardDescription className="text-center">
                We'll use this information to send you updates about your staging order.
              </CardDescription>

              {selectedBundle && (
                <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Selected Package</p>
                    <p className="text-lg font-semibold text-accent">
                      {selectedBundle.credits} Photo Credit{selectedBundle.credits > 1 ? 's' : ''} - {selectedBundle.price}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedBundle.perPhoto}
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    {...register("phoneNumber")}
                    className={errors.phoneNumber ? "border-destructive" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Property Address */}
                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">
                    Address of Property to Be Staged <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="propertyAddress"
                    type="text"
                    placeholder="123 Main St, City, State ZIP"
                    {...register("propertyAddress")}
                    className={errors.propertyAddress ? "border-destructive" : ""}
                  />
                  {errors.propertyAddress && (
                    <p className="text-sm text-destructive">{errors.propertyAddress.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Continue to Upload Photos"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlaceOrder;
