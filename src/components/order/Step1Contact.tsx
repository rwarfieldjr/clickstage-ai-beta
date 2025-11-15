import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number must be less than 20 characters").regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format"),
  propertyAddress: z.string().trim().min(1, "Property address is required").max(255, "Property address must be less than 255 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface Step1ContactProps {
  initialData?: Partial<ContactFormData>;
  onNext: (data: ContactFormData) => void;
}

export default function Step1Contact({ initialData, onNext }: Step1ContactProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="firstName"
          {...register("firstName")}
          className={errors.firstName ? "border-destructive" : ""}
          placeholder="John"
        />
        {errors.firstName && (
          <p className="text-sm text-destructive">{errors.firstName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="lastName"
          {...register("lastName")}
          className={errors.lastName ? "border-destructive" : ""}
          placeholder="Doe"
        />
        {errors.lastName && (
          <p className="text-sm text-destructive">{errors.lastName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          className={errors.phone ? "border-destructive" : ""}
          placeholder="(555) 123-4567"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyAddress">
          Address of Property to Be Staged <span className="text-destructive">*</span>
        </Label>
        <Input
          id="propertyAddress"
          {...register("propertyAddress")}
          className={errors.propertyAddress ? "border-destructive" : ""}
          placeholder="123 Main St, City, State ZIP"
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
  );
}
