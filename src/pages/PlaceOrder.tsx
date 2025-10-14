import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phoneNumber: z.string().trim().max(20, "Phone number must be less than 20 characters").optional(),
  transactionalConsent: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [transactionalConsent, setTransactionalConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Store contact info in localStorage for later use
      localStorage.setItem('orderContactInfo', JSON.stringify({
        ...data,
        transactionalConsent,
        marketingConsent,
      }));
      
      toast.success("Contact information saved!");
      navigate("/upload");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
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
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Optional"
                    {...register("phoneNumber")}
                    className={errors.phoneNumber ? "border-destructive" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Transactional Consent */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="transactionalConsent"
                    checked={transactionalConsent}
                    onCheckedChange={(checked) => setTransactionalConsent(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="transactionalConsent"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      By checking this box, I consent to receive transactional messages related to my account, orders, or services I have requested. These messages may include appointment reminders, order confirmations, and account notifications among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
                    </label>
                  </div>
                </div>

                {/* Marketing Consent */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketingConsent"
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="marketingConsent"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      By checking this box, I consent to receive marketing and promotional messages, including special offers, discounts, new product updates among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
                    </label>
                  </div>
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
