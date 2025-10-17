import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload as UploadIcon, X, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useCredits } from "@/hooks/use-credits";
import { useTheme } from "@/hooks/use-theme";
import modernFarmhouse from "@/assets/style-modern-farmhouse.jpg";
import coastal from "@/assets/style-coastal.jpg";
import scandinavian from "@/assets/style-scandinavian.jpg";
import contemporary from "@/assets/style-contemporary.jpg";
import midCentury from "@/assets/style-mid-century.jpg";
import mountainRustic from "@/assets/style-mountain-rustic.jpg";
import transitional from "@/assets/style-transitional.jpg";
import japandi from "@/assets/style-japandi.jpg";

const Upload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [stagingStyle, setStagingStyle] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [stylesDialogOpen, setStylesDialogOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [magnifiedImage, setMagnifiedImage] = useState<{ name: string; image: string } | null>(null);
  const [smsConsent, setSmsConsent] = useState(false);
  const { credits } = useCredits(user);
  const { theme } = useTheme();

  const styles = [
    { id: "modern-farmhouse", name: "Modern Farmhouse", image: modernFarmhouse, description: "Blend rustic charm with modern comfort" },
    { id: "coastal", name: "Coastal", image: coastal, description: "Relaxed beachside living with light colors" },
    { id: "scandinavian", name: "Scandinavian", image: scandinavian, description: "Minimalist Nordic design with clean lines" },
    { id: "contemporary", name: "Contemporary", image: contemporary, description: "Current trends with sleek sophistication" },
    { id: "mid-century-modern", name: "Mid-Century Modern", image: midCentury, description: "Retro 1950s-60s aesthetic" },
    { id: "mountain-rustic", name: "Mountain Rustic", image: mountainRustic, description: "Cozy cabin retreat atmosphere" },
    { id: "transitional", name: "Transitional", image: transitional, description: "Perfect balance of traditional and modern" },
    { id: "japandi", name: "Japandi", image: japandi, description: "Japanese and Scandinavian fusion" },
  ];

  const bundles = [
    { id: "single", name: "Single Photo", price: "$10", priceId: "price_1SD8lsIG3TLqP9yabBsx4jyZ", description: "Perfect for testing", photos: 1, expiration: "Credits expire 6 months after purchase." },
    { id: "5-photos", name: "5 Photos", price: "$45", priceId: "price_1SD8nJIG3TLqP9yaGAjd2WdP", description: "$9 per photo", photos: 5, expiration: "Credits expire 6 months after purchase." },
    { id: "10-photos", name: "10 Photos", price: "$85", priceId: "price_1SD8nNIG3TLqP9yazPngAIN0", description: "$8.50 per photo", photos: 10, expiration: "Credits expire 6 months after purchase." },
    { id: "20-photos", name: "20 Photos", price: "$160", priceId: "price_1SD8nQIG3TLqP9yaBVVV1coG", description: "$8 per photo", photos: 20, expiration: "Credits expire 12 months after purchase." },
    { id: "50-photos", name: "50 Photos", price: "$375", priceId: "price_1SD8nTIG3TLqP9yaTOhRMNFq", description: "$7.50 per photo", photos: 50, expiration: "Credits expire 12 months after purchase." },
    { id: "100-photos", name: "100 Photos", price: "$700", priceId: "price_1SD8nWIG3TLqP9yaH0D0oIpW", description: "$7 per photo", photos: 100, expiration: "Credits expire 12 months after purchase." },
  ];

  useEffect(() => {
    // Check for selected bundle from localStorage (from place-order page)
    const orderData = localStorage.getItem('orderContactInfo');
    if (orderData) {
      const parsedData = JSON.parse(orderData);
      if (parsedData.selectedBundle && parsedData.selectedBundle.priceId) {
        const matchingBundle = bundles.find(b => b.priceId === parsedData.selectedBundle.priceId);
        if (matchingBundle) {
          setSelectedBundle(matchingBundle.id);
        }
      }
    }

    // Check if user is already logged in (optional)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png"
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only JPEG and PNG files are allowed");
    }

    setFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(
      (file) => file.type === "image/jpeg" || file.type === "image/png"
    );

    if (validFiles.length !== droppedFiles.length) {
      toast.error("Only JPEG and PNG files are allowed");
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);

      // Create previews
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!stagingStyle) {
      toast.error("Please select a staging style");
      return;
    }

    if (!selectedBundle) {
      toast.error("Please select a bundle");
      return;
    }

    // Check if uploaded photos exceed selected bundle limit
    const bundle = bundles.find(b => b.id === selectedBundle);
    if (bundle && files.length > bundle.photos) {
      toast.error(`You have uploaded ${files.length} photos but selected the ${bundle.name} package. Please remove ${files.length - bundle.photos} photo${files.length - bundle.photos > 1 ? 's' : ''} or select a larger package.`);
      return;
    }

    setLoading(true);

    try {
      // Get contact info from localStorage (from place-order page)
      const orderContactInfo = localStorage.getItem('orderContactInfo');
      if (!orderContactInfo) {
        toast.error("Please start from the pricing page to place an order");
        navigate("/pricing");
        return;
      }
      
      const contactInfo = JSON.parse(orderContactInfo);
      
      // Find the selected bundle
      const bundle = bundles.find(b => b.id === selectedBundle);
      if (!bundle) {
        throw new Error("Selected bundle not found");
      }

      // Generate a unique session ID for this upload
      const sessionId = crypto.randomUUID();

      // Upload files to temporary storage (public bucket, anyone can upload)
      toast.loading("Uploading photos...");
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `temp/${sessionId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("original-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        return fileName;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      toast.dismiss();

      // Create checkout session with file references
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: bundle.priceId,
          contactInfo: {
            email: contactInfo.email,
            firstName: contactInfo.firstName,
            lastName: contactInfo.lastName,
            phoneNumber: contactInfo.phoneNumber,
          },
          files: uploadedFiles,
          stagingStyle: stagingStyle,
          photosCount: bundle.photos,
          sessionId: sessionId,
        },
      });

      if (error) throw error;

      if (data?.url) {
        toast.success("Opening payment page...");
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to process checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Upload Photos | Virtual Staging Order"
        description="Upload your property photos to start an AI virtual staging order with ClickStagePro. Fast, affordable, and MLS-compliant results delivered within 24 hours."
        canonical="/upload"
        keywords="upload virtual staging photos, AI virtual staging order, real estate photo upload, MLS compliant virtual staging, ClickStagePro order"
      />
      <Navbar />

      <main className="flex-1 py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto shadow-custom-lg">
            <CardHeader>
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 overflow-x-auto">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    ✓
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">Contact Info</span>
                </div>
                <div className="w-6 sm:w-12 h-0.5 bg-border shrink-0"></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold shrink-0">
                    2
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-accent whitespace-nowrap">Upload Photos</span>
                </div>
                <div className="w-6 sm:w-12 h-0.5 bg-border shrink-0"></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    3
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Payment</span>
                </div>
              </div>

              <CardTitle className="text-2xl md:text-3xl">Upload Your Photos</CardTitle>
              <CardDescription className="text-base md:text-lg mt-2">
                Start your AI virtual staging order in minutes. Simply upload your property photos, choose your bundle, and select your design style. We'll deliver photorealistic, MLS-compliant staged images within 24 hours.
                {user && <span className="block mt-3 font-medium text-accent">Available Credits: {credits}</span>}
              </CardDescription>
              <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                <h3 className="text-base font-semibold mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li><strong>Upload:</strong> Add your photos directly from your device or cloud storage.</li>
                  <li><strong>Select Style:</strong> Choose your preferred design look — Modern Farmhouse, Coastal, and more.</li>
                  <li><strong>Place Order:</strong> Confirm your bundle and complete checkout securely with Stripe.</li>
                  <li><strong>Receive Images:</strong> Get professionally staged photos within 24 hours, ready for MLS or marketing.</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  Not sure which bundle to choose? <Link to="/pricing" className="text-accent hover:underline font-medium">View pricing details</Link>.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Staging Style */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="staging-style">Step 1: Staging Style <span className="text-destructive">*</span></Label>
                    <Dialog open={stylesDialogOpen} onOpenChange={setStylesDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm text-accent hover:underline font-medium"
                        >
                          Click Here to See Styles
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Available Staging Styles</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {styles.map((style) => (
                            <div
                              key={style.id}
                              className="rounded-xl overflow-hidden border border-border hover:border-accent transition-smooth"
                            >
                              <div 
                                className="relative cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMagnifiedImage({ name: style.name, image: style.image });
                                }}
                              >
                                <img
                                  src={style.image}
                                  alt={style.name}
                                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-white/90 rounded-full p-3 transform transition-transform group-hover:scale-110">
                                    <ZoomIn className="w-6 h-6 text-accent" />
                                  </div>
                                </div>
                              </div>
                              <div 
                                className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                                onClick={() => {
                                  setStagingStyle(style.id);
                                  setStylesDialogOpen(false);
                                }}
                              >
                                <h3 className="text-lg font-semibold mb-2">{style.name}</h3>
                                <p className="text-sm text-muted-foreground">{style.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select value={stagingStyle} onValueChange={setStagingStyle} required>
                    <SelectTrigger id="staging-style">
                      <SelectValue placeholder="Select a staging style" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      <SelectItem value="modern-farmhouse">Modern Farmhouse</SelectItem>
                      <SelectItem value="coastal">Coastal</SelectItem>
                      <SelectItem value="scandinavian">Scandinavian</SelectItem>
                      <SelectItem value="contemporary">Contemporary</SelectItem>
                      <SelectItem value="mid-century-modern">Mid-Century Modern</SelectItem>
                      <SelectItem value="shabby-chic">Shabby Chic</SelectItem>
                      <SelectItem value="mountain-rustic">Mountain Rustic</SelectItem>
                      <SelectItem value="transitional">Transitional</SelectItem>
                      <SelectItem value="japandi">Japandi</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: File Upload */}
                <div className="space-y-2">
                  <Label>Step 2: Property Photos (JPEG or PNG) <span className="text-destructive">*</span></Label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-smooth cursor-pointer ${
                      isDragOver 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">
                        Drop files here or click to upload
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPEG and PNG up to 20MB each
                      </p>
                    </label>
                  </div>
                </div>

                {/* File Previews */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-smooth"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 3: Select Bundle */}
                <div className="space-y-3">
                  <Label>Step 3: Select Bundle <span className="text-destructive">*</span></Label>
                  <RadioGroup value={selectedBundle} onValueChange={setSelectedBundle}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bundles.map((bundle) => (
                        <div key={bundle.id} className="relative">
                          <RadioGroupItem
                            value={bundle.id}
                            id={bundle.id}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={bundle.id}
                            className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-smooth ${
                              selectedBundle === bundle.id
                                ? 'border-accent bg-accent/5'
                                : 'border-border hover:border-accent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-lg">{bundle.name}</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-smooth ${
                                selectedBundle === bundle.id
                                  ? 'border-accent bg-accent'
                                  : 'border-border'
                              }`}>
                                {selectedBundle === bundle.id && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-accent mb-1">{bundle.price}</span>
                            <span className="text-sm text-muted-foreground block mb-2">{bundle.description}</span>
                            <span className="text-xs text-muted-foreground">{bundle.expiration}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                   </RadioGroup>
                   {selectedBundle && files.length > 0 && (() => {
                     const bundle = bundles.find(b => b.id === selectedBundle);
                     if (bundle && files.length > bundle.photos) {
                       return (
                         <div className="p-4 border-2 border-destructive/50 bg-destructive/10 rounded-xl">
                           <p className="text-sm text-destructive font-medium">
                             ⚠️ You have uploaded {files.length} photo{files.length > 1 ? 's' : ''} but selected the {bundle.name} package which allows only {bundle.photos} photo{bundle.photos > 1 ? 's' : ''}. 
                             Please remove {files.length - bundle.photos} photo{files.length - bundle.photos > 1 ? 's' : ''} or select a larger package.
                           </p>
                         </div>
                       );
                     }
                     return null;
                   })()}
                </div>

                {/* SMS Consent Checkbox */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="sms-consent"
                    checked={smsConsent}
                    onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                    required
                    className="mt-0.5"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="sms-consent"
                      className="text-sm leading-relaxed cursor-pointer text-muted-foreground"
                    >
                      By checking this box, you agree to receive text messages from{' '}
                      <strong className="text-foreground">ClickStagePro</strong> related to your order, 
                      account updates, and occasional offers. Message & data rates may apply. 
                      Reply <strong className="text-foreground">STOP</strong> to opt out or{' '}
                      <strong className="text-foreground">HELP</strong> for help. See our{' '}
                      <Link 
                        to="/sms-policy" 
                        target="_blank"
                        className="text-accent hover:underline"
                      >
                        SMS Messaging Policy
                      </Link>.
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                  disabled={!smsConsent || loading || (() => {
                    const bundle = bundles.find(b => b.id === selectedBundle);
                    return bundle && files.length > bundle.photos;
                  })()}
                >
                  {loading ? "Processing..." : "Complete Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />

      {/* Magnified Image Dialog */}
      <Dialog open={!!magnifiedImage} onOpenChange={() => setMagnifiedImage(null)}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl">{magnifiedImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            <img
              src={magnifiedImage?.image}
              alt={magnifiedImage?.name}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Upload;