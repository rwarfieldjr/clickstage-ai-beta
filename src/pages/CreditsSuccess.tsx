import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";

export default function CreditsSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success("Credits successfully added to your account!");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Purchase Successful - ClickStage Pro"
        description="Your credit purchase was successful."
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground">
              Your credits have been successfully added to your account. You can now use them to stage your photos.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => navigate("/upload")}
                variant="outline"
                className="w-full"
              >
                Start Staging Photos
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
