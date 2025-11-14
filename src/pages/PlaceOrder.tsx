import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { getPricingTierByCredits } from "@/config/pricing";
import ProgressHeader from "@/components/order/ProgressHeader";
import Step1Contact, { ContactFormData } from "@/components/order/Step1Contact";
import Step2Upload from "@/components/order/Step2Upload";
import Step3Payment from "@/components/order/Step3Payment";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface UploadedFile {
  path: string;
  url: string;
  name: string;
}

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);

  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  const [contactData, setContactData] = useState<ContactFormData | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const initOrder = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          toast.error("Please sign in to place an order");
          navigate('/auth');
          return;
        }

        setUser(currentUser);

        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', currentUser.id)
          .single();

        setUserCredits(profile?.credits || 0);

        const creditsParam = searchParams.get('credits');
        if (!creditsParam) {
          toast.error("No credit package selected. Redirecting to pricing...");
          navigate('/pricing');
          return;
        }

        const credits = parseInt(creditsParam, 10);
        if (isNaN(credits) || credits <= 0) {
          toast.error("Invalid credit amount. Redirecting to pricing...");
          navigate('/pricing');
          return;
        }

        const tier = getPricingTierByCredits(credits);
        if (!tier) {
          toast.error("Invalid credit package. Redirecting to pricing...");
          navigate('/pricing');
          return;
        }

        setSelectedCredits(credits);
        setSelectedTier(tier);
      } catch (error) {
        console.error("Init error:", error);
        toast.error("Failed to initialize order");
      } finally {
        setLoading(false);
      }
    };

    initOrder();
  }, [searchParams, navigate]);

  const handleStep1Complete = (data: ContactFormData) => {
    setContactData(data);
    setCurrentStep(2);
  };

  const handleStep2Complete = (photos: UploadedFile[]) => {
    setUploadedPhotos(photos);
    setCurrentStep(3);
  };

  const handleOrderComplete = (orderId: string) => {
    navigate(`/order-success?orderId=${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!selectedCredits || !selectedTier || !user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Place Your Virtual Staging Order - ClickStage Pro"
        description="Complete your virtual staging order in 3 easy steps"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-custom-lg">
            <CardHeader>
              <ProgressHeader currentStep={currentStep} />

              <CardTitle className="text-2xl text-center">Place Staging Order</CardTitle>
              <CardDescription className="text-center">
                {currentStep === 1 && "We'll use this information to send you updates about your staging order."}
                {currentStep === 2 && "Upload the photos you want staged. We accept JPG, PNG, HEIC, and WebP files."}
                {currentStep === 3 && "Choose how you'd like to pay for your staging order."}
              </CardDescription>

              {selectedTier && (
                <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Selected Package</p>
                    <p className="text-lg font-semibold text-accent">
                      {selectedTier.credits} Photo Credit{selectedTier.credits > 1 ? 's' : ''} - {selectedTier.price}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTier.perPhoto}
                    </p>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {currentStep === 1 && (
                <Step1Contact
                  initialData={contactData || undefined}
                  onNext={handleStep1Complete}
                />
              )}

              {currentStep === 2 && (
                <Step2Upload
                  initialPhotos={uploadedPhotos}
                  onNext={handleStep2Complete}
                  onBack={() => setCurrentStep(1)}
                  userId={user.id}
                />
              )}

              {currentStep === 3 && contactData && (
                <Step3Payment
                  creditsRequired={selectedCredits}
                  userCredits={userCredits}
                  onBack={() => setCurrentStep(2)}
                  onComplete={handleOrderComplete}
                  orderData={{
                    contact: contactData,
                    photos: uploadedPhotos,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlaceOrder;
