import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import StylesModal, { STAGING_STYLES } from "@/components/StylesModal";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";

export default function PlaceOrderStyle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [showStylesModal, setShowStylesModal] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Please sign in to place an order");
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      const contactData = sessionStorage.getItem('orderContactData');
      if (!contactData) {
        toast.error("Please complete contact information first");
        navigate('/place-order/contact');
        return;
      }

      const savedStyle = sessionStorage.getItem('orderStyle');
      if (savedStyle) {
        setSelectedStyle(savedStyle);
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStyle) {
      setShowValidationError(true);
      toast.error("Please select a staging style");
      return;
    }

    setShowValidationError(false);

    setLoading(true);

    try {
      const orderId = sessionStorage.getItem('currentOrderId');
      if (!orderId) {
        toast.error('Order not found. Please start from the beginning.');
        navigate('/place-order/contact');
        return;
      }

      const { error } = await supabase
        .from('staging_orders')
        .update({ staging_style: selectedStyle })
        .eq('id', orderId);

      if (error) {
        console.error('Style update error:', error);
        toast.error('Failed to save staging style');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('orderStyle', selectedStyle);
      navigate('/place-order/upload');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/place-order/contact');
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
        title="Select Staging Style | ClickStage Pro"
        description="Choose the perfect staging style for your property"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contact Info
          </Button>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Select Your Staging Style</CardTitle>
              <CardDescription>
                Step 2 of 4 - Choose the design style that best suits your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="style">Staging Style *</Label>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowStylesModal(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Click Here to See Styles
                    </Button>
                  </div>

                  <Select
                    value={selectedStyle}
                    onValueChange={(value) => {
                      setSelectedStyle(value);
                      setShowValidationError(false);
                    }}
                  >
                    <SelectTrigger
                      id="style"
                      className={`w-full font-semibold ${!selectedStyle ? 'text-gray-500' : 'text-[#1A2B49]'} ${showValidationError ? 'border-red-500' : ''}`}
                    >
                      <SelectValue
                        placeholder="Select Your Staging Style"
                        className="font-semibold text-[#1A2B49]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGING_STYLES.map((style) => (
                        <SelectItem
                          key={style.id}
                          value={style.id}
                          className="hover:bg-blue-50 focus:bg-[#2F74FF] focus:text-white cursor-pointer"
                        >
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {showValidationError && !selectedStyle && (
                    <p className="text-sm text-red-600 mt-1">
                      Please select a staging style before continuing.
                    </p>
                  )}

                  {selectedStyle && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Selected:</strong> {STAGING_STYLES.find(s => s.id === selectedStyle)?.name}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        {STAGING_STYLES.find(s => s.id === selectedStyle)?.description}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#003A70] hover:bg-[#002850] text-white"
                  size="lg"
                  disabled={!selectedStyle}
                >
                  Continue to Upload Photos
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <StylesModal open={showStylesModal} onOpenChange={setShowStylesModal} />

      <Footer />
    </div>
  );
}
